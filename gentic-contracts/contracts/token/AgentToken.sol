// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentToken is ERC20Permit, ERC20Votes, Ownable {
    // Token distribution parameters
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 1e18;
    
    struct Distribution {
        uint256 operationalShare;    // 0.01%
        uint256 guardianShare;       // 0.1%
        uint256 computeShare;        // 5%
        uint256 breedingShare;       // 10%
        uint256 liquidityShare;      // 20%
        uint256 tradingShare;        // 64.89%
    }
    
    Distribution public distribution;

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) 
      ERC20Permit(name)
      Ownable(msg.sender) {
        _initializeDistribution();
        _mint(address(this), INITIAL_SUPPLY);
    }

    function _initializeDistribution() private {
        distribution = Distribution({
            operationalShare: 1,      // 0.01%
            guardianShare: 10,        // 0.1%
            computeShare: 500,        // 5%
            breedingShare: 1000,      // 10%
            liquidityShare: 2000,     // 20%
            tradingShare: 6489        // 64.89%
        });
    }

    // Override required functions
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
} 