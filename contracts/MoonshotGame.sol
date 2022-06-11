// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "./IMoonshot.sol";
import "./IMoonz.sol";
import "./IMoonshotToken.sol";


//TODO LIST
// MAKE HOLDER CONTRACT
// BURN AND STAKE
// BURN AND STAKE - BURN MOONZ FROM CONTRACT - BURN FROM STAKED - MINT TO CONTRACT - ADD TO STAKED
// Consider Paused

contract MoonshotGame is Initializable, IMoonshot, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    bytes32 public constant GAME_ADMIN = keccak256("GAME_ADMIN");
    IERC1155Upgradeable public tokenHolder;
    IMoonshotToken public moonshotInterface;
    IMoonz public moonz;

    function initialize(address admin) external initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(GAME_ADMIN, admin);
    }
     
    // Yield Info
    uint256 public yieldStartTime;
    bool public paused;
    
    //Player => Moonshot ID => Moonshot Info
    mapping(address => mapping (uint256 => Business)) public business;

    //Moonshot ID => Value
    mapping(uint256 => uint256) public yield;
    mapping(uint256 => uint256) public businessCost;
    mapping(uint256 => MaxLevels) public maxLevel;

    //Moonshot ID => Level => Multiplier/Capacity/Cost
    mapping(uint256 => mapping (uint256 => Multipliers)) public multiplier;
    mapping(uint256 => mapping (uint256 => Capacities)) public capacity;
    mapping(address => mapping (uint256 => uint256)) public stakedTokens;

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "Caller is another contract");
        _;
    }

    function stakeBusiness(uint256 id, uint256 amount) external nonReentrant callerIsUser() {
        require(yield[id] > 0, "Yield not set");
        
        moonshotInterface.safeTransferFrom(msg.sender, address(tokenHolder), id, amount, "");
        stakedTokens[msg.sender][id] += amount;
        if(business[msg.sender][id].lastClaim == 0){
            _initializeBusiness(id);
        }
        emit BusinessStaked(msg.sender, id, stakedTokens[msg.sender][id]);
    }

    function unstakeBusiness(uint256 id, uint256 amount) external nonReentrant callerIsUser() {
        require(amount < stakedTokens[msg.sender][id] + 1, "Exceeded staked amount");

        moonshotInterface.safeTransferFrom(address(tokenHolder), msg.sender, id, amount, "");
        stakedTokens[msg.sender][id] -= amount;
        business[msg.sender][id].lastClaim = uint64(block.timestamp);
        emit BusinessUnstaked(msg.sender, id, stakedTokens[msg.sender][id]);
    }

    function claim(uint256[] calldata ids) external nonReentrant callerIsUser() {
        require(ids.length > 0, "Claiming 0 amount");
        uint256 claimAmount = 0;

        for (uint256 i = 0; i < ids.length;) {
            claimAmount += _getPendingYield(ids[i], msg.sender);
            unchecked { ++i; }
        }

        moonz.mint(msg.sender, claimAmount);
    }

    function mintAndStake(uint256[] memory ids, uint256[] memory amounts) external nonReentrant {
        //How do we get the moonz?
        for (uint256 i = 0; i < ids.length;) {
            uint256 id = ids[i];
            uint256 cost = uint256(businessCost[id]);
            uint256 mintAmount = amounts[i];
            require(cost > 0, "Business not configured");

            moonz.burnFrom(msg.sender, cost * 1 ether);
            moonshotInterface.mintBusiness(address(tokenHolder), id, mintAmount);

            if(business[msg.sender][id].lastClaim == 0){
                _initializeBusiness(id);
            }
            stakedTokens[msg.sender][id] += mintAmount;
            unchecked { ++i; }
        }
    }

    function increaseCapsAndMultipliers( 
        uint256[] calldata capacityIds,
        uint256[] calldata multiplierIds) 
        external 
        callerIsUser() 
    {
        increaseCaps(capacityIds);
        increaseMultipliers(multiplierIds);
    }

    function increaseCaps(uint256[] calldata ids) public callerIsUser() {
        require(ids.length > 0, "No moonshot selected");

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 capLevel_ = uint256(business[msg.sender][id].capacityLevel);

            require(maxLevel[id].capacity > 0, "Cap level doesn't exist");
            require(capLevel_ + 1 < maxLevel[id].capacity + 1, "Max cap reached");
            require(moonz.balanceOf(msg.sender) >= capacity[id][capLevel_].cost, "Not enough moonz");
            require(moonz.allowance(msg.sender, address(this)) >= capacity[id][capLevel_].cost, "Not enough moonz allowance");
            
            moonz.burnFrom(msg.sender, capacity[id][capLevel_].cost);
            unchecked {
                business[msg.sender][id].capacityLevel += 1;
            }
            emit CapacityLevelUp(msg.sender, id, capLevel_ + 1);
        }
    }

    function increaseMultipliers(uint256[] calldata ids) public callerIsUser() {
        require(ids.length > 0, "No moonshot selected");
    
        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 multiplierLevel_ = uint256(business[msg.sender][id].multiplierLevel);

            require(maxLevel[id].multiplier > 0, "Cap level doesn't exist");
            require(multiplierLevel_ < maxLevel[id].multiplier + 1, "Max cap reached");
            require(moonz.balanceOf(msg.sender) >= multiplier[id][multiplierLevel_].cost, "Not enough moonz");
            require(moonz.allowance(msg.sender, address(this)) >= multiplier[id][multiplierLevel_].cost, "Not enough moonz allowance"); //potentially unneeded
            
            moonz.burnFrom(msg.sender, multiplier[id][multiplierLevel_].cost);
            business[msg.sender][id].multiplierLevel = uint64(multiplierLevel_);
            unchecked {
                business[msg.sender][id].multiplierLevel += 1;
            }
            emit MultiplierLevelUp(msg.sender, id, multiplierLevel_ + 1);
        }
    }

    function _getPendingYield(uint256 id, address owner) internal returns(uint256){
        Business memory business_ = business[owner][id];
        if (business_.lastClaim == 0 || block.timestamp < yieldStartTime) return 0;

        uint256 capacityValue = capacity[id][business_.capacityLevel].capacity;
        uint256 multiplierValue = multiplier[id][business_.multiplierLevel].multiplier;
        uint256 balance = stakedTokens[msg.sender][id];
        business[owner][id].lastClaim = uint64(block.timestamp);

        //Checking if started every single time, check this logic again
        uint256 _timeElapsed = business_.lastClaim > yieldStartTime 
                                ? block.timestamp - business_.lastClaim 
                                : block.timestamp - yieldStartTime;

        uint256 claimAmount = ((_timeElapsed * yield[id]) / 1 days) * ((balance * multiplierValue) * 1 ether)
                > (((capacityValue * balance)) * 1 ether)
                ? (((capacityValue * balance)) * 1 ether)
                : ((_timeElapsed * yield[id]) / 1 days) * ((balance * multiplierValue) * 1 ether);

        emit MoonzClaimed(msg.sender, claimAmount, id, block.timestamp);
        return claimAmount;
    }

    
    function _initializeBusiness(uint256 id) internal {
        business[msg.sender][id] = Business(
            1,
            1,
            uint128(block.timestamp)
        );
        emit BusinessInitialized(msg.sender, id, 1, 1, block.timestamp);
    }

    //ADMIN FUNCTIONS
    function setPaused(bool paused_) external onlyRole(GAME_ADMIN) {
        paused = paused_;
    }

    function setYieldStart(uint256 yieldStartTime_) external onlyRole(GAME_ADMIN) {
        yieldStartTime = yieldStartTime_;
    }

    function setYields(
        uint256[] calldata ids, 
        uint256[] calldata yieldRates
    ) external onlyRole(GAME_ADMIN) {
        for (uint256 i = 0; i < ids.length; ++i) {
            yield[ids[i]] = yieldRates[i];
            emit YieldSet(ids[i], yieldRates[i]);
        }
    }

    function setMultiplierLevels(
        uint256[] calldata ids, 
        uint256[] calldata levels,
        uint256[] calldata multiplier_,
        uint256[] calldata cost
    ) external onlyRole(GAME_ADMIN) {
        for (uint256 i = 0; i < ids.length;) {
            uint256 id = ids[i];
            uint256 multiplierValue = multiplier_[i];
            uint256 level = levels[i];

            multiplier[id][level].cost = uint128(cost[i]);
            multiplier[id][level].multiplier = uint128(multiplierValue);

            emit MultiplierSet(id, level, cost[i], multiplierValue);
            unchecked { ++i; }
        }
    }

    function setCapacityLevels(
        uint256[] calldata ids, 
        uint256[] calldata levels,
        uint256[] calldata capacity_,
        uint256[] calldata cost
    ) external onlyRole(GAME_ADMIN) {

        for (uint256 i = 0; i < ids.length;) {
            uint256 id = ids[i];
            uint256 capacityValue = capacity_[i];
            uint256 level = levels[i];
            
            capacity[id][level].cost = uint128(cost[i]);
            capacity[id][level].capacity = uint128(capacityValue);

            emit CapacitySet(id, level,cost[i], capacityValue);
            unchecked { ++i; }
        }
    }

    function setCapAndMultiplierMaxLevels(
        uint256[] calldata ids,
        uint256[] calldata capMaxLevel,
        uint256[] calldata multMaxLevel
    ) external onlyRole(GAME_ADMIN) {
    for (uint256 i = 0; i < ids.length;) {
            uint256 id = ids[i];
            maxLevel[id].multiplier = uint128(multMaxLevel[i]);
            maxLevel[id].capacity = uint128(capMaxLevel[i]);

            emit CapAndMultiplierMaxLevelSet(id, capMaxLevel[i], multMaxLevel[i]);
            unchecked { ++i; }
        }
    }

    function setBusinessCost(
        uint256[] calldata ids, 
        uint256[] calldata moonzCost
    ) external onlyRole(GAME_ADMIN) {
        require(ids.length ==  moonzCost.length, "Incorrect array lengths");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            businessCost[id] = moonzCost[i];
        }
    }

    function setInterfaces(
        IMoonz moonzInterface, 
        IMoonshotToken moonshotInterface_, 
        IERC1155Upgradeable holderInterface
        ) external onlyRole(GAME_ADMIN) {
        moonz = moonzInterface;
        moonshotInterface = moonshotInterface_;
        tokenHolder = holderInterface;
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override
        (AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}