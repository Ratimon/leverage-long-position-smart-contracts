// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

interface ICEther {
    function mint() external payable;

    function redeem(uint256 redeemTokens) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    function borrow(uint256 borrowAmount) external returns (uint256);

    function repayBorrow() external payable;

    function totalBorrows() external returns (uint256);

    function borrowBalanceCurrent(address account) external returns (uint256);

    function borrowBalanceStored(address account) external returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function balanceOfUnderlying(address account) external returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function isCToken() external view returns (bool);
}
