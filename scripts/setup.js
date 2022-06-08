// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const {hre, ethers, upgrades} = require("hardhat");

async function main() {
  await hre.run('compile');

  const [deployer] = await ethers.getSigners();

	console.log(
	"Setting up contracts with the account:",
	deployer.address
	);

	console.log("Account balance:", (await deployer.getBalance()).toString());

  const moonzAddress = "";
  const gameAddress = "";
  const tycoonsAddress = "";
  const configAddress = "";
  const holderAddress = "";

  const Moonz = await ethers.getContractFactory("Moonz");
  const Game = await ethers.getContractFactory("TycoonGame");
  const Tycoons = await ethers.getContractFactory("WGMITycoons");
  const Config = await ethers.getContractFactory("TycoonConfig");
  const Holder = await ethers.getContractFactory("TycoonHolder");

  const moonzContract = await Moonz.attach(moonzAddress);
  const gameContract = await Game.attach(gameAddress)
  const tycoonsContract = await Tycoons.attach(tycoonsAddress);
  const configContract = await Config.attach(configAddress);
  const holderContract = await Holder.attach(holderAddress);

  await gameContract.initialize(deployer.address);
  await tycoonsContract.grantRole(await tycoonsContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
  await tycoonsContract.grantRole(await tycoonsContract.DEFAULT_ADMIN_ROLE(), configContract.address);
  await gameContract.grantRole(await gameContract.GAME_ADMIN(), configContract.address);
  await moonzContract.grantRole(await moonzContract.MINTER_ROLE(), gameContract.address);

  await holderContract.setTycoonInterface(tycoonsContract.address);
  await holderContract.setApprovalForTransfer(gameContract.address, true);
  await configContract.setInterfaces(moonzContract.address, tycoonsContract.address, holderContract.address);
  await tycoonsContract.setPaused(false);

  //ids - yields - cost - burn - supply
  await configContract
      .configureTycoon(
          [1,2],
          [1000000000000000,5000000000000000],
          [1,5],
          [0,1],
          [20000,20000]
      );
  //ids - levels - value - cost
  await configContract
      .setMultiplierLevels(
          [1,1,1,2,2,2],
          [1,2,3,1,2,3],
          [1,2,3,1,2,3],
          [100,200,300,100,200,200]
      );
  await configContract
      .setCapacityLevels(
          [1,1,1,2,2,2],
          [1,2,3,1,2,3],
          [500,2000,6000,500,2000,6000], 
          [100,200,300,100,200,300]);
  //ids- maxlevel
  await configContract.setCapAndMultiplierMaxLevels([1,2],[3,3],[3,3]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
