// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IWETH9} from "./interfaces/IWETH9.sol";
import {IUniswapV2Router} from "./interfaces/IUniswapV2Router.sol";
import {ICEther, ICToken, CompoundBase} from "./CompoundBase.sol";

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

import {IOracle, IOracleRef, Decimal} from "./refs/OracleRef.sol";

//refactor constant.sol

contract LongPosition is Pausable, CompoundBase {
    using Address for address;
    using Decimal for Decimal.D256;
    using SafeERC20 for IERC20;

    IWETH9 immutable WETH;
    IUniswapV2Router immutable router;
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
    }

    mapping(uint256 => Position) positions;
    uint256 currentPosionId = 1;

    constructor(
        address _comptroller,
        address _cEther,
        address _borrowOracle,
        address _supplyOracle,
        address _cTokenToSupply,
        address _cTokenToBorrow
    ) CompoundBase(_comptroller, _cEther) {
        borrowOracle = IOracleRef(_borrowOracle);
        supplyOracle = IOracleRef(_supplyOracle);
        WETH = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
        router = IUniswapV2Router(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
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
        // sanity check

        Position storage currentPosition = positions[currentPosionId];
        // positions[nextPosionId] = currentPosition;

        require(
            currentPosition.isActive == false,
            "position is already active"
        );

        currentPosition.isActive = true;

        // require(
        //     currentPosionId == currentPosition.id,
        //     "the previous position hasnt been closed"
        // );

        currentPosition.id = currentPosionId;
        currentPosition.owner = msg.sender;

        //supply
        uint256 amountToSupply = msg.value;
        currentPosition.depositAmount = amountToSupply;
        supply(address(cTokenToSupply), amountToSupply);

        //borrow
        supplyOracle.updateOracle();
        uint256 usdValueIncollateral = supplyOracle
            .readOracle()
            .mul(amountToSupply)
            .asUint256();
        Decimal.D256 memory maxLeverage = getMaxLeverage();
        uint256 amountToBorrow = maxLeverage
            .mul(usdValueIncollateral)
            .asUint256();
        enterMarket(address(cTokenToSupply));
        borrowOracle.updateOracle();
        uint256 maxBorrowAmount = getMaxBorrowAmount();
        if (amountToBorrow > maxBorrowAmount) amountToBorrow = maxBorrowAmount;
        currentPosition.borrowAmount = amountToBorrow;

        borrow(address(cTokenToBorrow), amountToBorrow);

        //buy ETH
        address[] memory path = new address[](2);
        path[0] = cTokenToBorrow.underlying();
        path[1] = address(WETH);

        uint256 amountOut = router.swapExactTokensForETH(
            amountToBorrow,
            0,
            path,
            address(this),
            block.timestamp
        )[1];

        // currentPosionId++;

        return amountOut;
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

        // require(
        //     currentPosionId == currentPosition.id,
        //     "the position has closed"
        // );

        currentPosionId++;

        // sell ETH
        address[] memory path = new address[](2);
        path[0] = address(WETH);
        path[1] = cTokenToBorrow.underlying();

        router.swapExactETHForTokens{value: address(this).balance}(
            1,
            path,
            address(this),
            block.timestamp
        )[1];

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

    // function _openPosition() internal {
    // }

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

    // function atLeverageLevel() public view override returns (bool) {
    //     return totalPurchased >= scale;
    // }

    // function getBorrowAmount(uint256 amountIn)
    //     public
    //     view
    //     override
    //     returns (
    //         uint256 amountOut
    //     )
    // {}
}
