// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import {Decimal} from "./refs/OracleRef.sol";

/// @title LongPosition interface
interface ILongPosition {
    // ----------- Events -----------

    event PositionUpdate(
        uint256 indexed id,
        address indexed owner,
        bool oldIsActive,
        bool newIsActive,
        uint256 oldDepositAmount,
        uint256 newDepositAmount,
        uint256 oldBorrowAmount,
        uint256 newBorrowAmount,
        uint256 oldLeverageAmount,
        uint256 newLeverageAmount
    );

    event Deposit(address indexed _from, uint256 _amount);

    event WithdrawERC20(
        address indexed _caller,
        address indexed _token,
        address indexed _to,
        uint256 _amount
    );

    event WithdrawETH(
        address indexed _caller,
        address indexed _to,
        uint256 _amount
    );

    // ----------- State changing API -----------

    function openPosition() external payable returns (uint256);

    function closePosition() external;

    // ----------- Getters -----------

    function getMaxBorrowAmount() external view returns (uint256);

    function getMaxLeverage() external pure returns (Decimal.D256 memory);

    function isCurrentPositionActive() external view returns (bool);

    function getCurrentDepositAmount() external view returns (uint256);

    function getCurrentBorrowAmount() external view returns (uint256);

    function getCurrentLeverageAmount() external view returns (uint256);

    function getTotalExposure() external view returns (uint256);

    function getExpectedUniSwapOutput() external view returns (uint256);

    function getCurrentETHPrice()
        external
        view
        returns (uint256 currentETHPrice);

    function getExpectedProfitInUsd() external view returns (uint256);
}
