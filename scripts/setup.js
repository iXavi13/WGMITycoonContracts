// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const {hre, ethers, upgrades} = require("hardhat");

async function main() {

  const [deployer] = await ethers.getSigners();

	console.log(
	"Setting up contracts with the account:",
	deployer.address
	);

	console.log("Account balance:", (await deployer.getBalance()).toString());

  const moonzAddress = "0x01f1fe4c61580417306918492b044795d1ef9333";
  const gameAddress = "0x8Fa1B720711Db4B15A979EFB11D257cB2b59F5ec";
  const tokenAddress = "0x99781f08E3E39B4972cE728F1a28831a69CA04ac";
  const configAddress = "0x1996dd93d91B7b0DCF5eFd5BB0f0dB804953d32F";
  const holderAddress = "0xE5529E6C2219218B7F866306d4fEf432A0a40545";

  const Moonz = await ethers.getContractFactory("Moonz");
  const Game = await ethers.getContractFactory("MoonshotGame");
  const Token = await ethers.getContractFactory("Moonshot");
  const Config = await ethers.getContractFactory("MoonshotConfig");
  const Holder = await ethers.getContractFactory("MoonshotHolder");

  const moonzContract = Moonz.attach(moonzAddress);
  const gameContract = Game.attach(gameAddress)
  const tokenContract = Token.attach(tokenAddress);
  const configContract = Config.attach(configAddress);
  const holderContract = Holder.attach(holderAddress);

  await gameContract.initialize(deployer.address);
  await tokenContract.grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
  await tokenContract.grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), configContract.address);
  await gameContract.grantRole(await gameContract.GAME_ADMIN(), configContract.address);
  await moonzContract.grantRole(await moonzContract.MINTER_ROLE(), gameContract.address);

  await holderContract.setMoonshotInterface(tokenContract.address);
  await holderContract.setApprovalForTransfer(gameContract.address, true);
  await configContract.setInterfaces(moonzContract.address, tokenContract.address, holderContract.address);
  await tokenContract.setPaused(false);

  //ids - levels - value - cost
  await configContract
      .setMultiplierLevels(
          [1,1,1,1,1,
            2,2,2,2,2,
              3,3,3,3,3,
                4,4,4,4,4,
                  5,5,5,5,5],
          [1,2,3,4,5,
            1,2,3,4,5,
              1,2,3,4,5,
                1,2,3,4,5,
                  1,2,3,4,5],
          [1,1.5,2.5,5,12,
            1,2,4,10,30,
              1,2,3.75,7.5,20,
                1,1.42,3.15,7.37,17.37,
                  1,1.625,3.75,8.75,25],
          [1800,3240,6600,18000,0,
            12000,30000,84000,300000,0,
              120000,336000,810000,2520000,0,
                912000,1620000,5040000,16800000,0,
                  5760000,10920000,28800000,84000000]
      );
  await configContract
      .setCapacityLevels(
        [1,1,1,1,1,
          2,2,2,2,2,
            3,3,3,3,3,
              4,4,4,4,4,
                5,5,5,5,5],
        [1,2,3,4,5,
          1,2,3,4,5,
            1,2,3,4,5,
              1,2,3,4,5,
                1,2,3,4,5],
          [1200,1800,3000,6000,14400,
            12000,36000,96000,300000,1800000,
              96000,288000,720000,1800000,9600000,
                456000,972000,2880000,8400000,39600000,
                  1920000,4680000,14400000,42000000,240000000], 
          [1440,2160,3600,7200,0,
            9000,18000,36000,90000,0,
              81600,163200,306000,612000,0,
                456000,648000,1440000,3360000,0,
                  1920000,4680000,14400000,42000000,0]);
  //ids- maxlevel
  await configContract.setCapAndMultiplierMaxLevels([1,2,3,4,5],[5,5,5,5,5],[5,5,5,5,5]);

  await gameContract.setYieldStart((Math.floor(Date.now()/1000)).toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
