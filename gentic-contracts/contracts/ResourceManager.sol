// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GeneticAgent.sol";

contract ResourceManager is Ownable {
    struct ResourcePool {
        uint256 totalSupply;
        uint256 allocated;
        uint256 minimumPerAgent;
    }

    GeneticAgent public geneticAgent;
    ResourcePool public pool;
    
    mapping(string => uint256) public agentResources;
    mapping(string => uint256) public lastResourceUpdate;
    
    uint256 public constant RESOURCE_UPDATE_INTERVAL = 1 days;
    uint256 public constant RESOURCE_DECAY_RATE = 5; // 5% daily decay

    event ResourcesAllocated(string agentId, uint256 amount);
    event ResourcesDecayed(string agentId, uint256 amount);

    constructor(address _geneticAgent) {
        geneticAgent = GeneticAgent(_geneticAgent);
        pool.minimumPerAgent = 100 ether;
    }

    function allocateResources(string memory agentId, uint256 amount) external {
        require(msg.sender == address(geneticAgent), "Only genetic agent can allocate");
        require(pool.allocated + amount <= pool.totalSupply, "Insufficient resources");

        agentResources[agentId] += amount;
        pool.allocated += amount;
        lastResourceUpdate[agentId] = block.timestamp;

        emit ResourcesAllocated(agentId, amount);
    }

    function updateResources(string memory agentId) external {
        require(block.timestamp >= lastResourceUpdate[agentId] + RESOURCE_UPDATE_INTERVAL, "Too soon");

        uint256 currentResources = agentResources[agentId];
        uint256 decayAmount = (currentResources * RESOURCE_DECAY_RATE) / 100;
        
        agentResources[agentId] = currentResources - decayAmount;
        pool.allocated -= decayAmount;
        lastResourceUpdate[agentId] = block.timestamp;

        emit ResourcesDecayed(agentId, decayAmount);
    }
} 