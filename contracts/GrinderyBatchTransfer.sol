// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./core/BatchTransferable.sol";

/**
 * @title GrinderyBatchTransfer
 * @dev Implementation of batch transfer of received ether and pre-approved ERC20 tokens to multiple recipients
 */
contract GrinderyBatchTransfer is Ownable, BatchTransferable {
    // @dev Emitted when `amount` ether is refunded to account `recipient`
    event Refund(address indexed recipient, uint256 amount);

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
    function batchTransfer(address[] memory recipients, uint256[] memory amounts, uint[] memory tokenAddressIndices, address[] memory tokenAddresses) external payable returns (bool) {
        uint256 etherTotal = 0;
        for (uint i; i < recipients.length; i++) {
            if (tokenAddressIndices[i] == 0) {
                etherTotal += amounts[i];
            }
        }
        require(etherTotal == msg.value);
        bool success = _batchTransfer(msg.sender, recipients, amounts, tokenAddressIndices, tokenAddresses);
        require(success);
        return true;
    }

    /**
     * @dev Transfer contract's balance to the contract `owner`
     *
     * Emits a {Refund} event
     *
     * Requirements:
     * - Caller must be the `owner`
     * - contract balance must be greater than zero
     */
    function refund(address tokenAddress) external onlyOwner {
        if(tokenAddress == address(0)) {
            uint256 balance = address(this).balance;
            require(balance > 0);
            (bool success,) = payable(msg.sender).call{value: address(this).balance}("");
            require(success);
        } else {
            uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
            require(balance > 0);
            bool success = IERC20(tokenAddress).transfer(msg.sender, balance);
            require(success);
        }
        emit Refund(msg.sender, address(this).balance);
    }
}