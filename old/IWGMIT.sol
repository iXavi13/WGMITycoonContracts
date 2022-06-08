// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

interface IWGMITycoon is IERC1155Upgradeable {

    function mintTycoons(
        uint256[] memory ids, 
        uint256[] memory mintAmounts) 
        external ;

}