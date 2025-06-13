// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "interfaces/IUniswapV2Router02.sol";

/// @title Decentralized Real Estate Marketplace (ETH-only)
/// @notice Users register properties by hash, list for sale, and trade using only ETH
contract RealEstateMarketplace is Ownable(msg.sender), ReentrancyGuard {
    struct Listing {
        uint256 price;    // price in wei
        bool forSale;     // is this property listed
    }

    /// @dev property hash => owner address
    mapping(bytes32 => address) public propertyOwner;
    /// @dev owner => list of property hashes
    mapping(address => bytes32[]) public ownerProperties;
    /// @dev property hash => listing data
    mapping(bytes32 => Listing) public listings;

    /// @notice Platform fee in basis points (e.g. 250 = 2.5%)
    uint16 public feeBps;

    event FeeBpsUpdated(uint16 newFeeBps);
    event PropertyRegistered(bytes32 indexed propHash, address indexed owner);
    event PropertyListed(bytes32 indexed propHash, uint256 price);
    event PropertySold(bytes32 indexed propHash, address indexed buyer, uint256 amountPaid);
    event FeesWithdrawn(uint256 amount);
    event PropertyCanceled(bytes32 indexed propHash);

    constructor(uint16 _feeBps) {
        require(_feeBps <= 250, "Marketplace: fee too high");
        feeBps = _feeBps;
    }

    function cancelListing(bytes32 propHash) external {
        require(propertyOwner[propHash] == msg.sender, "Marketplace: not owner");
        Listing storage lst = listings[propHash];
        require(lst.forSale, "Marketplace: not listed");
        lst.forSale = false;
        emit PropertyCanceled(propHash);
    }

    /// @notice List (or relist) a property for sale, registering it if new
    function listProperty(bytes32 propHash, uint256 price) external {
        require(price > 0, "Marketplace: price must be > 0");

        // Регистрируем, если лот ещё не создан
        if (propertyOwner[propHash] == address(0)) {
            require(propHash != bytes32(0), "Marketplace: invalid hash");
            propertyOwner[propHash] = msg.sender;
            ownerProperties[msg.sender].push(propHash);
            emit PropertyRegistered(propHash, msg.sender);
        } else {
            require(propertyOwner[propHash] == msg.sender, "Marketplace: not owner");
        }

        // Ставим лот на продажу или обновляем цену при релисте
        listings[propHash] = Listing({ price: price, forSale: true });
        emit PropertyListed(propHash, price);
    }


    /// @notice Buy a listed property using ETH
    function buyProperty(bytes32 propHash) external payable nonReentrant {
        Listing storage lst = listings[propHash];
        require(lst.forSale, "Marketplace: not for sale");
        uint256 amount = lst.price;
        require(msg.value >= amount, "Marketplace: incorrect ETH amount");

        // compute fee and seller proceeds
        uint256 fee = (amount * feeBps) / 10000;
        uint256 proceeds = amount - fee;
        address seller = propertyOwner[propHash];
        require(seller != msg.sender, "Marketplace: buyer is seller");

        // transfer proceeds to seller
        (bool success, ) = payable(seller).call{value: proceeds}("");
        require(success, "Marketplace: Faild");
        // mark sold
        lst.forSale = false;
        propertyOwner[propHash] = msg.sender;
        ownerProperties[msg.sender].push(propHash);
        for(uint i; i < ownerProperties[seller].length; ++i) {
            if(propHash == ownerProperties[seller][i]){
                ownerProperties[seller][i] = ownerProperties[seller][ownerProperties[seller].length - 1];
                ownerProperties[seller].pop();
            }
        }

        emit PropertySold(propHash, msg.sender, amount);
    }

    /// @notice Update platform fee
    function setFeeBps(uint16 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 250, "Marketplace: fee too high");
        feeBps = _newFeeBps;
        emit FeeBpsUpdated(_newFeeBps);
    }

    /// @notice Withdraw accumulated ETH fees
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        require(amount > 0, "Marketplace: no ETH fees");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Marketplace: Faild withdraw");
        emit FeesWithdrawn(amount);
    }

    /// @notice Get all properties owned by an address
    function getOwnerProperties(address owner) external view returns (bytes32[] memory) {
        return ownerProperties[owner];
    }
}
