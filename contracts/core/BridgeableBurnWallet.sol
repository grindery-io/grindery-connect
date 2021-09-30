// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IHmyBridge.sol";

/**
 * @title BridgeableBurnWallet
 * @dev Contract module that implements a trust-less bridge mechanisms
 */
contract BridgeableBurnWallet is Ownable {
    // @dev Address of bridged burned asset recipient
    address bridgeBurnRecipient;

    // @dev Address of erc20 bridge burn contract
    address bridgeBurnERC20ContractAddress;

    // @dev Emitted when `bridgeBurnRecipient` is changed to `recipient`
    event BridgeBurnRecipientChanged(address indexed recipient);

    // @dev Emitted when a bridge of `amount` of token with `tokenAddress` is initiated
    event BridgeBurnInitiated(address indexed tokenAddress, address indexed recipient, uint256 amount);

    /**
     * @dev Sets `bridgeBurnContractAddress` and `bridgeBurnContractAddress`
     */
    constructor(address _bridgeBurnRecipient, address _bridgeBurnERC20ContractAddress) {
        changeBridgeBurnRecipient(_bridgeBurnRecipient);
        changeBridgeBurnERC20Contract(_bridgeBurnERC20ContractAddress);
    }

    /**
     * @dev changes `bridgeBurnRecipient`
     *
     * Emits a {BridgeBurnRecipientChanged} event
     *
     * Requirements:
     * - Caller must be the owner
     * - `tokenAddress` address can neither be the zero address nor this contract's address
     */
    function changeBridgeBurnRecipient(address recipient) public onlyOwner returns (bool) {
        require(recipient != address(0));
        require(recipient != address(this));
        bridgeBurnRecipient = recipient;
        emit BridgeBurnRecipientChanged(recipient);
        return true;
    }

    /**
     * @dev changes `bridgeBurnERC20ContractAddress`
     *
     * Requirements:
     * - Caller must be the owner
     * - `_bridgeBurnERC20ContractAddress` address cannot be this contract's address
     */
    function changeBridgeBurnERC20Contract(address _bridgeBurnERC20ContractAddress) public onlyOwner returns (bool) {
        require(_bridgeBurnERC20ContractAddress != address(this));
        bridgeBurnERC20ContractAddress = _bridgeBurnERC20ContractAddress;
        return true;
    }

    /**
     * @dev Initiate bridge burn of `tokenAddress` via `bridgeBurnERC20ContractAddress`
     *
     * Emits a {BridgeBurnInitiated} event
     *
     * Requirements:
     * - `tokenAddress` address can neither be this contract's address nor the `bridgeBurnERC20ContractAddress`
     * - `tokenAddress` balance must be greater than zero
     */
    function initiateBridgeBurn(address tokenAddress) external returns (bool) {
        require(tokenAddress != address(this));
        require(tokenAddress != address(0));
        require(bridgeBurnERC20ContractAddress != address(0));
        require(tokenAddress != bridgeBurnERC20ContractAddress);
        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        require(balance > 0);
        IERC20(tokenAddress).approve(bridgeBurnERC20ContractAddress, balance);
        IHmyBridge(bridgeBurnERC20ContractAddress).burnToken(tokenAddress, balance, bridgeBurnRecipient);
        emit BridgeBurnInitiated(tokenAddress, bridgeBurnRecipient, balance);
        return true;
    }
}