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

//   Moonz deploy at 0x01f1fe4c61580417306918492b044795d1ef9333
// Game deploy at 0x664803c792E4DCbf9970Db9Bccd083BB443065cF
// Tycoons deploy at 0xE9882A3FF8a38a4eaee68B1F6BC792EF4998bf54    
// Config deploy at 0x60e678A4804C5740D7606e9d9e95af3C48A78b5f     
// Holder deploy at 0x3f17dec4D1fFA2890CB4dDA22880b6132B9Ebf5b

  const moonzAddress = "0x01f1fe4c61580417306918492b044795d1ef9333";
  const gameAddress = "0x664803c792E4DCbf9970Db9Bccd083BB443065cF";
  const tycoonsAddress = "0xE9882A3FF8a38a4eaee68B1F6BC792EF4998bf54";
  const configAddress = "0x60e678A4804C5740D7606e9d9e95af3C48A78b5f";
  const holderAddress = "0x3f17dec4D1fFA2890CB4dDA22880b6132B9Ebf5b";

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
