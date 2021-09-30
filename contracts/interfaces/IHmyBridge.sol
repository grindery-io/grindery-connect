// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

interface IHmyBridge {
    /* Harmony Eth lock */
    function lockEth(uint256 amount, address recipient) external payable;

    /* Harmony token lock */
    function lockToken(address tokenAddress, uint256 amount, address recipient) external;

    /* Harmony token lock for user */
    function lockTokenFor(address tokenAddress, address userAddress, uint256 amount, address recipient) external;

    /* Harmony token burn */
    function burnToken(address tokenAddress, uint256 amount, address recipient) external;
}