// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICharacterMetadata {
    struct CharacterInfo {
        string name;
        string description;
        string ipfsHash;       // Main character file hash
        string imageHash;      // Character image hash
        uint256 lastUpdate;    // Last metadata update timestamp
        mapping(string => string) attributes; // Additional dynamic attributes
    }

    event CharacterUpdated(string indexed agentId, string ipfsHash);
    event AttributeAdded(string indexed agentId, string key, string value);

    function updateCharacter(string memory agentId, string memory ipfsHash) external;
    function getCharacterInfo(string memory agentId) external view returns (
        string memory name,
        string memory description,
        string memory ipfsHash,
        string memory imageHash,
        uint256 lastUpdate
    );
} 