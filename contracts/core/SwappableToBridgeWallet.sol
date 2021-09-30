// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./SwappableWallet.sol";

/**
 * @title SwappableToBridgeWallet
 * @dev Contract module that implements a trust-less swap mechanisms
 */
abstract contract SwappableToBridgeWallet is Ownable, SwappableWallet {
    // @dev Address of swap tokenAddress (0x0 for ether)
    address public swapToBridgeTokenAddress;

    // @dev Emitted when `swapToBridgeTokenAddress` is changed to `tokenAddress`
    event SwapToBridgeTokenChanged(address indexed tokenAddress);

    // @dev Emitted when swap of `sellerAmount` of token with `sellerTokenAddress` for `buyerAmount` of token with `buyerTokenAddress` is initiated
    event SwapToBridgeInitiated(address indexed sellerTokenAddress, address indexed buyerTokenAddress, uint256 sellerAmount, uint256 buyerAmount);

    /**
     * @dev Sets `swapContractAddress` and `swapToBridgeTokenAddress`
     */
    constructor(address _swapContractAddress, address _swapTokenAddress, address _swapToBridgeTokenAddress) 
    Ownable() 
    SwappableWallet(_swapContractAddress, _swapTokenAddress) {
        changeSwapToBridgeToken(_swapToBridgeTokenAddress);
    }

    /**
     * @dev sets the `swapToBridgeTokenAddress` to `tokenAddress`
     *
     * Emits a {SwapToBridgeTokenChanged} event
     *
     * Requirements:
     * - Caller must be the owner
     * - `tokenAddress` address can neither be the zero address nor this contract's address
     */
    function changeSwapToBridgeToken(address tokenAddress) public onlyOwner returns (bool) {
        require(tokenAddress != address(0));
        require(tokenAddress != address(this));
        swapToBridgeTokenAddress = tokenAddress;
        emit SwapToBridgeTokenChanged(tokenAddress);
        return true;
    }

    /**
     * @dev Initiate swap of token with `tokenAddress` (0x0 for ether) for token with `swapToBridgeTokenAddress` (0x0 for ether)
     *
     * Emits a {SwapToBridgeInitiated} event
     *
     * Requirements:
     * - `swapContractAddress` address can't be the zero address
     * - `tokenAddress` address can neither be this contract's address nor the `swapToBridgeTokenAddress`
     * - `tokenAddress` balance must be greater than specified withdraw `amount`
     */
    function initiateSwapToBridge(address tokenAddress) external returns (bool) {
        require(swapContractAddress != address(0));
        require(tokenAddress != address(this));
        require(tokenAddress != swapToBridgeTokenAddress);
        uint256 balance = 0;
        uint256 exchangeAmount = 0;
        if (tokenAddress == address(0)) {
            balance = address(this).balance;
            require(balance > 0);
            exchangeAmount = getExchangeAmount(tokenAddress, swapToBridgeTokenAddress, balance);
            require(exchangeAmount > 0);
            bool success = ISwap(swapContractAddress).requestSwap{value: balance}(tokenAddress, swapToBridgeTokenAddress, balance, exchangeAmount, 0);
            require(success);
        } else {
            balance = IERC20(tokenAddress).balanceOf(address(this));
            require(balance > 0);
            IERC20(tokenAddress).approve(swapContractAddress, balance);
            exchangeAmount = getExchangeAmount(tokenAddress, swapToBridgeTokenAddress, balance);
            require(exchangeAmount > 0);
            bool success = ISwap(swapContractAddress).requestSwap(tokenAddress, swapToBridgeTokenAddress, balance, exchangeAmount, 0);
            require(success);
        }
        emit SwapToBridgeInitiated(tokenAddress, swapToBridgeTokenAddress, balance, exchangeAmount);
        return true;
    }
}