// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IGenetics.sol";

contract GeneticAgent is Ownable, ReentrancyGuard, IGenetics {
    struct Agent {
        string id;          
        DNA dna;
        uint256 birthTime;
        uint256 mcap;
        uint256 lastActivityTime;
        uint256 fitness;    // Calculated fitness score
        uint256 resources;  // Available resources
        bool isActive;
        bool inCooldown;
    }

    struct FitnessParams {
        uint256 mcapWeight;     // Weight for market cap in fitness calculation
        uint256 volumeWeight;   // Weight for volume in fitness calculation
        uint256 ageWeight;      // Weight for age in fitness calculation
        uint256 resourceWeight; // Weight for resources in fitness calculation
    }

    // Constants
    uint256 public constant CREATION_COST = 1000 ether;
    uint256 public constant MIN_MCAP_AWAKE = 100_000;
    uint256 public constant COMPUTE_COST = 10;
    uint256 public constant COMPUTE_TOKEN_REQ = 1e15;
    uint256 public constant COOLDOWN_PERIOD = 7 days;
    uint256 public constant MAX_GENERATION = 10;

    mapping(string => Agent) public agents;
    mapping(string => address) public agentOwners;
    mapping(uint256 => string[]) public generationAgents;
    FitnessParams public fitnessParams;

    event AgentCreated(string id, uint256 generation, uint256 familyCode);
    event AgentEvolved(string id, bytes32[] modifiedTraits);
    event TraitInherited(string childId, string parentId, bytes32 traitKey);
    event FitnessUpdated(string id, uint256 newFitness);

    constructor() {
        fitnessParams = FitnessParams({
            mcapWeight: 40,
            volumeWeight: 30,
            ageWeight: 20,
            resourceWeight: 10
        });
    }

    function createAgent(
        string memory id,
        uint256 generation,
        uint256 familyCode,
        bytes32[] memory initialTraits,
        uint256[] memory traitValues
    ) external payable nonReentrant {
        require(msg.value >= CREATION_COST, "Insufficient creation cost");
        require(generation <= MAX_GENERATION, "Max generation exceeded");
        require(agents[id].birthTime == 0, "Agent already exists");
        require(initialTraits.length == traitValues.length, "Trait mismatch");

        Agent storage newAgent = agents[id];
        newAgent.id = id;
        newAgent.dna.generation = generation;
        newAgent.dna.familyCode = familyCode;
        newAgent.dna.serialNum = generationAgents[generation].length;
        newAgent.birthTime = block.timestamp;
        newAgent.isActive = true;

        // Initialize traits
        for (uint i = 0; i < initialTraits.length; i++) {
            newAgent.dna.traits[initialTraits[i]] = Trait({
                value: traitValues[i],
                dominance: 50, // Default dominance
                mutable: true
            });
            newAgent.dna.traitKeys.push(initialTraits[i]);
        }

        agentOwners[id] = msg.sender;
        generationAgents[generation].push(id);

        emit AgentCreated(id, generation, familyCode);
    }

    function calculateFitness(string memory id) public view returns (uint256) {
        Agent storage agent = agents[id];
        
        uint256 mcapScore = (agent.mcap * fitnessParams.mcapWeight) / 100;
        uint256 ageScore = ((block.timestamp - agent.birthTime) * fitnessParams.ageWeight) / 100;
        uint256 resourceScore = (agent.resources * fitnessParams.resourceWeight) / 100;
        
        return mcapScore + ageScore + resourceScore;
    }

    function evolveAgent(string memory id, bytes32[] memory traitsToEvolve) external {
        require(msg.sender == agentOwners[id], "Not agent owner");
        require(!agents[id].inCooldown, "Agent in cooldown");
        
        Agent storage agent = agents[id];
        
        for (uint i = 0; i < traitsToEvolve.length; i++) {
            require(agent.dna.traits[traitsToEvolve[i]].mutable, "Trait not mutable");
            
            // Evolution logic - can be customized
            uint256 oldValue = agent.dna.traits[traitsToEvolve[i]].value;
            uint256 newValue = (oldValue * (100 + _getRandomEvolutionFactor())) / 100;
            agent.dna.traits[traitsToEvolve[i]].value = newValue;
        }

        agent.inCooldown = true;
        agent.lastActivityTime = block.timestamp;
        
        emit AgentEvolved(id, traitsToEvolve);
    }

    function _getRandomEvolutionFactor() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % 30; // 0-29% change
    }

    // Add more functions for trait inheritance, resource management, etc.
} 