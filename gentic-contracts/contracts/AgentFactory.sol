// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AgentToken.sol";
import "./GeneticAgent.sol";

contract AgentFactory is Ownable {
    event AgentDeployed(address agentToken, address geneticAgent);

    function deployNewAgent(
        string memory name,
        string memory symbol,
        string memory id,
        uint256 generation,
        uint256 familyCode,
        uint256 serialNum
    ) external onlyOwner returns (address, address) {
        // Deploy token contract
        AgentToken token = new AgentToken(name, symbol);
        
        // Deploy genetic agent contract
        GeneticAgent agent = new GeneticAgent();
        
        // Create the agent
        agent.createAgent(id, generation, familyCode, serialNum);
        
        emit AgentDeployed(address(token), address(agent));
        return (address(token), address(agent));
    }
} 