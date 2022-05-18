// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ITycoon.sol";
import "./IMoonz.sol";
import "./IWGMIT.sol";

interface ITycoonGame {
    function stakeTycoon(uint256 id, uint256 amount) external;

    function setInterfaces(IMoonz IMoonz_, IWGMITycoon IWGMITycoon_) external;

    function setYields(uint256[] calldata ids, uint256[] calldata yieldRates) external;

    function setCapacityMaxLevels(
        uint256[] calldata ids,
        uint256[] calldata maxLevel_
    ) external;

    function setMultiplierMaxLevels(
        uint256[] calldata ids,
        uint256[] calldata maxLevel_
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
}