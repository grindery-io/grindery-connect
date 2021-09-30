// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IHmyBridge.sol";

/**
 * @title BridgeableLockWallet
 * @dev Contract module that implements a trust-less bridge mechanisms
 */
contract BridgeableLockWallet is Ownable {
    // @dev Address of bridged locked asset recipient
    address bridgeLockRecipient;

    // @dev Address of native token bridge lock contract
    address bridgeLockContractAddress;

    // @dev Address of erc20 bridge lock contract
    address bridgeLockERC20ContractAddress;

    // @dev Emitted when `bridgeLockRecipient` is changed to `recipient`
    event BridgeLockRecipientChanged(address indexed recipient);

    // @dev Emitted when a bridge of `amount` of token with `tokenAddress` is initiated
    event BridgeLockInitiated(address indexed tokenAddress, address indexed recipient, uint256 amount);

    /**
     * @dev Sets `bridgeLockRecipient`, `bridgeLockContractAddress` and `bridgeLockERC20ContractAddress`
     */
    constructor(address _bridgeLockRecipient, address _bridgeLockContractAddress, address _bridgeLockERC20ContractAddress) {
        changeBridgeLockRecipient(_bridgeLockRecipient);
        changeBridgeLockContract( _bridgeLockContractAddress);
        changeBridgeLockERC20Contract(_bridgeLockERC20ContractAddress);
    }

    /**
     * @dev changes `bridgeLockRecipient`
     *
     * Emits a {BridgeLockRecipientChanged} event
     *
     * Requirements:
     * - Caller must be the owner
     * - `tokenAddress` address can neither be the zero address nor this contract's address
     */
    function changeBridgeLockRecipient(address recipient) public onlyOwner returns (bool) {
        require(recipient != address(0));
        require(recipient != address(this));
        bridgeLockRecipient = recipient;
        emit BridgeLockRecipientChanged(recipient);
        return true;
    }

    /**
     * @dev changes `bridgeLockContractAddress`
     *
     * Requirements:
     * - Caller must be the owner
     * - `_bridgeLockContractAddress` address cannot be this contract's address
     */
    function changeBridgeLockContract(address _bridgeLockContractAddress) public onlyOwner returns (bool) {
        require(_bridgeLockContractAddress != address(this));
        bridgeLockContractAddress = _bridgeLockContractAddress;
        return true;
    }

    /**
     * @dev changes `bridgeLockERC20ContractAddress`
     *
     * Requirements:
     * - Caller must be the owner
     * - `_bridgeLockERC20ContractAddress` address cannot be this contract's address
     */
    function changeBridgeLockERC20Contract(address _bridgeLockERC20ContractAddress) public onlyOwner returns (bool) {
        require(_bridgeLockERC20ContractAddress != address(this));
        bridgeLockERC20ContractAddress = _bridgeLockERC20ContractAddress;
        return true;
    }

    /**
     * @dev Initiate bridge lock of `tokenAddress` (0x0 for ether) via appropriate lock contract address
     *
     * Emits a {BridgeLockInitiated} event
     *
     * Requirements:
     * - `tokenAddress` address cannot be the bridge lock contract address
     * - `tokenAddress` balance must be greater than zero
     */
    function initiateBridgeLock(address tokenAddress) external returns (bool) {
        require(tokenAddress != address(this));
        uint256 balance = 0;
        if (tokenAddress == address(0)) {
            require(bridgeLockContractAddress != address(0));
            require(tokenAddress != bridgeLockContractAddress);
            balance = address(this).balance;
            require(balance > 0);
            IHmyBridge(bridgeLockContractAddress).lockEth{value: balance}(balance, bridgeLockRecipient);
        } else {
            require(bridgeLockERC20ContractAddress != address(0));
            require(tokenAddress != bridgeLockERC20ContractAddress);
            balance = IERC20(tokenAddress).balanceOf(address(this));
            require(balance > 0);
            IERC20(tokenAddress).approve(bridgeLockERC20ContractAddress, balance);
            IHmyBridge(bridgeLockERC20ContractAddress).lockToken(tokenAddress, balance, bridgeLockRecipient);
        }
        emit BridgeLockInitiated(tokenAddress, bridgeLockRecipient, balance);
        return true;
    }
}