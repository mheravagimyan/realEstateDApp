require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {
    },
    sepolia: {
      accounts: [process.env.OWNER_KEY],
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_URL}`
    },
  },
  etherscan: {
    apiKey: process.env.ETH_API,
  }
};
