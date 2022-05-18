// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";


//I exist to hug and safe guard your tokens
contract TycoonHolder is ERC1155Holder, AccessControl {
    IERC1155 public tycoons;

    constructor(address gameAddress, address gameAdmin) {
        _setupRole(DEFAULT_ADMIN_ROLE, gameAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, gameAdmin);
    }

    function setTycoonInterface(IERC1155 tycoonInterface) external onlyRole(DEFAULT_ADMIN_ROLE){
        tycoons = tycoonInterface;
    }

    function setApprovalForTransfer(address operator, bool approved) external onlyRole(DEFAULT_ADMIN_ROLE){
        tycoons.setApprovalForAll(operator, approved);
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