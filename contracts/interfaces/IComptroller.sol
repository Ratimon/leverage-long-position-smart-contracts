// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

interface IComptroller {
    function enterMarkets(address[] calldata cTokens)
        external
        returns (uint256[] memory);

    function claimComp(address holder) external;

    function getAccountLiquidity(address account)
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        );

    function getCompAddress() external view returns (address);

    function redeemAllowed(
        address cToken,
        address redeemer,
        uint256 redeemTokens
    ) external returns (uint256);
}
