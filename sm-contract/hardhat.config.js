require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Ensure that dotenv is required to load environment variables

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`, // Use process.env to access variables
      accounts: [`0x${process.env.SEPOLIA_PRIVATE_KEY}`], // Ensure the private key is prefixed with "0x"
    },
  },
};
