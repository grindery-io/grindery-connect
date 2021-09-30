// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "./core/BasicSmartWallet.sol";
import "./core/BridgeableBurnWallet.sol";
import "./core/BridgeableBurnTerraWallet.sol";
import "./core/SwappableToBridgeWallet.sol";

/**
 * @title GrinderyWalletHarmonyTest
 * @dev Implementation of a Grindery smart wallet for Harmony Testnet
 */
contract GrinderyWalletHarmonyTest is BasicSmartWallet, BridgeableBurnWallet, BridgeableBurnTerraWallet, SwappableToBridgeWallet {

    constructor(
        address _bridgeBurnRecipient, address _bridgeBurnERC20ContractAddress,
        bytes32 _bridgeBurnTerraRecipient, address _bridgeBurnTerraERC20ContractAddress,
        address _swapContractAddress, address _swapTokenAddress, address _swapToBridgeTokenAddress
    )
    BridgeableBurnWallet(_bridgeBurnRecipient, _bridgeBurnERC20ContractAddress)
    BridgeableBurnTerraWallet(_bridgeBurnTerraRecipient, _bridgeBurnTerraERC20ContractAddress)
    SwappableToBridgeWallet(_swapContractAddress, _swapTokenAddress, _swapToBridgeTokenAddress) {}

    /**
     * @dev Returns the ONE/USD exchange rate
     */
    function getNativeTokenUSDExchangeRate() internal view override returns (uint256) {
        return getLatestPriceFromChainlinkFeed(
            AggregatorV3Interface(0xcEe686F89bc0dABAd95AEAAC980aE1d97A075FAD) // ONE/USD on Harmony Testnet
        );
    }

    /**
     * @dev Returns the ETH/USD exchange rate
     */
    function getEthUSDExchangeRate() internal view returns (uint256) {
        return getLatestPriceFromChainlinkFeed(
            AggregatorV3Interface(0x4f11696cE92D78165E1F8A9a4192444087a45b64) // ETH/USD on Harmony Testnet
        );
    }

    /**
     * @dev Returns true if token defined at `tokenAddress` is a USD pegged token
     */
    function isUSDToken(address tokenAddress) internal pure override returns (bool) {
        if(
            tokenAddress == 0x0C096AdFdA2a3Bf74e6Ca33c05eD0b472b622247 // UST on Harmony Testnet
            || tokenAddress == 0xc4860463C59D59a9aFAc9fdE35dff9Da363e8425 // BUSD on Harmony Testnet
        // TODO: Add more stable coins and make this updatable by owner
        ) {
            return true;
        }
        return false;
    }


    /**
     * @dev Returns true if token defined at `tokenAddress` is an ETH pegged token
     */
    function isETHToken(address tokenAddress) internal pure returns (bool) {
        if(tokenAddress == 0x1E120B3b4aF96e7F394ECAF84375b1C661830013) { // 1ETH address on Harmony Testnet
            return true;
        }
        return false;
    }

    /**
     * @dev Returns the CustomToken/USD exchange rate
     */
    function getCustomTokenUSDExchangeRate(address sellerTokenAddress, address buyerTokenAddress) internal view override returns (uint256) {
        bool isSellerTokenUSDPegged = isUSDToken(sellerTokenAddress);
        bool isBuyerTokenUSDPegged = isUSDToken(buyerTokenAddress);

        bool isSellerTokenETHPegged = isETHToken(sellerTokenAddress);
        bool isBuyerTokenETHPegged = isETHToken(buyerTokenAddress);

        if(isSellerTokenETHPegged && isBuyerTokenUSDPegged) { // ETH/USD
            return getEthUSDExchangeRate();
        } else if(isSellerTokenUSDPegged && isBuyerTokenETHPegged) { // USD/ETH
            return (10 ** 16)/ getEthUSDExchangeRate();
        }
        return 0;
    }
}