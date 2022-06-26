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

  //SET FOR
  // const moonzAddress = "0x01f1fe4c61580417306918492b044795d1ef9333";
  // const gameAddress = "0x8Fa1B720711Db4B15A979EFB11D257cB2b59F5ec";
  // const tokenAddress = "0x99781f08E3E39B4972cE728F1a28831a69CA04ac";
  // const configAddress = "0x1996dd93d91B7b0DCF5eFd5BB0f0dB804953d32F";
  // const holderAddress = "0xE5529E6C2219218B7F866306d4fEf432A0a40545";
  if(false) {
    await gameContract.initialize(deployer.address);
    let grant = await tokenContract.grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
    await grant.wait();
    grant = await tokenContract.grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), configContract.address);
    await grant.wait();
    grant = await gameContract.grantRole(await gameContract.GAME_ADMIN(), configContract.address);
    await grant.wait();
    grant = await moonzContract.grantRole(await moonzContract.MINTER_ROLE(), gameContract.address);
    await grant.wait()
  

    let tx = await holderContract.setMoonshotInterface(tokenContract.address);
    await tx.wait()
    tx = await holderContract.setApprovalForTransfer(gameContract.address, true);
    await tx.wait()
    tx = await configContract.setInterfaces(moonzContract.address, tokenContract.address, holderContract.address);
    await tx.wait()
    tx = await tokenContract.setPaused(false);
    await tx.wait()
  }

  //ids - levels - value - cost
  if(false) {
    let config = await configContract
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
            [1000,1500,2500,5000,12000,
              1000,2000,4000,10000,30000,
                1000,2000,3750,7500,20000,
                  1000,1420,3150,7370,17370,
                    1000,1625,3750,8750,2500],
            [18,32,66,180,0,
              120,300,840,3000,0,
                1200,3360,8100,25200,0,
                  9120,16200,50400,168000,0,
                    57600,109200,288000,840000,0],{
                      gasLimit: 3000000
                    }
        );
      await config.wait();  
  
      config = await configContract
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
            [12,18,30,60,144,
              120,360,960,3000,18000,
                960,2880,7200,18000,96000,
                  4560,9720,28800,84000,396000,
                    19200,46800,144000,420000,2400000], 
            [14,22,36,72,0,
              90,180,360,900,0,
                816,1632,3060,6120,0,
                  4560,6480,14400,33600,0,
                    19200,46800,144000,420000,0],{
                      gasLimit: 3000000
                    });
                    await config.wait();
    //ids- maxlevel
    config = await configContract.setCapAndMultiplierMaxLevels([1,2,3,4,5],[5,5,5,5,5],[5,5,5,5,5],{
      gasLimit: 3000000
    });
    await config.wait();
  
    config = await gameContract.setYieldStart((Math.floor(Date.now()/1000)).toString());
    await config.wait();

  let yield = await configContract.setYields([1,2,3,4,5],[12,60,480,2280,9600])
  await yield.wait();
  }

  let business = await configContract.configureBusiness(
    [1,2,3,4,5], 
    [12,60,480,2280,9600],
    [0,8000,75000,650000,3500000],
    [10000,10000,10000,10000,10000],{
      gasLimit: 3000000
    })

  await business.wait();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
