// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

interface ISwap {
    function requestSwap(address sellerTokenAddress, address buyerTokenAddress, uint256 sellerAmount, uint256 buyerAmount, uint256 maxSlippage) external payable returns (bool);
}