//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../IMoonz.sol";

contract TycoonAllowlistMarket is Ownable, ReentrancyGuard{
    bool public marketActive;
    IERC1155 public erc1155;
    IMoonz public moonz;

    struct Allowlist {
        string id;
        uint256 cost;
        uint256 quantity;
        uint256 quantityClaimed;
        uint256 startDate;
        uint256 expirationDate;
        uint256 auctionDecrease;
        uint256 blockNumber;
    }

    event AllowlistCreated(
        string indexed id,
        uint256 cost,
        uint256 quantity,
        uint256 quantityClaimed,
        uint256 startDate,
        uint256 expirationDate,
        uint256 auctionDecrease,
        uint256 blockNumber
    );

    event AllowlistClaimed(
        address indexed buyer,
        string id
    );

    // User => Allowlist => Allowlisted?
    mapping(address => mapping(string => bool)) public claimed;
    mapping(string => Allowlist) allowlists;

    modifier activeMarket() {
        require(marketActive, "Market paused");
        _;
    }

    function buyAllowlist(string memory id) external nonReentrant activeMarket {
        require(!claimed[msg.sender][id], "Already claimed");
        require(erc1155.balanceOf(msg.sender, 4) > 0, "Need access nft");
        require(allowlists[id].quantityClaimed < allowlists[id].quantity + 1, "Spots filled");
        
        moonz.burnFrom(msg.sender, allowlists[id].cost);

        emit AllowlistClaimed(msg.sender, id);
        allowlists[id].quantityClaimed += 1;
        claimed[msg.sender][id] = true;
    }

    function setAllowlist(
        string calldata id,
        uint256 cost,
        uint256 quantity,
        uint256 quantityClaimed,
        uint256 startDate,
        uint256 expirationDate,
        uint256 auctionDecrease
    ) external onlyOwner {
        require(quantity > 0, "Cant set 0 quantity");
        require(quantityClaimed < quantity + 1, "Claimed must be less than quantity");
        require(block.timestamp < expirationDate, "Invalid expiration");


        emit AllowlistCreated(id, cost, quantity, quantityClaimed, startDate, expirationDate, auctionDecrease, block.number);
        allowlists[id] = Allowlist(
            id,
            cost,
            quantity,
            quantityClaimed,
            startDate,
            expirationDate,
            auctionDecrease,
            block.number
        );
    }
}