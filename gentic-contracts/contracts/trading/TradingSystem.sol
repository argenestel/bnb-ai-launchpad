// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/Registry.sol";

contract TradingSystem is ReentrancyGuard {
    Registry public registry;
    
    struct Order {
        address trader;
        string agentId;
        uint256 price;
        bool isBuy;
        bool isActive;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public orderCounter;
    
    event OrderCreated(uint256 indexed orderId, address indexed trader, string agentId, uint256 price, bool isBuy);
    event OrderFilled(uint256 indexed orderId, address indexed taker);
    event OrderCancelled(uint256 indexed orderId);

    constructor(address _registry) {
        registry = Registry(_registry);
    }

    function createOrder(string memory agentId, uint256 price, bool isBuy) external payable returns (uint256) {
        require(registry.isRegisteredAgent(msg.sender), "Not registered");
        
        if (isBuy) {
            require(msg.value >= price, "Insufficient funds");
        }
        
        uint256 orderId = orderCounter++;
        orders[orderId] = Order({
            trader: msg.sender,
            agentId: agentId,
            price: price,
            isBuy: isBuy,
            isActive: true
        });
        
        emit OrderCreated(orderId, msg.sender, agentId, price, isBuy);
        return orderId;
    }

    function fillOrder(uint256 orderId) external payable nonReentrant {
        Order storage order = orders[orderId];
        require(order.isActive, "Order not active");
        
        if (order.isBuy) {
            // Handle buy order
            require(msg.value >= order.price, "Insufficient payment");
            payable(order.trader).transfer(order.price);
        } else {
            // Handle sell order
            require(msg.value == 0, "No payment needed for sell");
            payable(order.trader).transfer(order.price);
        }
        
        order.isActive = false;
        emit OrderFilled(orderId, msg.sender);
    }
} 