// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentSystem {
    struct AgentInfo {
        string id;
        uint256 generation;
        uint256 familyCode;
        uint256 serialNum;
        uint256 birthTime;
        uint256 mcap;
        bool isActive;
    }

    event AgentCreated(string id, uint256 generation, uint256 familyCode);
    event AgentEvolved(string id, bytes32[] traits);
    event AgentRetired(string id);

    function createAgent(string memory id, uint256 generation, uint256 familyCode) external;
    function evolveAgent(string memory id, bytes32[] memory traits) external;
    function retireAgent(string memory id) external;
} 