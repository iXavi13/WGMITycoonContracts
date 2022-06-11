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


  const Moonz = await ethers.getContractFactory("Moonz");
  const Game = await ethers.getContractFactory("TycoonGame");
  const Tycoons = await ethers.getContractFactory("WGMITycoons");
  const Config = await ethers.getContractFactory("TycoonConfig");
  const Holder = await ethers.getContractFactory("TycoonHolder");

  gameContract = await upgrades.deployProxy(Game, [deployer.address]) //Game.deploy();
  moonzContract = await Moonz.deploy(deployer.address);
  tycoonsContract = await Tycoons.deploy("Tycoons", "WGMIT", "HAHA/1", deployer.address, moonzContract.address);
  configContract = await Config.deploy(deployer.address, tycoonsContract.address, gameContract.address);
  holderContract = await Holder.deploy(gameContract.address, deployer.address);

  console.log("%s deploy at %s","Moonz",moonzContract.address)
  console.log("%s deploy at %s","Game",gameContract.address)
  console.log("%s deploy at %s","Tycoons",tycoonsContract.address)
  console.log("%s deploy at %s","Config",configContract.address)
  console.log("%s deploy at %s","Holder",holderContract.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
