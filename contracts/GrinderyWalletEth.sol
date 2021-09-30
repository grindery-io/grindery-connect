// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./core/BasicSmartWallet.sol";
import "./core/BridgeableLockWallet.sol";

/**
 * @title GrinderyWalletEth
 * @dev Implementation of a GrinderyWalletEth smart wallet for Kovan
 */
contract GrinderyWalletEth is BasicSmartWallet, BridgeableLockWallet {
    /**
     * @dev Sets `bridgeLockRecipient`, `bridgeLockContractAddress` and `bridgeLockERC20ContractAddress`
     */
    constructor(address _bridgeLockRecipient, address _bridgeLockContractAddress, address _bridgeLockERC20ContractAddress)
    BridgeableLockWallet(_bridgeLockRecipient, _bridgeLockContractAddress, _bridgeLockERC20ContractAddress) {}
}