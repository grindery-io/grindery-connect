// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "../interfaces/ISwap.sol";

/**
 * @title SwappableWallet
 * @dev Contract module that implements a trust-less swap mechanisms
 */
abstract contract SwappableWallet is Ownable {
    // @dev Address of swap contract
    address public swapContractAddress;

    // @dev Address of swap tokenAddress (0x0 for ether)
    address public swapTokenAddress;

    // @dev Emitted when `swapTokenAddress` is changed to `tokenAddress`
    event SwapTokenChanged(address indexed tokenAddress);

    // @dev Emitted when swap of `sellerAmount` of token with `sellerTokenAddress` for `buyerAmount` of token with `buyerTokenAddress` is initiated
    event SwapInitiated(address indexed sellerTokenAddress, address indexed buyerTokenAddress, uint256 sellerAmount, uint256 buyerAmount);

    /**
     * @dev Sets `swapContractAddress` and `swapTokenAddress`
     */
    constructor(address _swapContractAddress, address _swapTokenAddress) {
        changeSwapContract(_swapContractAddress);
        changeSwapToken(_swapTokenAddress);
    }

    /**
     * @dev sets `swapContractAddress` to `_swapContractAddress`
     *
     *
     * Requirements:
     * - Caller must be the owner
     * - `_swapContractAddress` address cannot be this contract's address
     */
    function changeSwapContract(address _swapContractAddress) public onlyOwner returns (bool) {
        require(_swapContractAddress != address(this));
        swapContractAddress = _swapContractAddress;
        return true;
    }

    /**
     * @dev sets the `swapTokenAddress` to `tokenAddress`
     *
     * Emits a {SwapTokenChanged} event
     *
     * Requirements:
     * - Caller must be the owner
     * - `tokenAddress` address can neither be the zero address nor this contract's address
     */
    function changeSwapToken(address tokenAddress) public onlyOwner returns (bool) {
        require(tokenAddress != address(0));
        require(tokenAddress != address(this));
        swapTokenAddress = tokenAddress;
        emit SwapTokenChanged(tokenAddress);
        return true;
    }

    /**
     * @dev Returns true if token defined at `tokenAddress` is a USD pegged token
     */
    function isUSDToken(address tokenAddress) internal virtual returns (bool);

    /**
     * @dev Returns the latest price from Chainlink feed
     */
    function getLatestPriceFromChainlinkFeed(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        (,int256 price,,,) = priceFeed.latestRoundData();
        return uint256(price);
    }

    /**
     * @dev Returns the NativeToken/USD exchange rate
     */
    function getNativeTokenUSDExchangeRate() internal virtual returns (uint256);

    /**
     * @dev Returns the CustomToken/USD exchange rate
     */
    function getCustomTokenUSDExchangeRate(address tokenAddress, address buyerTokenAddress) internal virtual returns (uint256);

    /**
     * @dev Returns the Seller Token/Buyer Token exchange rate
     */
    function getExchangeRate(address sellerTokenAddress, address buyerTokenAddress) internal returns (uint256) {
        require(sellerTokenAddress != address(this));
        require(buyerTokenAddress != address(this));
        require(sellerTokenAddress != buyerTokenAddress);

        bool isSellerTokenUSDPegged = isUSDToken(sellerTokenAddress);
        bool isBuyerTokenUSDPegged = isUSDToken(buyerTokenAddress);

        if(isSellerTokenUSDPegged && isBuyerTokenUSDPegged) { // USD/USD
            return (10 ** 8);
        }  else if(sellerTokenAddress == address(0) && isBuyerTokenUSDPegged) { // ETH/USD
            return getNativeTokenUSDExchangeRate();
        } else if (isSellerTokenUSDPegged && buyerTokenAddress == address(0)) { // USD/ETH
            return (10 ** 16) /getNativeTokenUSDExchangeRate();
        }
        return getCustomTokenUSDExchangeRate(sellerTokenAddress, buyerTokenAddress);
    }

    /**
     * @dev get amount of `buyerToken` (0x0 for ether) equivalent to `sellerAmount` of `sellerToken` (0x0 for ether)
     *
     * Requirements:
     * - `tokenAddress` address can neither be this contract's address nor the `swapTokenAddress`
     * - `tokenAddress` balance must be greater than specified withdraw `amount`
     */
    function getExchangeAmount(address sellerTokenAddress, address buyerTokenAddress, uint256 sellerAmount) internal returns (uint256) {
        uint256 rate = getExchangeRate(sellerTokenAddress, buyerTokenAddress);
        return (rate * sellerAmount) / (10 * 8);
    }

    /**
     * @dev Initiate swap of token with `tokenAddress` (0x0 for ether) for token with `swapTokenAddress` (0x0 for ether)
     *
     * Emits a {SwapInitiated} event
     *
     * Requirements:
     * - `swapContractAddress` address can't be the zero address
     * - `tokenAddress` address can neither be this contract's address nor the `swapTokenAddress`
     * - `tokenAddress` balance must be greater than specified withdraw `amount`
     */
    function initiateSwap(address tokenAddress) external returns (bool) {
        require(swapContractAddress != address(0));
        require(tokenAddress != address(this));
        require(tokenAddress != swapTokenAddress);
        uint256 balance = 0;
        uint256 exchangeAmount = 0;
        if (tokenAddress == address(0)) {
            balance = address(this).balance;
            require(balance > 0);
            exchangeAmount = getExchangeAmount(tokenAddress, swapTokenAddress, balance);
            require(exchangeAmount > 0);
            bool success = ISwap(swapContractAddress).requestSwap{value: balance}(tokenAddress, swapTokenAddress, balance, exchangeAmount, 0);
            require(success);
        } else {
            balance = IERC20(tokenAddress).balanceOf(address(this));
            require(balance > 0);
            IERC20(tokenAddress).approve(swapContractAddress, balance);
            exchangeAmount = getExchangeAmount(tokenAddress, swapTokenAddress, balance);
            require(exchangeAmount > 0);
            bool success = ISwap(swapContractAddress).requestSwap(tokenAddress, swapTokenAddress, balance, exchangeAmount, 0);
            require(success);
        }
        emit SwapInitiated(tokenAddress, swapTokenAddress, balance, exchangeAmount);
        return true;
    }
}