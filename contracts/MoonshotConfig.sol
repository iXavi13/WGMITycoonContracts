// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./IMoonshotGame.sol";
import "./IMoonshotConfig.sol";

contract MoonshotConfig is AccessControl {
    bytes32 public constant GAME_ADMIN = keccak256("GAME_ADMIN");
    IMoonshotConfig public token;
    IMoonshotGame public game;

    constructor(address admin, IMoonshotConfig token_, IMoonshotGame game_) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(GAME_ADMIN, admin);
        token = token_;
        game = game_;
    }

    function setConfigInterfaces(
        IMoonshotConfig token_, 
        IMoonshotGame game_
    ) external onlyRole(GAME_ADMIN){
        token = token_;
        game = game_;
    }

    function configureBusiness(
        uint256[] calldata ids, 
        uint256[] calldata yields_,
        uint256[] calldata businessCost_,
        uint256[] calldata businessSupply_
        ) external onlyRole(GAME_ADMIN) {
        require(
            ids.length == yields_.length 
            && ids.length == businessCost_.length
            && ids.length == businessSupply_.length, 
            "Incorrect array lengths"
        );

        game.setBusinessCost(ids, businessCost_);
        game.setYields(ids,yields_);
        token.setBusinessMaxSupply(ids, businessSupply_);
    }

    function setInterfaces(IMoonz IMoonz_, IMoonshotToken IMoonshot_, IERC1155 holderInterface) external onlyRole(GAME_ADMIN) {
        game.setInterfaces(IMoonz_, IMoonshot_, holderInterface);
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