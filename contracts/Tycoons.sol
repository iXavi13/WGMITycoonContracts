// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "./IMoonz.sol";

contract WGMITycoons is ERC1155, ERC1155Supply, ERC1155Burnable, AccessControl {
    string public name_;
    string public symbol_; 
    string public metadataURI_;
    IMoonz public moonz;

    struct TycoonCost {
        uint128 burnAmount;
        uint128 moonzCost;
    }

    constructor( 
        string memory _name, 
        string memory _symbol, 
        string memory _uri,
        address admin,
        IMoonz _moonz
        ) 
        ERC1155(_uri) 
    {
        name_ = _name;
        symbol_ = _symbol;
        metadataURI_ = _uri;
        moonz = _moonz;
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    uint256 public TYCOON_PRICE = 0.00 ether; //Change to price
    uint256 public MAX_PAYABLE_SUPPLY = 10000;

    uint256 initialDegenSupply = 0;
    bool public paused = true;

    mapping(uint256 => TycoonCost) public tycoonCost;
    mapping(uint256 => uint256) public maxTycoonSupply;

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "No contracts");
        _;
    }

    modifier isNotPaused() {
        require(!paused, "Paused");
        _;
    }

    //Switch this to golden WGMI?
    function mintDegen(uint256 mintAmount) external payable callerIsUser() isNotPaused() {
        require(mintAmount > 0, "Incorrect mint amount");
        require(msg.value >= TYCOON_PRICE * mintAmount, "Incorrect ETH Amount");
        require(initialDegenSupply + mintAmount < MAX_PAYABLE_SUPPLY + 1, "Exceeded payable supply");

        initialDegenSupply += mintAmount;
        _mint(msg.sender, 1, mintAmount, "");
    }

    function mintTycoons(address to, uint id, uint amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(totalSupply(id) + amount < maxTycoonSupply[id] + 1, "Max supply reached");
        _mint(to, id, amount, "");
    }

    //VIEWS
    function uri(uint256 _id) public view override returns (string memory) {
        require(totalSupply(_id) > 0, "URI: nonexistent token");
        
        return string(abi.encodePacked(metadataURI_,Strings.toString(_id)));
    } 

    function name() public view returns (string memory) {
        return name_;
    }

    function symbol() public view returns (string memory) {
        return symbol_;
    }    

    //ADMIN FUNCTIONS
    function setPaused(bool paused_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = paused_;
    }

    function setTycoonCost(uint256[] calldata ids, uint256[] calldata burnAmount, uint256[] calldata moonzCost) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(ids.length == burnAmount.length && burnAmount.length == moonzCost.length, "Incorrect array lengths");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            tycoonCost[id] = TycoonCost(
                uint128(burnAmount[i]),
                uint128(moonzCost[i])
            );
        }
    }

    function setTycoonMaxSupply(uint256[] calldata ids, uint256[] calldata supply) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(ids.length == supply.length, "Incorrect array lengths");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            maxTycoonSupply[id] = supply[i];
        }
    }

    function mint(address account, uint256 id, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(account, id, amount, "");
    } 

    //Overrides
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    } 

    function setURI(string memory baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        metadataURI_ = baseURI;
        _setURI(baseURI);
    }    

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override
        (ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}