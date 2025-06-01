const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", owner.address);

    const RealEstateMarketplace = await ethers.getContractFactory("RealEstateMarketplace");
    const market = await RealEstateMarketplace.deploy(200);
    market.waitForDeployment();

    console.log("RealEstateMarketplace contract deployed to:", await market.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
