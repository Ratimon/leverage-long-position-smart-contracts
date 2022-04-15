// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IUniswapV2Router} from "./interfaces/IUniswapV2Router.sol";
import {ICEther, ICToken, CompoundBase} from "./CompoundBase.sol";
import {UniswapBase} from "./UniswapBase.sol";

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

import {IOracle, IOracleRef, Decimal} from "./refs/OracleRef.sol";

contract LongPosition is Pausable, CompoundBase, UniswapBase {
    using Address for address;
    using Decimal for Decimal.D256;
    using SafeERC20 for IERC20;

    uint256 public immutable BASIS_POINTS_GRANULARITY = 10_000;
    uint256 public immutable leverage = 3_000;

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
        address _router,
        address _comptroller,
        address _cEther,
        address _borrowOracle,
        address _supplyOracle,
        address _cTokenToSupply,
        address _cTokenToBorrow
    ) CompoundBase(_comptroller, _cEther) UniswapBase(_router) {
        require(
            _borrowOracle != address(0) &&
                _supplyOracle != address(0) &&
                _cTokenToSupply != address(0) &&
                _cTokenToBorrow != address(0),
            "account cannot be the zero address"
        );
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
        //supply
        supplyAmount = msg.value;
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
        borrow(address(cTokenToBorrow), borrowAmount);

        //buy ETH
        leverageAmount = buyETH(borrowAmount, cTokenToBorrow.underlying());
    }

    function _closePosition() private {
        Position memory currentPosition = positions[currentPosionId];

        // sell ETH
        sellETH(currentPosition.leverageAmount, cTokenToBorrow.underlying());

        // repay borrow
        uint256 amountToRepay = cTokenToBorrow.borrowBalanceCurrent(
            address(this)
        );

        repayBorrow(address(cTokenToBorrow), amountToRepay);

        // redeem
        uint256 amountToSettled = cTokenToSupply.balanceOfUnderlying(
            address(this)
        );

        redeemUnderliying(address(cTokenToSupply), amountToSettled);

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

        // (DAI per USD)
        Decimal.D256 memory inverted = borrowOracle.invert(
            borrowOracle.readOracle()
        );

        // (DAI per USD) x (USD per ETH)
        uint256 maxAmountInBorrowedToken = inverted.mul(liquidity).asUint256();

        return maxAmountInBorrowedToken;
    }

    function getMaxLeverage() public pure returns (Decimal.D256 memory) {
        uint256 granularity = BASIS_POINTS_GRANULARITY;
        return Decimal.ratio(leverage, granularity);
    }

    function getCurrentDepositAmount() external view returns (uint256) {
        Position memory currentPosition = positions[currentPosionId];
        return currentPosition.depositAmount;
    }

    function getCurrentBorrowAmount() external view returns (uint256) {
        Position memory currentPosition = positions[currentPosionId];
        return currentPosition.borrowAmount;
    }

    function getCurrentLeverageAmount() external view returns (uint256) {
        Position memory currentPosition = positions[currentPosionId];
        return currentPosition.leverageAmount;
    }

    function getTotalExposure() external view returns (uint256) {
        Position memory currentPosition = positions[currentPosionId];
        return (currentPosition.depositAmount + currentPosition.leverageAmount);
    }

    function getExpectedUniSwapOutput() public view returns (uint256) {
        Position memory currentPosition = positions[currentPosionId];

        return
            getAmountsOut(
                currentPosition.leverageAmount,
                router.WETH(),
                cTokenToBorrow.underlying()
            );
    }

    function getExpectedProfitInUsd() external view returns (uint256) {
        uint256 amountToRepay = cTokenToBorrow.borrowBalanceStored(
            address(this)
        );

        uint256 usdValueInCost = borrowOracle
            .readOracle()
            .mul(amountToRepay)
            .asUint256();

        uint256 amountToReceieve = getExpectedUniSwapOutput();

        uint256 usdValueInSale = supplyOracle
            .readOracle()
            .mul(amountToReceieve)
            .asUint256();

        if (usdValueInSale > usdValueInCost) {
            return usdValueInSale - usdValueInCost;
        } else {
            return usdValueInCost - usdValueInSale;
        }
    }
}
