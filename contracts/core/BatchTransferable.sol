// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BatchTransferable
 * @dev Implementation of batch transfer of received ether and pre-approved ERC20 tokens to multiple recipients
 */
contract BatchTransferable {
    /**
     * @dev Emitted when a batch transfer of ether and pre-approved ERC20 tokens from `account` to accounts in `recipients`
     * according to `amounts`, `tokenAddressIndices` and `tokenAddresses` is completed
     */
    event BatchTransfer(address indexed account, address[] recipients, uint256[] amounts, uint[] tokenAddressIndices, address[] tokenAddresses);

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
     * - All transfers must succeed
     */
    function _batchTransfer(address payerAddress, address[] memory recipients, uint256[] memory amounts, uint[] memory tokenAddressIndices, address[] memory tokenAddresses) internal returns (bool) {
        // Enforce requirements
        require(recipients.length >= 1);
        require(recipients.length == amounts.length);
        require(recipients.length == tokenAddressIndices.length);
        for (uint i; i < recipients.length; i++) {
            require(amounts[i] > 0);
            require(recipients[i] != address(0));
            require(recipients[i] != address(this));
            if (tokenAddressIndices[i] > 0) {
                uint tokenIndex = tokenAddressIndices[i] - 1;
                require(tokenIndex < tokenAddresses.length);
                require(tokenAddresses[tokenIndex] != address(0));
                require(tokenAddresses[tokenIndex] != address(this));
            }
        }

        // Make transfers
        for (uint i = 0; i < recipients.length; i++) {
            if (tokenAddressIndices[i] > 0) {
                address tokenAddress = tokenAddresses[tokenAddressIndices[i] - 1];
                bool success = IERC20(tokenAddress).transferFrom(payerAddress, recipients[i], amounts[i]);
                require(success);
            } else {
                (bool success,) = payable(recipients[i]).call{value: amounts[i]}("");
                require(success);
            }
        }
        emit BatchTransfer(payerAddress, recipients, amounts, tokenAddressIndices, tokenAddresses);
        return true;
    }
}