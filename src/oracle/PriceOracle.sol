// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

import {OracleRef} from "../refs/OracleRef.sol";

contract PriceOracle is OracleRef {
    constructor(
        address _oracle,
        address _backupOracle,
        bool _isInvert
    ) OracleRef(_oracle, _backupOracle, 0, _isInvert) {}
}
