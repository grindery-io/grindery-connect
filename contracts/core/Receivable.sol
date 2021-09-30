// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

/**
 * @title Receivable
 * @dev Contract module that implements a receive function and emits a Received event
 */
contract Receivable {
    // @dev Emitted when `amount` ether is received from account `sender`
    event Received(address indexed sender, uint256 amount);

    /**
     * @dev Allows this contract to receive ether
     *
     * Emits a {Received} event
     */
    receive() external payable {
        if (msg.value > 0) {
            emit Received(msg.sender, msg.value);
        }
    }
}