// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ITerraBridge.sol";

/**
 * @title BridgeableBurnTerraWallet
 * @dev Contract module that implements a trust-less bridge mechanisms
 */
contract BridgeableBurnTerraWallet is Ownable {
    // @dev Address of bridged burned asset recipient
    bytes32 bridgeBurnTerraRecipient;

    // @dev Address of erc20 bridge burn contract
    address bridgeBurnTerraERC20ContractAddress;

    // @dev Emitted when `bridgeBurnTerraRecipient` is changed to `recipient`
    event BridgeBurnTerraRecipientChanged(bytes32 indexed recipient);

    // @dev Emitted when a bridge of `amount` of token with `tokenAddress` is initiated
    event BridgeBurnTerraInitiated(address indexed tokenAddress, bytes32 indexed recipient, uint256 amount);

    /**
     * @dev Sets `bridgeBurnTerraContractAddress` and `bridgeBurnTerraContractAddress`
     */
    constructor(bytes32 _bridgeBurnTerraRecipient, address _bridgeBurnTerraERC20ContractAddress) {
        changeBridgeBurnTerraRecipient(_bridgeBurnTerraRecipient);
        changeBridgeBurnTerraERC20Contract(_bridgeBurnTerraERC20ContractAddress);
    }

    /**
     * @dev changes `bridgeBurnTerraRecipient`
     *
     * Emits a {BridgeBurnTerraRecipientChanged} event
     *
     * Requirements:
     * - Caller must be the owner
     */
    function changeBridgeBurnTerraRecipient(bytes32 recipient) public onlyOwner returns (bool) {
        bridgeBurnTerraRecipient = recipient;
        emit BridgeBurnTerraRecipientChanged(recipient);
        return true;
    }

    /**
     * @dev changes `bridgeBurnTerraERC20ContractAddress`
     *
     * Requirements:
     * - Caller must be the owner
     * - `_bridgeBurnTerraERC20ContractAddress` address cannot be this contract's address
     */
    function changeBridgeBurnTerraERC20Contract(address _bridgeBurnTerraERC20ContractAddress) public onlyOwner returns (bool) {
        require(_bridgeBurnTerraERC20ContractAddress != address(this));
        bridgeBurnTerraERC20ContractAddress = _bridgeBurnTerraERC20ContractAddress;
        return true;
    }

    /**
     * @dev Initiate bridge burn of `bridgeBurnTerraERC20ContractAddress`
     *
     * Emits a {BridgeBurnTerraInitiated} event
     *
     * Requirements:
     * - `bridgeBurnTerraERC20ContractAddress` address can neither be this contract's address nor the zero address
     * - `bridgeBurnTerraERC20ContractAddress` balance must be greater than zero
     */
    function initiateBridgeBurnTerra() external returns (bool) {
        require(bridgeBurnTerraERC20ContractAddress != address(0));
        require(bridgeBurnTerraERC20ContractAddress != address(this));
        uint256 balance = IERC20(bridgeBurnTerraERC20ContractAddress).balanceOf(address(this));
        require(balance > 0);
        ITerraBridge(bridgeBurnTerraERC20ContractAddress).burn(balance, bridgeBurnTerraRecipient);
        emit BridgeBurnTerraInitiated(bridgeBurnTerraERC20ContractAddress, bridgeBurnTerraRecipient, balance);
        return true;
    }
}