// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";


//I exist to hug and safe guard your tokens
contract MoonshotHolder is ERC1155Holder, AccessControl {
    IERC1155 public moonshot;

    constructor(address gameAddress, address gameAdmin) {
        _setupRole(DEFAULT_ADMIN_ROLE, gameAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, gameAdmin);
    }

    function setMoonshotInterface(IERC1155 moonshotInterface) external onlyRole(DEFAULT_ADMIN_ROLE){
        moonshot = moonshotInterface;
    }

    function setApprovalForTransfer(address operator, bool approved) external onlyRole(DEFAULT_ADMIN_ROLE){
        moonshot.setApprovalForAll(operator, approved);
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override
        (ERC1155Receiver, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}