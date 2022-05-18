// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ITycoon.sol";
import "./IMoonz.sol";
import "./IWGMIT.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface ITycoonGame {
    function stakeTycoon(uint256 id, uint256 amount) external;

    function setInterfaces(
        IMoonz IMoonz_, 
        IWGMITycoon IWGMITycoon_, 
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

    function setTycoonCost(
        uint256[] calldata ids, 
        uint256[] calldata burnAmount, 
        uint256[] calldata moonzCost
    ) external;
}