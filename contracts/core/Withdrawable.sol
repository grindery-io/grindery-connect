// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Withdrawable
 * @dev Contract module that implements a withdraw function and emits a Withdraw event
 */
contract Withdrawable is Ownable {
    // @dev Emitted when `amount` of token with `tokenAddress` is withdrawn to account `recipient`
    event Withdraw(address indexed recipient, address indexed tokenAddress, uint256 amount);

    /**
     * @dev Withdraw `amount` of token with `tokenAddress` (ether if 0x0) to `recipient`
     *
     * Requirements:
     * - Caller must be the `owner`
     * - See requirements for internal `_withdraw` function
     */
    function withdraw(address recipient, address tokenAddress, uint256 amount) external onlyOwner returns (bool) {
        bool success = _withdraw(recipient, tokenAddress, amount);
        require(success);
        return true;
    }

    /**
     * @dev Withdraw `amount` of token with `tokenAddress` (ether if 0x0) to `recipient`
     * Internal function without access restriction.
     *
     * Emits a {Withdraw} event
     *
     * Requirements:
     * - Withdraw amount must be greater than zero
     * - tokenAddress address cannot be this contract's address
     * - contract's tokenAddress balance must be greater than specified withdraw `amount`
     * - Recipient address can neither be the zero address nor this contract's address
     */
    function _withdraw(address recipient, address tokenAddress, uint256 amount) internal returns (bool) {
        require(amount > 0);
        require(recipient != address(0));
        require(recipient != address(this));
        require(tokenAddress != address(this));
        if (tokenAddress == address(0)) {
            require(address(this).balance > amount);
            (bool success,) = payable(recipient).call{value: amount}("");
            require(success);
        } else {
            require(IERC20(tokenAddress).balanceOf(address(this)) >= amount);
            bool success = IERC20(tokenAddress).transfer(recipient, amount);
            require(success);
        }
        emit Withdraw(recipient, tokenAddress, amount);
        return true;
    }
}