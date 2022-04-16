// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.8.13;

import "./IERC20.sol";

/// @title Interface for WETH9
interface IWETH9 is IERC20 {
    function deposit() external payable;

    function transfer(address to, uint256 value) external returns (bool);

    function withdraw(uint256) external;
}
