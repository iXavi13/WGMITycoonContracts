// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const {hre, ethers, upgrades} = require("hardhat");

async function main() {
    // await hre.run('compile');

    const [deployer] = await ethers.getSigners();

    console.log(
    "Deploying contracts with the account:",
    deployer.address
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());


    const gameAddress = "0x8Fa1B720711Db4B15A979EFB11D257cB2b59F5ec";
    const Game = await ethers.getContractFactory("MoonshotGame");

    gameContract = await upgrades.upgradeProxy(gameAddress, Game) //Game.deploy();

    console.log(gameContract)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
