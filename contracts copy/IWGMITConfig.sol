// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

interface IWGMITycoonConfig is IERC1155Upgradeable {

    function setTycoonCost(
        uint256[] calldata ids, 
        uint256[] calldata burnAmount, 
        uint256[] calldata moonzCost
    ) external;

    function setTycoonMaxSupply(uint256[] calldata ids, uint256[] calldata supply) external;

}