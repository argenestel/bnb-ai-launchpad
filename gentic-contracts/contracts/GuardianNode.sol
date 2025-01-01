// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GuardianNode is AccessControl {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    
    struct Guardian {
        address addr;
        uint256 stake;
        uint256 lastActivityTime;
        bool isActive;
    }
    
    mapping(address => Guardian) public guardians;
    uint256 public totalGuardians;
    uint256 public constant MAX_GUARDIANS = 10;
    uint256 public constant MIN_STAKE = 1000 ether; // 1000 tokens minimum stake
    
    IERC20 public stakingToken;
    
    event GuardianRegistered(address guardian);
    event GuardianRemoved(address guardian);
    event StakeUpdated(address guardian, uint256 newStake);

    constructor(address _stakingToken) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        stakingToken = IERC20(_stakingToken);
    }

    function registerGuardian(address _guardian) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Admin only");
        require(totalGuardians < MAX_GUARDIANS, "Max guardians reached");
        require(!guardians[_guardian].isActive, "Already a guardian");
        
        _setupRole(GUARDIAN_ROLE, _guardian);
        guardians[_guardian] = Guardian({
            addr: _guardian,
            stake: 0,
            lastActivityTime: block.timestamp,
            isActive: true
        });
        totalGuardians++;
        
        emit GuardianRegistered(_guardian);
    }

    function stake(uint256 amount) external {
        require(hasRole(GUARDIAN_ROLE, msg.sender), "Not a guardian");
        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "Stake transfer failed"
        );
        
        guardians[msg.sender].stake += amount;
        require(guardians[msg.sender].stake >= MIN_STAKE, "Minimum stake not met");
        
        emit StakeUpdated(msg.sender, guardians[msg.sender].stake);
    }

    function removeGuardian(address _guardian) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Admin only");
        require(guardians[_guardian].isActive, "Not an active guardian");
        
        revokeRole(GUARDIAN_ROLE, _guardian);
        guardians[_guardian].isActive = false;
        totalGuardians--;
        
        // Return stake
        if (guardians[_guardian].stake > 0) {
            uint256 stakeAmount = guardians[_guardian].stake;
            guardians[_guardian].stake = 0;
            require(
                stakingToken.transfer(_guardian, stakeAmount),
                "Stake return failed"
            );
        }
        
        emit GuardianRemoved(_guardian);
    }

    function updateActivity() external {
        require(hasRole(GUARDIAN_ROLE, msg.sender), "Not a guardian");
        guardians[msg.sender].lastActivityTime = block.timestamp;
    }
} 