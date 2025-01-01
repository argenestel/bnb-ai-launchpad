// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../core/Registry.sol";
import "../token/AgentToken.sol";
import "../character/CharacterManager.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AgentFactory is ReentrancyGuard {
    Registry public registry;
    CharacterManager public characterManager;
    
    struct AgentConfig {
        string name;
        string symbol;
        string id;
        uint256 generation;
        uint256 familyCode;
        uint256 serialNum;
        // Character metadata
        string characterName;
        string description;
        string ipfsHash;
        string imageHash;
    }

    event AgentCreated(
        address indexed agentAddress,
        address indexed tokenAddress,
        string id,
        string ipfsHash
    );

    constructor(address _registry, address _characterManager) {
        registry = Registry(_registry);
        characterManager = CharacterManager(_characterManager);
    }

    function createAgent(AgentConfig memory config) 
        external 
        payable 
        nonReentrant 
        returns (address agentAddr, address tokenAddr) 
    {
        // Create token
        AgentToken token = new AgentToken(
            config.name,
            config.symbol
        );

        // Create agent character
        characterManager.createCharacter(
            config.id,
            config.characterName,
            config.description,
            config.ipfsHash,
            config.imageHash
        );

        // Register agent
        registry.registerAgent(address(token));
        
        emit AgentCreated(
            address(token),
            address(token),
            config.id,
            config.ipfsHash
        );

        return (address(token), address(token));
    }
} 