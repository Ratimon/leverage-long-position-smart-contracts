// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IWETH9} from "./interfaces/IWETH9.sol";
import {IComptroller} from "./interfaces/IComptroller.sol";
import {ICEther} from "./interfaces/ICEther.sol";
import {ICToken} from "./interfaces/ICToken.sol";

import {IOracle, OracleRef, Decimal} from "./refs/OracleRef.sol";

//refactor constant.sol

contract LongPosition is OracleRef {
    using Decimal for Decimal.D256;

    error CompoundLending_cTokenMint();
    error CompoundLending_cTokenRedeem();
    error CompoundLending_comptrollerEntermarket();
    error CompoundLending_cTokenBorrow();
    error CompoundLending_cTokenRepayborrow();

    IWETH9 immutable WETH;
    uint256 public immutable BASIS_POINTS_GRANULARITY = 10_000;
    uint256 public immutable leverage = 3_000;

    IOracle public collateralizationOracle;

    IComptroller public comptroller;

    ICEther public cTokenToSupply;
    ICToken public cTokenToBorrow;

    constructor(
        address _oracle,
        address _backupOracle,
        bool _isInvert,
        address _collateralizationOracle,
        address _comptroller,
        address _cTokenToSupply,
        address _cTokenToBorrow
    )
        // uint256 _leverage
        OracleRef(_oracle, _backupOracle, 0, _isInvert)
    {
        collateralizationOracle = IOracle(_collateralizationOracle);
        comptroller = IComptroller(_comptroller);
        WETH = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
        cTokenToSupply = ICEther(_cTokenToSupply);
        cTokenToBorrow = ICToken(_cTokenToBorrow);
        // leverage = _leverage;
    }

    receive() external payable {}

    // function supply() external payable {
    //     cTokenToSupply.mint{value: msg.value}();
    // }

    function openPosition() external payable {
        //supply
        // sanity check
        uint256 amountToSupply = msg.value;
        cTokenToSupply.mint{value: amountToSupply}();

        (
            Decimal.D256 memory collateralPrice,
            bool valid
        ) = collateralizationOracle.read();
        require(valid, "oracle invalid");

        uint256 usdValueIncollateral = collateralPrice
            .mul(amountToSupply)
            .asUint256();

        Decimal.D256 memory maxLeverage = getMaxLeverage();

        uint256 amountToBorrow = maxLeverage
            .mul(usdValueIncollateral)
            .asUint256();

        ////
        //borrow
        updateOracle();

        // ICEther cEther = ICEther(_cToken);
        uint256 result = cTokenToSupply.borrow(amountToBorrow);

        if (result != 0) revert CompoundLending_cTokenBorrow();
    }

    // function _openPosition() internal {
    //     updateOracle();
    //     // ICEther cEther = ICEther(_cToken);
    //     uint256 result = cTokenToSupply.borrow(_borrowAmount);

    //     if (result != 0) revert CompoundLending_cTokenBorrow();
    // }

    function getMaxBorrowAmount() external view returns (uint256) {
        (uint256 error, uint256 liquidity, uint256 shortfall) = comptroller
            .getAccountLiquidity(address(this));

        require(error == 0, "error");
        require(shortfall == 0, "shortfall > 0");
        require(liquidity > 0, "liquidity = 0");

        // uint256 usdPerBorrowedToken = priceFeed.getUnderlyingPrice(
        //     address(cTokenToBorrow)
        // );

        // liquidirtInBorrowedToken =  (DAI per USD) x (USD per ETH)
        uint256 maxAmountInBorrowedToken = readOracle()
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
