// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IMoonzBase.sol";

contract Moonz is IMoonz, ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address admin) ERC20("MOONZ", "MNZ") {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
    }

    function mint(address to, uint256 amount) public override(IMoonz) onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) public override(ERC20Burnable, IMoonz) {
        super.burn(amount);
    }

    function burnFrom(address operator, uint256 amount) public override(ERC20Burnable, IMoonz) {
        super.burnFrom(operator, amount);
    }
}