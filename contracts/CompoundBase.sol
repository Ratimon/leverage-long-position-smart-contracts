// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IComptroller} from "./interfaces/IComptroller.sol";
import {ICEther} from "./interfaces/ICEther.sol";
import {ICToken} from "./interfaces/ICToken.sol";

contract CompoundBase {
    error CompoundLending_cTokenMint();
    error CompoundLending_cTokenRedeem();
    error CompoundLending_comptrollerEntermarket();
    error CompoundLending_cTokenBorrow();
    error CompoundLending_cTokenRepayborrow();

    IComptroller public immutable comptroller;
    ICEther public immutable cEther;

    //sanity

    constructor(address _comptroller, address _cEther) {
        comptroller = IComptroller(_comptroller);
        cEther = ICEther(_cEther);
    }

    function supply(address _cTokenAddress, uint256 _underlyingAmount)
        internal
    {
        if (_cTokenAddress == address(cEther)) {
            _supplyETH(_cTokenAddress, _underlyingAmount);
        } else {
            _supplyERC20(_cTokenAddress, _underlyingAmount);
        }
    }

    function _supplyETH(address _cTokenAddress, uint256 _underlyingAmount)
        private
    {
        require(msg.value > 0, "must send ether along");
        ICEther cToken = ICEther(_cTokenAddress);
        cToken.mint{value: _underlyingAmount}();
    }

    function _supplyERC20(address _cTokenAddress, uint256 _underlyingAmount)
        private
    {
        require(msg.value == 0, "cant send ether along");
        ICToken cToken = ICToken(_cTokenAddress);
        address underlyingAddress = cToken.underlying();
        IERC20(underlyingAddress).approve(_cTokenAddress, _underlyingAmount);
        uint256 result = cToken.mint(_underlyingAmount);

        if (result != 0) revert CompoundLending_cTokenMint();
    }

    function redeemUnderliying(
        address _cTokenAddress,
        uint256 _underlyingAmount
    ) internal {
        ICToken cToken = ICToken(_cTokenAddress);

        uint256 result = cToken.redeemUnderlying(_underlyingAmount);

        if (result != 0) revert CompoundLending_cTokenRedeem();
    }

    function borrow(address _cTokenAddress, uint256 _underlyingAmount)
        internal
    {
        ICToken cToken = ICToken(_cTokenAddress);
        uint256 result = cToken.borrow(_underlyingAmount);

        if (result != 0) revert CompoundLending_cTokenBorrow();
    }

    function repayBorrow(address _cTokenAddress, uint256 _underlyingAmount)
        internal
    {
        if (_cTokenAddress == address(cEther)) {
            _repayBorrowETH(_cTokenAddress, _underlyingAmount);
        } else {
            _repayBorrowERC20(_cTokenAddress, _underlyingAmount);
        }
    }

    function _repayBorrowETH(address _cTokenAddress, uint256 _underlyingAmount)
        internal
    {
        ICEther cToken = ICEther(_cTokenAddress);
        cToken.repayBorrow{value: _underlyingAmount}();
    }

    function _repayBorrowERC20(
        address _cTokenAddress,
        uint256 _underlyingAmount
    ) internal {
        ICToken cToken = ICToken(_cTokenAddress);
        uint256 result = cToken.repayBorrow(_underlyingAmount);

        if (result != 0) revert CompoundLending_cTokenRepayborrow();
    }

    function enterMarket(address cTokenAddress) internal {
        address[] memory markets = new address[](1);
        markets[0] = cTokenAddress;
        uint256[] memory results = comptroller.enterMarkets(markets);

        if (results[0] != 0) revert CompoundLending_comptrollerEntermarket();
    }

    function claimComp() internal {
        comptroller.claimComp(address(this));
    }

    function getCompAddress() internal view returns (address) {
        return comptroller.getCompAddress();
    }
}
