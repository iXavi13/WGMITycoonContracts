// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

interface IWGMITycoon is IERC1155Upgradeable {

    function mintTycoons(
        address to,
        uint256 id, 
        uint256 amount) 
        external ;
    
    function burn(
        address account,
        uint256 id,
        uint256 value
    ) external;

}