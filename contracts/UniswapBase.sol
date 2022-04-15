// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import {IUniswapV2Router} from "./interfaces/IUniswapV2Router.sol";
import {UniswapV2Library} from "./external/UniswapV2Library.sol";

contract UniswapBase {
    IUniswapV2Router immutable router;

    constructor(address _router) {
        require(_router != address(0), "account cannot be the zero address");
        router = IUniswapV2Router(_router);
    }

    function buyETH(uint256 amountIn, address from)
        internal
        returns (uint256 amountETHOut)
    {
        address[] memory path = new address[](2);
        path[0] = from;
        path[1] = router.WETH();

        amountETHOut = router.swapExactTokensForETH(
            amountIn,
            0,
            path,
            address(this),
            block.timestamp
        )[1];
    }

    function sellETH(uint256 amountIn, address to)
        internal
        returns (uint256 amountERC20Out)
    {
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = to;

        amountERC20Out = router.swapExactETHForTokens{value: amountIn}(
            0,
            path,
            address(this),
            block.timestamp
        )[1];
    }

    function getAmountsOut(
        uint256 amountIn,
        address from,
        address to
    ) internal view returns (uint256) {
        address factory = router.factory();

        address[] memory path = new address[](2);
        path[0] = from;
        path[1] = to;

        uint256[] memory amounts = UniswapV2Library.getAmountsOut(
            factory,
            amountIn,
            path
        );
        return amounts[1];
    }
}
