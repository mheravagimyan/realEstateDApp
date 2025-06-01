// test/RealEstateMarketplace.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { FaMapMarked } = require("react-icons/fa");

describe("RealEstateMarketplace (ETH-only)", function () {
  let Marketplace;
  let marketplace;
  let owner;
  let seller;
  let buyer;
  let other;
  let feeBpsInitial = ethers.toBigInt(100); // 1%

  // Utility to create a pseudo‐unique propHash
  function makeHash(location, area) {
    return ethers.solidityPackedKeccak256(
      ["string", "uint256"],
      [location, area]
    );
  }

  beforeEach(async function () {
    [owner, seller, buyer, other] = await ethers.getSigners();
    Marketplace = await ethers.getContractFactory("RealEstateMarketplace", owner);
    marketplace = await Marketplace.deploy(feeBpsInitial);
    marketplace.waitForDeployment();
  });

  describe("Deployment & initial state", function () {
    it("should set initial feeBps correctly", async function () {
      expect(await marketplace.feeBps()).to.equal(feeBpsInitial);
    });

    it("owner can update feeBps to a valid value", async function () {
      await expect(marketplace.connect(owner).setFeeBps(250)) // 2.5%
        .to.emit(marketplace, "FeeBpsUpdated")
        .withArgs(250);

      expect(await marketplace.feeBps()).to.equal(250);
    });

    it("non-owner cannot update feeBps", async function () {
      await expect(marketplace.connect(seller).setFeeBps(50))
        .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("cannot set feeBps > 250", async function () {
      await expect(marketplace.connect(owner).setFeeBps(300))
        .to.be.revertedWith("Marketplace: fee too high");
    });

    it("withdrawFees should revert when no fees collected", async function () {
      await expect(marketplace.connect(owner).withdrawFees())
        .to.be.revertedWith("Marketplace: no ETH fees");
    });
  });

  describe("Listing properties", function () {
    let propHash, priceWei;

    beforeEach(async function () {
      propHash = makeHash("Property1", ethers.parseEther("12"));
      priceWei = ethers.parseEther("1.0"); // 1 ETH
    });

    it("seller can list a property for sale", async function () {
      await expect(
        marketplace.connect(seller).listProperty(propHash, priceWei)
      )
        .to.emit(marketplace, "PropertyRegistered")
        .withArgs(propHash, seller.address)
        .and.to.emit(marketplace, "PropertyListed")
        .withArgs(propHash, priceWei);

      expect(await marketplace.propertyOwner(propHash)).to.equal(seller.address);

      const listing = await marketplace.listings(propHash);
      expect(listing.price).to.equal(priceWei);
      expect(listing.forSale).to.be.true;

      const ownerProps = await marketplace.getOwnerProperties(seller.address);
      expect(ownerProps).to.deep.equal([propHash]);
    });

    it("listing with price = 0 should revert", async function () {
      await expect(
        marketplace.connect(seller).listProperty(propHash, 0)
      ).to.be.revertedWith("Marketplace: price must be > 0");
    });

    it("listing the same property hash twice should revert", async function () {
      await marketplace.connect(seller).listProperty(propHash, priceWei);
      // Second attempt reuses same propHash should revert on already registered check
      await expect(
        marketplace.connect(seller).listProperty(propHash, priceWei)
      ).to.be.revertedWith("Marketplace: already registered");
    });
  });

  describe("Buying properties", function () {
    let propHash, priceWei;
    const oneEther = ethers.parseEther("1.0");

    beforeEach(async function () {
      propHash = makeHash("Property2", ethers.parseEther("12"));
      priceWei = ethers.parseEther("2.0"); // 2 ETH
      await marketplace.connect(seller).listProperty(propHash, priceWei);
    });

    it("buyer can purchase listed property and owner updates correctly", async function () {
      // Balances before
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const contractBalanceBefore = await ethers.provider.getBalance(await marketplace.getAddress());

      // Buyer purchases; include some extra ETH to test msg.value >= price
      const tx = await marketplace.connect(buyer).buyProperty(propHash, {
        value: priceWei,
      });
      const receipt = await tx.wait();
      const gasUsed = ethers.toBigInt(receipt.gasUsed) * ethers.toBigInt(receipt.gasPrice);

      // Fee = price * feeBps / 10000 = 2 ETH * 1% = 0.02 ETH
      const fee = priceWei * (feeBpsInitial) / ethers.toBigInt(10000);
      const proceeds = priceWei - (fee);

      // Seller balance increased by proceeds
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - (sellerBalanceBefore)).to.equal(proceeds);

      // Contract balance increased by fee
      const contractBalanceAfter = await ethers.provider.getBalance(await marketplace.getAddress());
      expect(contractBalanceAfter - (contractBalanceBefore)).to.equal(fee);

      // Verify event
      await expect(tx)
        .to.emit(marketplace, "PropertySold")
        .withArgs(propHash, buyer.address, priceWei);

      // Listing forSale should now be false
      const listing = await marketplace.listings(propHash);
      expect(listing.forSale).to.be.false;

      // propertyOwner updated to buyer
      expect(await marketplace.propertyOwner(propHash)).to.equal(buyer.address);

      // ownerProperties: seller no longer has propHash, buyer now has it
      const sellerProps = await marketplace.getOwnerProperties(seller.address);
      expect(sellerProps).to.not.include(propHash);

      const buyerProps = await marketplace.getOwnerProperties(buyer.address);
      expect(buyerProps).to.deep.equal([propHash]);
    });

    it("cannot buy if property not for sale", async function () {
      // First buy to mark sold
      await marketplace.connect(buyer).buyProperty(propHash, { value: priceWei });

      // Second attempt should revert
      await expect(
        marketplace.connect(other).buyProperty(propHash, { value: priceWei })
      ).to.be.revertedWith("Marketplace: not for sale");
    });

    it("cannot buy with insufficient ETH", async function () {
      await expect(
        marketplace.connect(buyer).buyProperty(propHash, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Marketplace: incorrect ETH amount");
    });

    it("seller cannot buy their own property", async function () {
      await expect(
        marketplace.connect(seller).buyProperty(propHash, { value: priceWei })
      ).to.be.revertedWith("Marketplace: buyer is seller");
    });
  });

  describe("Fee withdrawal", function () {
    let propHash, priceWei;
    const oneEther = ethers.parseEther("1.0");

    beforeEach(async function () {
      propHash = makeHash("Property3", ethers.parseEther("12"));
      priceWei = ethers.parseEther("3.0"); // 3 ETH
      await marketplace.connect(seller).listProperty(propHash, priceWei);
      // Buyer purchases property to generate fees
      await marketplace.connect(buyer).buyProperty(propHash, { value: priceWei });
    });

    it("owner can withdraw fees", async function () {
      const contractFeeBalance = await ethers.provider.getBalance(await marketplace.getAddress());
      expect(contractFeeBalance).to.be.gt(0);

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await marketplace.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = ethers.toBigInt(receipt.gasUsed) * (ethers.toBigInt(receipt.gasPrice));

      // Contract balance should be zero
      expect(await ethers.provider.getBalance(await marketplace.getAddress())).to.equal(0);

      // Owner balance increases by fee minus gas
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      // Because gas cost is incurred, we check that change >= contractFeeBalance - gasUsed
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + (contractFeeBalance) - (gasUsed));
    });

    it("non-owner cannot withdraw fees", async function () {
      await expect(
        marketplace.connect(buyer).withdrawFees()
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("withdrawFees reverts when no fees remain", async function () {
      // First withdrawal
      await marketplace.connect(owner).withdrawFees();
      // Second withdrawal should revert
      await expect(
        marketplace.connect(owner).withdrawFees()
      ).to.be.revertedWith("Marketplace: no ETH fees");
    });
  });
});
