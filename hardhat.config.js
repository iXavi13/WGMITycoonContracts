require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require('hardhat-contract-sizer');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-abi-exporter');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const signature = (sourceName, contractName) => {
  if(contractName == IMoonz){
    return contractName + Math.floor(Math.random() * (100 - 1) + 1)
  }
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
        process.env.RINKEBY_PRIVATE_KEY !== undefined ? [process.env.RINKEBY_PRIVATE_KEY] : [],
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 80,
    coinmarketcap: 'c839bf6a-e78a-4fc5-9079-4f3d927389ca',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  abiExporter: {
    path: './data/abi',
    runOnCompile: true,
    clear: true,
    // only: [':ERC20$'],
    spacing: 2,
    pretty: true,
    // rename: signature
  }
};
