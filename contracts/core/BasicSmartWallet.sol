// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./Receivable.sol";
import "./Withdrawable.sol";
import "./BatchTransferable.sol";

/**
 * @title BasicSmartWallet
 * @dev Implementation of a basic smart wallet with ability to receive, withdraw and batch transfer
 */
contract BasicSmartWallet is Ownable, Receivable, Withdrawable, BatchTransferable {
    /**
     * @dev Batch transfer received ether and pre-approved ERC20 tokens to accounts in `recipients` according to corresponding amount (by index) in `amounts`
     * A corresponding `tokenAddressIndices` value (by index) determines whether it's an ether or ERC20 transfer
     * A `tokenAddressIndices` value greater than zero indicates an ERC20 transfer while anything else indicates an ether transfer
     * `tokenAddressIndices` values represent a one indexed position, so they need to be reduced by one to get the corresponding ERC20 token address from `tokenAddresses`
     *
     * Emits a {BatchTransfer} event
     *
     * Requirements:
     * - Length of `recipients` array must be at least one
     * - Length of `recipients`, `amounts` and `tokenAddressIndices` must be the same
     * - All items in `amounts` must be greater than zero
     * - All addresses in `recipients` can neither be the zero address nor this contract's address
     * - All `tokenAddressIndices` values greater than zero must match a valid array index in `tokenAddresses` when reduced by one
     * - All `tokenAddresses` values referenced by a `tokenAddressIndices` values can neither be the zero address nor this contract's address
     * - Sent ether must be equal to the total amount of ether to be transferred to `recipients`
     * - All transfers must succeed
     */
    function batchTransfer(address[] memory recipients, uint256[] memory amounts, uint[] memory tokenAddressIndices, address[] memory tokenAddresses) external onlyOwner returns (bool) {
        bool success = _batchTransfer(address(this), recipients, amounts, tokenAddressIndices, tokenAddresses);
        require(success);
        return true;
    }
}