// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IWETH9} from "./interfaces/IWETH9.sol";
import {IUniswapV2Router} from "./interfaces/IUniswapV2Router.sol";
import {ICEther, ICToken, CompoundBase} from "./CompoundBase.sol";
import {UniswapBase} from "./UniswapBase.sol";

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

import {IOracle, IOracleRef, Decimal} from "./refs/OracleRef.sol";

//refactor constant.sol

contract LongPosition is Pausable, CompoundBase, UniswapBase {
    using Address for address;
    using Decimal for Decimal.D256;
    using SafeERC20 for IERC20;

    IWETH9 immutable WETH;
    // IUniswapV2Router immutable router;
    uint256 public immutable BASIS_POINTS_GRANULARITY = 10_000;
    uint256 public immutable leverage = 3_000;
    // uint256 private immutable MAX = ~uint256(0);

    IOracleRef public borrowOracle;
    IOracleRef public supplyOracle;

    ICEther public cTokenToSupply;
    ICToken public cTokenToBorrow;

    struct Position {
        uint256 id;
        address owner;
        bool isActive;
        uint256 depositAmount;
        uint256 borrowAmount;
        uint256 leverageAmount;
    }

    mapping(uint256 => Position) positions;
    uint256 currentPosionId = 1;

    constructor(
        address _weth,
        address _router,
        address _comptroller,
        address _cEther,
        address _borrowOracle,
        address _supplyOracle,
        address _cTokenToSupply,
        address _cTokenToBorrow
    ) CompoundBase(_comptroller, _cEther) UniswapBase(_router) {
        require(
            _weth != address(0) &&
                _borrowOracle != address(0) &&
                _supplyOracle != address(0) &&
                _cTokenToSupply != address(0) &&
                _cTokenToBorrow != address(0),
            "account cannot be the zero address"
        );
        WETH = IWETH9(_weth);
        borrowOracle = IOracleRef(_borrowOracle);
        supplyOracle = IOracleRef(_supplyOracle);
        cTokenToSupply = ICEther(_cTokenToSupply);
        require(cTokenToSupply.isCToken(), "Not a cToken");
        cTokenToBorrow = ICToken(_cTokenToBorrow);
        require(cTokenToBorrow.isCToken(), "Not a cToken");
        IERC20(cTokenToBorrow.underlying()).approve(
            address(router),
            type(uint256).max
        );
        IERC20(cTokenToBorrow.underlying()).approve(
            address(cTokenToBorrow),
            type(uint256).max
        );
    }

    receive() external payable {}

    function openPosition() external payable whenNotPaused returns (uint256) {
        require(msg.value > 0, "must send arbitary amount of ether along with");
        Position storage currentPosition = positions[currentPosionId];
        require(
            currentPosition.isActive == false,
            "position is already active"
        );
        currentPosition.isActive = true;
        currentPosition.id = currentPosionId;
        currentPosition.owner = msg.sender;

        (
            uint256 supplyAmount,
            uint256 borrowAmount,
            uint256 leverageAmount
        ) = _openPosition();

        currentPosition.depositAmount = supplyAmount;
        currentPosition.borrowAmount = borrowAmount;
        currentPosition.leverageAmount = leverageAmount;

        return leverageAmount;
    }

    function closePosition() external whenNotPaused {
        Position storage currentPosition = positions[currentPosionId];

        require(
            currentPosition.isActive == true,
            "current position must be active"
        );

        currentPosition.isActive = false;

        require(
            currentPosition.owner == msg.sender,
            "only position owner can withdraw"
        );

        currentPosition.depositAmount = 0;
        currentPosition.borrowAmount = 0;

        _closePosition();
        currentPosition.leverageAmount = 0;
        currentPosionId++;
    }

    function _openPosition()
        private
        returns (
            uint256 supplyAmount,
            uint256 borrowAmount,
            uint256 leverageAmount
        )
    {
        // Position storage currentPosition = positions[currentPosionId];

        //supply
        supplyAmount = msg.value;
        // currentPosition.depositAmount = amountToSupply;
        supply(address(cTokenToSupply), supplyAmount);

        //borrow
        supplyOracle.updateOracle();
        uint256 usdValueIncollateral = supplyOracle
            .readOracle()
            .mul(supplyAmount)
            .asUint256();
        Decimal.D256 memory maxLeverage = getMaxLeverage();
        borrowAmount = maxLeverage.mul(usdValueIncollateral).asUint256();

        enterMarket(address(cTokenToSupply));
        borrowOracle.updateOracle();
        uint256 maxBorrowAmount = getMaxBorrowAmount();

        if (borrowAmount > maxBorrowAmount) borrowAmount = maxBorrowAmount;
        // currentPosition.borrowAmount = amountToBorrow;

        borrow(address(cTokenToBorrow), borrowAmount);

        //buy ETH
        leverageAmount = buyETH(borrowAmount, cTokenToBorrow.underlying());
        // currentPosition.leverageAmount = amountETHOut;

        // address[] memory path = new address[](2);
        // path[0] = cTokenToBorrow.underlying();
        // path[1] = address(WETH);

        // uint256 amountETHOut = router.swapExactTokensForETH(
        //     amountToBorrow,
        //     0,
        //     path,
        //     address(this),
        //     block.timestamp
        // )[1];

        // return amountETHOut;
    }

    function _closePosition() private {
        Position memory currentPosition = positions[currentPosionId];

        // sell ETH
        sellETH(currentPosition.leverageAmount, cTokenToBorrow.underlying());
        // address[] memory path = new address[](2);
        // path[0] = address(WETH);
        // path[1] = cTokenToBorrow.underlying();

        // router.swapExactETHForTokens{value: currentPosition.leverageAmount}(
        //     0,
        //     path,
        //     address(this),
        //     block.timestamp
        // )[1];

        // repay borrow
        uint256 borrowedAmount = cTokenToBorrow.borrowBalanceCurrent(
            address(this)
        );

        repayBorrow(address(cTokenToBorrow), borrowedAmount);

        // redeem
        uint256 suppliedAmount = cTokenToSupply.balanceOfUnderlying(
            address(this)
        );

        redeemUnderliying(address(cTokenToSupply), suppliedAmount);

        uint256 profitAmount = IERC20(cTokenToBorrow.underlying()).balanceOf(
            address(this)
        );

        IERC20(cTokenToBorrow.underlying()).safeTransfer(
            msg.sender,
            profitAmount
        );

        Address.sendValue(payable(msg.sender), address(this).balance);
        // emit WithdrawETH(msg.sender, to, address(this).balance);

        claimComp();
        uint256 bonusAmount = IERC20(getCompAddress()).balanceOf(address(this));
        IERC20(getCompAddress()).safeTransfer(msg.sender, bonusAmount);
    }

    function getMaxBorrowAmount() public view returns (uint256) {
        uint256 liquidity = getAccountLiquidity();

        // (DAI per USD) x (USD per ETH)
        uint256 maxAmountInBorrowedToken = borrowOracle
            .readOracle()
            .mul(liquidity)
            .asUint256();
        //hardcode decimal
        // uint256 maxBorrow = (liquidity * (10**18)) / price;

        return maxAmountInBorrowedToken;
    }

    function getMaxLeverage() public pure returns (Decimal.D256 memory) {
        uint256 granularity = BASIS_POINTS_GRANULARITY;
        // uint256 granularity = Constants.BASIS_POINTS_GRANULARITY;
        return Decimal.ratio(leverage, granularity);
    }

    // function getCurrentDepositAmount() external view returns (uint256) {
    //     Position memory currentPosition = positions[currentPosionId];
    //     return currentPosition.depositAmount;
    // }

    // function getCurrentBorrowAmount() external view returns (uint256) {
    //     Position memory currentPosition = positions[currentPosionId];
    //     return currentPosition.borrowAmount;
    // }

    // function getCurrentLeveragAmount() external view returns (uint256) {
    //     Position memory currentPosition = positions[currentPosionId];
    //     return currentPosition.leverageAmount;
    // }
}
