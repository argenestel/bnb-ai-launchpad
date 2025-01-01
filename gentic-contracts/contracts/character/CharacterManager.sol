// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../core/Registry.sol";
import "../interfaces/ICharacterMetadata.sol";

contract CharacterManager is ICharacterMetadata, Ownable {
    Registry public registry;
    
    mapping(string => CharacterInfo) private characters;
    mapping(string => bool) public hasCharacter;
    
    event CharacterCreated(string indexed agentId, string ipfsHash);
    event CharacterImageUpdated(string indexed agentId, string imageHash);

    constructor(address _registry) Ownable(msg.sender) {
        registry = Registry(_registry);
    }

    function createCharacter(
        string memory agentId,
        string memory name,
        string memory description,
        string memory ipfsHash,
        string memory imageHash
    ) external {
        require(!hasCharacter[agentId], "Character exists");
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        
        CharacterInfo storage character = characters[agentId];
        character.name = name;
        character.description = description;
        character.ipfsHash = ipfsHash;
        character.imageHash = imageHash;
        character.lastUpdate = block.timestamp;
        
        hasCharacter[agentId] = true;
        
        emit CharacterCreated(agentId, ipfsHash);
    }

    function updateCharacter(
        string memory agentId,
        string memory ipfsHash
    ) external override {
        require(hasCharacter[agentId], "Character doesn't exist");
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        
        CharacterInfo storage character = characters[agentId];
        character.ipfsHash = ipfsHash;
        character.lastUpdate = block.timestamp;
        
        emit CharacterUpdated(agentId, ipfsHash);
    }

    function updateImage(
        string memory agentId,
        string memory imageHash
    ) external {
        require(hasCharacter[agentId], "Character doesn't exist");
        require(bytes(imageHash).length > 0, "Invalid image hash");
        
        characters[agentId].imageHash = imageHash;
        characters[agentId].lastUpdate = block.timestamp;
        
        emit CharacterImageUpdated(agentId, imageHash);
    }

    function addAttribute(
        string memory agentId,
        string memory key,
        string memory value
    ) external {
        require(hasCharacter[agentId], "Character doesn't exist");
        require(bytes(key).length > 0, "Invalid key");
        
        characters[agentId].attributes[key] = value;
        characters[agentId].lastUpdate = block.timestamp;
        
        emit AttributeAdded(agentId, key, value);
    }

    function getCharacterInfo(string memory agentId) external view override returns (
        string memory name,
        string memory description,
        string memory ipfsHash,
        string memory imageHash,
        uint256 lastUpdate
    ) {
        require(hasCharacter[agentId], "Character doesn't exist");
        CharacterInfo storage character = characters[agentId];
        
        return (
            character.name,
            character.description,
            character.ipfsHash,
            character.imageHash,
            character.lastUpdate
        );
    }

    function getAttribute(
        string memory agentId,
        string memory key
    ) external view returns (string memory) {
        require(hasCharacter[agentId], "Character doesn't exist");
        return characters[agentId].attributes[key];
    }
} 