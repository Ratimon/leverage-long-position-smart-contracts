// // SPDX-License-Identifier: MIT
// pragma solidity =0.8.13;

// import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import {IWETH9} from "./interfaces/IWETH9.sol";
// import {IComptroller} from "./interfaces/IComptroller.sol";
// import {ICEther} from "./interfaces/ICEther.sol";
// import {ICToken} from "./interfaces/ICToken.sol";

// //refactor constant.sol

// contract LongPosition {
//     error CompoundLending_cTokenMint();
//     error CompoundLending_cTokenRedeem();
//     error CompoundLending_comptrollerEntermarket();
//     error CompoundLending_cTokenBorrow();
//     error CompoundLending_cTokenRepayborrow();

//     IWETH9 immutable WETH;
//     IComptroller public comptroller;

//     ICEther public cTokenToSupply;
//     ICToken public cTokenToBorrow;

//     constructor(
//         address _comptroller,
//         address _cTokenToSupply,
//         address _cTokenToBorrow
//     ) {
//         comptroller = IComptroller(_comptroller);
//         WETH = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
//         cTokenToSupply = ICEther(_cTokenToSupply);
//         cTokenToBorrow = ICToken(_cTokenToBorrow);
//     }

//     receive() external payable {}

//     function supply() external payable {
//         cTokenToSupply.mint{value: msg.value}();
//     }

//     function openPosition() external {
//         ICEther cEther = ICEther(_cToken);
//         uint256 result = cTokenToSupply.borrow(_borrowAmount);

//         if (result != 0) revert CompoundLending_cTokenBorrow();
//     }

//     function getMaxBorrowAmount() external view returns (uint256) {
//         (uint256 error, uint256 liquidity, uint256 shortfall) = comptroller
//             .getAccountLiquidity(address(this));

//         require(error == 0, "error");
//         require(shortfall == 0, "shortfall > 0");
//         require(liquidity > 0, "liquidity = 0");

//         uint256 price = priceFeed.getUnderlyingPrice(address(cTokenBorrow));
//         uint256 maxBorrow = (liquidity * (10**decimals)) / price;

//         return maxBorrow;
//     }
// }
