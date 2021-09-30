// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

interface ITerraBridge {
    /* Terra burn */
    function burn(uint256 _amount, bytes32 _to) external;
}