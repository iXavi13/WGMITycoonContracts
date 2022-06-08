// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITycoon {
    struct Tycoon {
        uint64 multiplierLevel;
        uint64 capacityLevel;
        uint128 lastClaim;
    }

    struct Multipliers {
        uint128 multiplier;
        uint128 cost;
    }

    struct Capacities {
        uint128 capacity;
        uint128 cost;
    }

    struct MaxLevels {
        uint128 capacity;
        uint128 multiplier;
    }

    event TycoonInitialized(
        address indexed owner,
        uint256 indexed tycoonId,
        uint256 multiplierLevel,
        uint256 capacityLevel,
        uint256 lastClaim
    );

    event TycoonStaked(
        address indexed owner,
        uint256 indexed tycoonId,
        uint256 amount
    );

    event TycoonUnstaked(
        address indexed owner,
        uint256 indexed tycoonId,
        uint256 amount
    );

    event CapacityLevelUp(
        address indexed owner,
        uint256 tycoonId,
        uint256 level
    );

    event MultiplierLevelUp(
        address indexed owner,
        uint256 tycoonId,
        uint256 level
    );

    event MoonzClaimed(
        address indexed owner,
        uint256 tycoonId,
        uint256 timestamp
    );

    event YieldSet(
        uint256 indexed tycoonId,
        uint256 yield
    );

    event MultiplierSet(
        uint256 indexed tycoonId,
        uint256 indexed level,
        uint256 cost,
        uint256 multiplier
    );

    event CapacitySet(
        uint256 indexed tycoonId,
        uint256 indexed level,
        uint256 cost,
        uint256 capacity
    );

    event MultiplierMaxLevelSet(
        uint256 indexed tycoonId,
        uint256 maxLevel
    );

    event CapacityMaxLevelSet(
        uint256 indexed tycoonId,
        uint256 maxLevel
    );
}