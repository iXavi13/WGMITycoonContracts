// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IMoonshot.sol";
import "./IMoonz.sol";
import "./IMoonshotToken.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IMoonshotGame {
    function stakeBusiness(uint256 id, uint256 amount) external;

    function setInterfaces(
        IMoonz IMoonz_, 
        IMoonshotToken IMoonshot_, 
        IERC1155 holderInterface
    ) external;

    function setYields(uint256[] calldata ids, uint256[] calldata yieldRates) external;

    function setCapAndMultiplierMaxLevels(
        uint256[] calldata ids,
        uint256[] calldata capMaxLevel,
        uint256[] calldata multMaxLevel
    ) external;

    function setCapacityLevels(
        uint256[] calldata ids, 
        uint256[] calldata levels,
        uint256[] calldata capacity_,
        uint256[] calldata cost
    ) external;

    function setMultiplierLevels(
        uint256[] calldata ids, 
        uint256[] calldata levels,
        uint256[] calldata multiplier_,
        uint256[] calldata cost
    ) external;

    function setBusinessCost(
        uint256[] calldata ids,
        uint256[] calldata moonzCost
    ) external;
}