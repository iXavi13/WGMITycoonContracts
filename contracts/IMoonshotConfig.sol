// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IMoonshotConfig is IERC1155 {
    function setBusinessMaxSupply(uint256[] calldata ids, uint256[] calldata supply) external;
}