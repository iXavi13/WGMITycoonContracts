// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./ITycoon.sol";
import "./IMoonz.sol";
import "./IWGMIT.sol";


//TODO LIST
// MAKE HOLDER CONTRACT
// BURN AND STAKE
// BURN AND STAKE - BURN MOONZ FROM CONTRACT - BURN FROM STAKED - MINT TO CONTRACT - ADD TO STAKED

contract TycoonGame is Initializable, ITycoon, ERC1155HolderUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    bytes32 public constant GAME_ADMIN = keccak256("GAME_ADMIN");
    IWGMITycoon public tycoonInterface;
    IMoonz public moonz;

    function initialize(address admin) external initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(GAME_ADMIN, admin);
    }
     
    // Yield Info
    uint256 public yieldStartTime;
    bool public paused = false;
    
    //Player => Tycoon ID => Tycoon Info
    mapping(address => mapping (uint256 => Tycoon)) public tycoons;

    //Tycoon ID => Value
    mapping(uint256 => uint256) public yield;
    mapping(uint256 => MaxLevels) public maxLevel;

    //Tycoon ID => Level => Multiplier/Capacity/Cost
    mapping(uint256 => mapping (uint256 => Multipliers)) public multiplier;
    mapping(uint256 => mapping (uint256 => Capacities)) public capacity;

    mapping(address => mapping (uint256 => uint256)) public stakedTokens;

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "Caller is another contract");
        _;
    }

    modifier callerIsHelper() {
        require(tx.origin != msg.sender, "Caller is helper contract");
        _;
    }

    modifier isNotPaused() {
        require(!paused, "Game is paused");
        _;
    }

    function stakeTycoon(uint256 id, uint256 amount) external nonReentrant isNotPaused() callerIsUser() {
        require(yield[id] > 0, "Nonexistent token URI");
        
        tycoonInterface.safeTransferFrom(msg.sender, address(this), id, amount, "");
        stakedTokens[msg.sender][id] += amount;
        if(tycoons[msg.sender][id].lastClaim == 0){
            _initializeTycoon(id);
        }
        emit TycoonStaked(msg.sender, id, stakedTokens[msg.sender][id]);
    }

    function unstakeTycoon(uint256 id, uint256 amount) external nonReentrant callerIsUser() {
        require(amount < stakedTokens[msg.sender][id] + 1, "Exceeded staked amount");

        tycoonInterface.safeTransferFrom(address(this), msg.sender, id, amount, "");
        stakedTokens[msg.sender][id] -= amount;
        tycoons[msg.sender][id].lastClaim = uint64(block.timestamp);
        emit TycoonUnstaked(msg.sender, id, stakedTokens[msg.sender][id]);
    }

    function claim(uint256[] calldata ids) external nonReentrant isNotPaused() callerIsUser() {
        require(ids.length > 0, "Claiming 0 amount");
        uint256 claimAmount = 0;

        for (uint256 i = 0; i < ids.length;) {
            claimAmount += _getPendingYield(ids[i], msg.sender);
            unchecked { ++i; }
        }

        moonz.mint(msg.sender, claimAmount);
    }

    function mintAndStake(uint256[] memory ids, uint256[] memory amounts) external {
        //How do we get the moonz?
        tycoonInterface.mintTycoons(ids, amounts);
        for (uint256 i = 0; i < ids.length;) {
            uint256 id = ids[i];
            stakedTokens[msg.sender][id] += amounts[id];
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
        require(ids.length > 0, "No tycoon selected");

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 capLevel_ = uint256(tycoons[msg.sender][id].capacityLevel);

            require(maxLevel[id].capacity > 0, "Cap level doesn't exist");
            require(capLevel_ + 1 < maxLevel[id].capacity + 1, "Max cap reached");
            require(moonz.balanceOf(msg.sender) >= capacity[id][capLevel_].cost, "Not enough moonz");
            require(moonz.allowance(msg.sender, address(this)) >= capacity[id][capLevel_].cost, "Not enough moonz allowance");
            
            moonz.burnFrom(msg.sender, capacity[id][capLevel_].cost);
            unchecked {
                tycoons[msg.sender][id].capacityLevel += 1;
            }
            emit CapacityLevelUp(msg.sender, id, capLevel_ + 1);
        }
    }

    function increaseMultipliers(uint256[] calldata ids) public callerIsUser() {
        require(ids.length > 0, "No tycoon selected");
    
        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 multiplierLevel_ = uint256(tycoons[msg.sender][id].multiplierLevel);

            require(maxLevel[id].multiplier > 0, "Cap level doesn't exist");
            require(multiplierLevel_ < maxLevel[id].multiplier + 1, "Max cap reached");
            require(moonz.balanceOf(msg.sender) >= multiplier[id][multiplierLevel_].cost, "Not enough moonz");
            require(moonz.allowance(msg.sender, address(this)) >= multiplier[id][multiplierLevel_].cost, "Not enough moonz allowance"); //potentially unneeded
            
            moonz.burnFrom(msg.sender, multiplier[id][multiplierLevel_].cost);
            tycoons[msg.sender][id].multiplierLevel = uint64(multiplierLevel_);
            unchecked {
                tycoons[msg.sender][id].multiplierLevel += 1;
            }
            emit MultiplierLevelUp(msg.sender, id, multiplierLevel_ + 1);
        }
    }

    function _getPendingYield(uint256 id, address owner) internal returns(uint256){
        Tycoon memory tycoon_ = tycoons[owner][id];
        if (tycoon_.lastClaim == 0 || block.timestamp < yieldStartTime) return 0;

        uint256 capacityValue = capacity[id][tycoon_.capacityLevel].capacity;
        uint256 multiplierValue = multiplier[id][tycoon_.multiplierLevel].multiplier;
        uint256 balance = stakedTokens[msg.sender][id];
        tycoons[owner][id].lastClaim = uint64(block.timestamp);

        //Checking if started every single time, check this logic again
        uint256 _timeElapsed = tycoon_.lastClaim > yieldStartTime 
                                ? block.timestamp - tycoon_.lastClaim 
                                : block.timestamp - yieldStartTime;

        emit MoonzClaimed(msg.sender, id, block.timestamp);
        return ((_timeElapsed * yield[id]) / 1 days) * ((balance * multiplierValue) * 1 ether)
                > (((capacityValue * balance)) * 1 ether)
                ? (((capacityValue * balance)) * 1 ether)
                : ((_timeElapsed * yield[id]) / 1 days) * ((balance * multiplierValue) * 1 ether);
    }

    
    function _initializeTycoon(uint256 id) internal {
        tycoons[msg.sender][id] = Tycoon(
            1,
            1,
            uint128(block.timestamp)
        );
        emit TycoonInitialized(msg.sender, id, 1, 1, block.timestamp);
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
    ) external callerIsHelper() onlyRole(GAME_ADMIN) {
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
    ) external callerIsHelper() onlyRole(GAME_ADMIN) {
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
    ) external callerIsHelper() onlyRole(GAME_ADMIN) {

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

    function setMultiplierMaxLevels(
        uint256[] calldata ids,
        uint256[] calldata maxLevel_
    ) external callerIsHelper() onlyRole(GAME_ADMIN) {
    for (uint256 i = 0; i < ids.length;) {
            uint256 id = ids[i];
            maxLevel[id].multiplier = uint128(maxLevel_[i]);

            emit MultiplierMaxLevelSet(id, maxLevel_[i]);
            unchecked { ++i; }
        }
    }

    function setCapacityMaxLevels(
        uint256[] calldata ids,
        uint256[] calldata maxLevel_
    ) external callerIsHelper() onlyRole(GAME_ADMIN) {
    for (uint256 i = 0; i < ids.length;) {
            uint256 id = ids[i];
            maxLevel[id].capacity = uint128(maxLevel_[i]);

            emit CapacityMaxLevelSet(id, maxLevel_[i]);
            unchecked { ++i; }
        }
    }

    function setTycoonCost(uint256[] calldata ids, uint256[] calldata burnAmount, uint256[] calldata moonzCost) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(ids.length == burnAmount.length && burnAmount.length == moonzCost.length, "Incorrect array lengths");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            tycoonCost[id] = TycoonCost(
                uint128(burnAmount[i]),
                uint128(moonzCost[i])
            );
        }
    }


    function setInterfaces(IMoonz IMoonz_, IWGMITycoon IWGMITycoon_) external onlyRole(GAME_ADMIN) {
        moonz = IMoonz_;
        tycoonInterface = IWGMITycoon_;
    }

    function withdrawMoney() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override
        (ERC1155ReceiverUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}