// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGenetics {
    struct Trait {
        uint256 value;
        uint256 dominance; // 0-100, determines inheritance probability
        bool mutable;      // Can this trait be modified through evolution
    }

    struct DNA {
        uint256 generation;
        uint256 familyCode;
        uint256 serialNum;
        mapping(bytes32 => Trait) traits;
        bytes32[] traitKeys;
    }
} 