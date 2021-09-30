// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ISwap.sol";

/**
 * @title GrinderySwap
 * @dev Implementation of swap contract
 */
contract GrinderySwap is Ownable, ISwap {

    // @dev Address of treasury
    address public treasuryAddress;

    // @dev Address of treasury
    uint public feePercentage; // 4 decimals

    struct OrderAmounts {
        uint256 sellerAmount;
        uint256 buyerAmount;
        uint256 maxSlippage;
    }

    // @dev map of `seller` address to `sellerTokenAddress` (0x0 in the case of ether)
    // to `buyerTokenAddress` (0x0 in the case of ether)
    // to an array of 3 amounts in the order, token-in amount, token-out amount, maximum slippage
    mapping(address => mapping(address => mapping(address => OrderAmounts))) private orders;

    // @dev Emitted when `treasuryAddress` is changed to `_treasuryAddress`
    event TreasuryAddressChanged(address indexed _treasuryAddress);

    // @dev Emitted when `feePercentage` is changed to `_feePercentage`
    event FeePercentageChanged(uint indexed _feePercentage);

    // @dev Emitted when a swap of `amount` of token `sellerTokenAddress` to `buyerTokenAddress` is requested by `seller`
    event SwapRequested(address indexed seller, address indexed sellerTokenAddress, address indexed buyerTokenAddress, uint256 amount, uint256 buyerAmount, uint256 maxSlippage);

    // @dev Emitted when a swap of `amount` of token `sellerTokenAddress` to `buyerTokenAddress` requested by `seller` is completed by `buyer`
    event SwapCompleted(address indexed seller, address indexed sellerTokenAddress, address indexed buyerTokenAddress, uint256 amount, uint256 buyerAmount, address buyer);

    // @dev Emitted when a swap of token `sellerTokenAddress` to `buyerTokenAddress` requested by `seller` is cancelled by `account`
    event SwapCanceled(address indexed seller, address indexed sellerTokenAddress, address indexed buyerTokenAddress, uint256 amount, address account);

    /**
     * @dev Sets `treasuryAddress`
     */
    constructor(address _treasuryAddress, uint _feePercentage) Ownable() {
        changeTreasuryAddress(_treasuryAddress);
        changeFeePercentage(_feePercentage);
    }

    /**
     * @dev sets `treasuryAddress` to `_treasuryAddress`
     *
     * Emits a {TreasuryAddressChanged} event
     *
     * Requirements:
     * - Caller must be the owner
     * - `_treasuryAddress` address can neither be the zero address nor this contract's address
     */
    function changeTreasuryAddress(address _treasuryAddress) public onlyOwner returns (bool) {
        require(_treasuryAddress != address(0));
        require(_treasuryAddress != address(this));
        treasuryAddress = _treasuryAddress;
        emit TreasuryAddressChanged(_treasuryAddress);
        return true;
    }

    /**
     * @dev sets `feePercentage` to `_feePercentage`
     *
     * Emits a {FeePercentageChanged} event
     *
     * Requirements:
     * - Caller must be the owner
     */
    function changeFeePercentage(uint _feePercentage) public onlyOwner returns (bool) {
        feePercentage = _feePercentage;
        emit FeePercentageChanged(_feePercentage);
        return true;
    }

    /**
     * @dev return the order amounts for swap request by `seller` from `sellerTokenAddress` to `buyerTokenAddress`
     */
    function getOrderAmounts(address seller, address sellerTokenAddress, address buyerTokenAddress) public view returns (uint256, uint256, uint256) {
        OrderAmounts memory orderData = orders[seller][sellerTokenAddress][buyerTokenAddress];
        return (orderData.sellerAmount, orderData.buyerAmount, orderData.maxSlippage);
    }

    /**
     * @dev Request a swap of `sellerAmount` of `sellerTokenAddress` to `buyerAmount` of `buyerTokenAddress` with maximum slippage of `maxSlippage`
     *
     * Emits a {SwapRequested} event
     *
     * Requirements:
     * - Caller cannot be this contract's address and must have an existing order greater than zero
     * - `sellerTokenAddress` address cannot be this contract's address
     * - contract's corresponding token balance must be greater than or equal to the existing order
     */
    function requestSwap(address sellerTokenAddress, address buyerTokenAddress, uint256 sellerAmount, uint256 buyerAmount, uint256 maxSlippage) external payable override returns (bool) {
        require(sellerAmount > 0);
        require(buyerAmount > 0);
        require(buyerAmount > maxSlippage);
        require(msg.sender != address(this));
        require(sellerTokenAddress != address(this));
        require(buyerTokenAddress != address(this));
        require(sellerTokenAddress != buyerTokenAddress);

        if (sellerTokenAddress == address(0)) {
            require(msg.value == sellerAmount);
        } else {
            require(IERC20(sellerTokenAddress).allowance(msg.sender, address(this)) >= sellerAmount);
            bool success = IERC20(sellerTokenAddress).transferFrom(msg.sender, address(this), sellerAmount);
            require(success);
        }

        OrderAmounts memory orderData = orders[msg.sender][sellerTokenAddress][buyerTokenAddress];

        orders[msg.sender][sellerTokenAddress][buyerTokenAddress] = OrderAmounts(
            orderData.sellerAmount + sellerAmount, orderData.buyerAmount + buyerAmount, maxSlippage
        );

        emit SwapRequested(msg.sender, sellerTokenAddress, buyerTokenAddress, sellerAmount, buyerAmount, maxSlippage);
        return true;
    }

    /**
     * @dev Complete a swap requested by `seller` for `sellerTokenAddress` to `buyerAmount` of `buyerTokenAddress`
     *
     * Emits a {SwapCompleted} event
     *
     * Requirements:
     * - Caller cannot be this contract's address and must have an existing order greater than zero
     * - `sellerTokenAddress` address cannot be this contract's address
     * - contract's corresponding token balance must be greater than or equal to the existing order
     */
    function completeSwap(address seller, address sellerTokenAddress, address buyerTokenAddress, uint256 buyerAmount) external payable returns (bool) {
        OrderAmounts memory orderData = orders[seller][sellerTokenAddress][buyerTokenAddress];
        require(buyerAmount > 0);
        uint256 sellerAmount = orderData.sellerAmount;
        require(sellerAmount > 0);
        require(orderData.buyerAmount > 0);
        require(orderData.buyerAmount > orderData.maxSlippage);
        require(buyerAmount >= (orderData.buyerAmount - orderData.maxSlippage));

        require(msg.sender != address(this));
        require(sellerTokenAddress != address(this));
        require(buyerTokenAddress != address(this));
        require(sellerTokenAddress != buyerTokenAddress);

        orders[seller][sellerTokenAddress][buyerTokenAddress] = OrderAmounts(0, 0, 0);

        uint256 processingFeeAmount = 0;
        uint256 finalExchangeAmount = buyerAmount;

        if(treasuryAddress != address(this) && treasuryAddress != address(0) && feePercentage > 0) {
            processingFeeAmount = (feePercentage * buyerAmount) / (10 ** 6); // Fee percentage is 4 decimals i.e 0.2% = 2000
            finalExchangeAmount = buyerAmount;
        }

        // Send `finalExchangeAmount` (buyerAmount - processingFeeAmount) of `buyerTokenAddress` tokens to `seller`
        // And send processingFeeAmount (protocol cut) to treasuryAddress
        if (buyerTokenAddress == address(0)) {
            require(msg.value == buyerAmount);
            (bool success,) = payable(seller).call{value: finalExchangeAmount}("");
            require(success);

            if(processingFeeAmount > 0) {
                (bool treasurySuccess,) = payable(treasuryAddress).call{value: processingFeeAmount}("");
                require(treasurySuccess);
            }
            require(success);
        } else {
            require(IERC20(buyerTokenAddress).allowance(msg.sender, address(this)) >= buyerAmount);
            bool success = IERC20(buyerTokenAddress).transferFrom(msg.sender, seller, finalExchangeAmount);
            require(success);

            if(processingFeeAmount > 0) {
                bool treasurySuccess = IERC20(buyerTokenAddress).transferFrom(msg.sender, treasuryAddress, processingFeeAmount);
                require(treasurySuccess);
            }
        }

        // Send `sellerAmount` of `sellerTokenAddress` to buyer
        if (sellerTokenAddress == address(0)) {
            require(address(this).balance >= sellerAmount);
            (bool success,) = payable(msg.sender).call{value: sellerAmount}("");
            require(success);
        } else {
            require(IERC20(sellerTokenAddress).allowance(seller, address(this)) >= sellerAmount);
            bool success = IERC20(sellerTokenAddress).transferFrom(seller, msg.sender, sellerAmount);
            require(success);
        }
        emit SwapCompleted(seller, sellerTokenAddress, buyerTokenAddress, sellerAmount, buyerAmount, msg.sender);
        return true;
    }

    /**
     * @dev Cancel swap of `sellerTokenAddress` to `buyerTokenAddress`
     *
     * Emits a {SwapCanceled} event
     *
     * Requirements:
     * - Caller cannot be this contract's address and must have an existing order greater than zero
     * - `seller` address can neither be this contract's address nor the zero address
     * - `sellerTokenAddress` address cannot be this contract's address
     * - contract's corresponding token balance must be greater than or equal to the existing order
     */
    function cancelSwap(address seller, address sellerTokenAddress, address buyerTokenAddress) external returns (bool) {
        uint256 amount = orders[seller][sellerTokenAddress][buyerTokenAddress].sellerAmount;
        require(amount > 0);
        require(seller != address(0));
        require(seller != address(this));
        require(sellerTokenAddress != address(this));

        orders[seller][sellerTokenAddress][buyerTokenAddress] = OrderAmounts(0, 0, 0);

        if (sellerTokenAddress == address(0)) {
            require(address(this).balance >= amount);
            (bool success,) = payable(seller).call{value: amount}("");
            require(success);
        } else {
            require(IERC20(sellerTokenAddress).balanceOf(address(this)) >= amount);
            bool success = IERC20(sellerTokenAddress).transfer(seller, amount);
            require(success);
        }
        emit SwapCanceled(seller, sellerTokenAddress, buyerTokenAddress, amount, msg.sender);
        return true;
    }
}