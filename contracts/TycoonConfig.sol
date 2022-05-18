// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./ITycoonGame.sol";
import "./IWGMITConfig.sol";

contract TycoonConfig is AccessControl {
    bytes32 public constant GAME_ADMIN = keccak256("GAME_ADMIN");
    IWGMITycoonConfig public tycoonInterface;
    ITycoonGame public game;

    constructor(address admin, IWGMITycoonConfig tycoonInterface_, ITycoonGame game_) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(GAME_ADMIN, admin);
        tycoonInterface = tycoonInterface_;
        game = game_;
    }

    function setConfigInterfaces(
        IWGMITycoonConfig tycoonInterface_, 
        ITycoonGame game_
    ) external onlyRole(GAME_ADMIN){
        tycoonInterface = tycoonInterface_;
        game = game_;
    }

    function configureTycoon(
        uint256[] calldata ids, 
        uint256[] calldata yields_,
        uint256[] calldata tycoonCost_,
        uint256[] calldata tycoonBurnAmount_,
        uint256[] calldata tycoonSupply_
        ) external onlyRole(GAME_ADMIN) {
        require(
            ids.length == yields_.length 
            && ids.length == tycoonCost_.length 
            && ids.length == tycoonBurnAmount_.length 
            && ids.length == tycoonSupply_.length, 
            "Incorrect array lengths"
        );

        game.setTycoonCost(ids, tycoonBurnAmount_, tycoonCost_);
        game.setYields(ids,yields_);
        tycoonInterface.setTycoonMaxSupply(ids, tycoonSupply_);
    }

    function setInterfaces(IMoonz IMoonz_, IWGMITycoon IWGMITycoon_, IERC1155 holderInterface) external onlyRole(GAME_ADMIN) {
        game.setInterfaces(IMoonz_, IWGMITycoon_, holderInterface);
    }

    function setMultiplierLevels(
        uint256[] calldata ids, 
        uint256[] calldata levels,
        uint256[] calldata multiplier_,
        uint256[] calldata cost
    ) external onlyRole(GAME_ADMIN){
        require(
            ids.length == levels.length 
            && ids.length == multiplier_.length 
            && ids.length == cost.length, 
            "Incorrect array lengths"
        );
        game.setMultiplierLevels(ids, levels, multiplier_, cost);
    }

    function setCapacityLevels(
        uint256[] calldata ids, 
        uint256[] calldata levels,
        uint256[] calldata capacity_,
        uint256[] calldata cost
    ) external onlyRole(GAME_ADMIN) {
        require(
            ids.length == levels.length 
            && ids.length == capacity_.length 
            && ids.length == cost.length, 
            "Incorrect array lengths"
        );
        game.setCapacityLevels(ids, levels, capacity_, cost);
    }

    function setCapAndMultiplierMaxLevels(
        uint256[] calldata ids,
        uint256[] calldata capMaxLevel,
        uint256[] calldata multMaxLevel
    ) external onlyRole(GAME_ADMIN) {
        require(ids.length == capMaxLevel.length && ids.length == multMaxLevel.length, "Incorrect array lengths");

        game.setCapAndMultiplierMaxLevels(ids, capMaxLevel, multMaxLevel);
    }

    function setYields (
        uint256[] calldata ids, 
        uint256[] calldata yields_
    ) external onlyRole(GAME_ADMIN) {
        require(ids.length == yields_.length, "Incorrect array lengths");
        game.setYields(ids, yields_);
    }
}