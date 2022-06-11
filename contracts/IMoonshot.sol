// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMoonshot {
    struct Business {
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

    event BusinessInitialized(
        address indexed owner,
        uint256 indexed id,
        uint256 multiplierLevel,
        uint256 capacityLevel,
        uint256 lastClaim
    );

    event BusinessStaked(
        address indexed owner,
        uint256 indexed id,
        uint256 amount
    );

    event BusinessUnstaked(
        address indexed owner,
        uint256 indexed id,
        uint256 amount
    );

    event CapacityLevelUp(
        address indexed owner,
        uint256 id,
        uint256 level
    );

    event MultiplierLevelUp(
        address indexed owner,
        uint256 id,
        uint256 level
    );

    event MoonzClaimed(
        address indexed owner,
        uint256 indexed id,
        uint256 amount,
        uint256 timestamp
    );

    event YieldSet(
        uint256 indexed id,
        uint256 yield
    );

    event MultiplierSet(
        uint256 indexed id,
        uint256 indexed level,
        uint256 cost,
        uint256 multiplier
    );

    event CapacitySet(
        uint256 indexed id,
        uint256 indexed level,
        uint256 cost,
        uint256 capacity
    );

    event CapAndMultiplierMaxLevelSet(
        uint256 indexed id,
        uint256 capacityMaxLevel,
        uint256 multiplierMaxLevel
    );
}