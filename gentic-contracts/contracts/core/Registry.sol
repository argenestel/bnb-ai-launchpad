// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Registry is Ownable {
    // System component addresses
    address public agentFactory;
    address public breedingSystem;
    address public resourceSystem;
    address public tradingSystem;
    address public stakingSystem;
    
    // Registered agents
    mapping(address => bool) public isRegisteredAgent;
    
    event SystemComponentUpdated(string indexed component, address indexed addr);
    event AgentRegistered(address indexed agent);

    constructor() Ownable(msg.sender) {}

    function setAgentFactory(address _addr) external onlyOwner {
        agentFactory = _addr;
        emit SystemComponentUpdated("AgentFactory", _addr);
    }

    function registerAgent(address _agent) external {
        require(msg.sender == agentFactory, "Only factory");
        isRegisteredAgent[_agent] = true;
        emit AgentRegistered(_agent);
    }

    // Add more system component setters as needed
} 