// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";


//I exist to allievate space from the game and safe guard your tokens
contract TycoonGame is ERC1155Holder, AccessControl {
    

    function setApprovalForTransfer() external {

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