// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GeneticAgent.sol";
import "./GuardianNode.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Breeding is ReentrancyGuard {
    struct BreedingProposal {
        address proposer;
        string parent1Id;
        string parent2Id;
        uint256 timestamp;
        uint256 approvals;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    struct BreedingRules {
        uint256 minParentFitness;
        uint256 maxGenerationGap;
        uint256 minMcap;
        uint256 cooldownPeriod;
    }

    GeneticAgent public geneticAgent;
    GuardianNode public guardianNode;
    BreedingRules public rules;
    
    mapping(uint256 => BreedingProposal) public proposals;
    uint256 public proposalCounter;
    
    event BreedingSuccessful(string parent1Id, string parent2Id, string childId);
    event TraitInherited(string childId, bytes32 traitKey, uint256 value);

    constructor(address _geneticAgent, address _guardianNode) {
        geneticAgent = GeneticAgent(_geneticAgent);
        guardianNode = GuardianNode(_guardianNode);
        
        rules = BreedingRules({
            minParentFitness: 1000,
            maxGenerationGap: 2,
            minMcap: 50000,
            cooldownPeriod: 7 days
        });
    }

    function submitBreedingProposal(
        string memory parent1Id,
        string memory parent2Id
    ) external payable nonReentrant {
        require(msg.value >= geneticAgent.CREATION_COST(), "Insufficient breeding cost");
        require(_validateBreedingPair(parent1Id, parent2Id), "Invalid breeding pair");

        uint256 proposalId = proposalCounter++;
        BreedingProposal storage proposal = proposals[proposalId];
        proposal.proposer = msg.sender;
        proposal.parent1Id = parent1Id;
        proposal.parent2Id = parent2Id;
        proposal.timestamp = block.timestamp;
    }

    function _validateBreedingPair(
        string memory parent1Id,
        string memory parent2Id
    ) internal view returns (bool) {
        (uint256 gen1, uint256 fam1, uint256 fit1) = geneticAgent.getAgentDetails(parent1Id);
        (uint256 gen2, uint256 fam2, uint256 fit2) = geneticAgent.getAgentDetails(parent2Id);

        require(fam1 != fam2, "Same family breeding not allowed");
        require(
            abs(int256(gen1) - int256(gen2)) <= rules.maxGenerationGap,
            "Generation gap too large"
        );
        require(
            fit1 >= rules.minParentFitness && fit2 >= rules.minParentFitness,
            "Insufficient fitness"
        );

        return true;
    }

    function _inheritTraits(
        string memory childId,
        string memory parent1Id,
        string memory parent2Id
    ) internal {
        bytes32[] memory traitKeys = geneticAgent.getTraitKeys(parent1Id);
        
        for (uint i = 0; i < traitKeys.length; i++) {
            (uint256 value1, uint256 dom1) = geneticAgent.getTraitDetails(parent1Id, traitKeys[i]);
            (uint256 value2, uint256 dom2) = geneticAgent.getTraitDetails(parent2Id, traitKeys[i]);
            
            uint256 inheritedValue;
            if (dom1 > dom2) {
                inheritedValue = value1;
            } else if (dom2 > dom1) {
                inheritedValue = value2;
            } else {
                // Equal dominance - take average with mutation chance
                inheritedValue = (value1 + value2) / 2;
                if (_shouldMutate()) {
                    inheritedValue = _applyMutation(inheritedValue);
                }
            }
            
            emit TraitInherited(childId, traitKeys[i], inheritedValue);
        }
    }

    function _shouldMutate() internal view returns (bool) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 100 < 5; // 5% mutation chance
    }

    function _applyMutation(uint256 value) internal view returns (uint256) {
        uint256 mutationFactor = uint256(keccak256(abi.encodePacked(block.timestamp))) % 30 + 85; // ±15% mutation
        return (value * mutationFactor) / 100;
    }

    function abs(int256 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }
} 