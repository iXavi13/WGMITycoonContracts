const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tycoon minting", function () {
    let gameContract;
    let moonzContract;
    let tycoonsContract;
    let configContract;
    let owner;
    let addr1;
    let rosie;
    let ownerAddress;
    let addr1Address;
    let rosieAddress;
  
    beforeEach(async () => {
      [owner, addr1, rosie] = await ethers.getSigners();
      ownerAddress = await owner.getAddress();
      addr1Address = await addr1.getAddress();
      rosieAddress = await rosie.getAddress();

      const Moonz = await ethers.getContractFactory("Moonz");
      const Game = await ethers.getContractFactory("TycoonGame");
      const Tycoons = await ethers.getContractFactory("WGMITycoons");
      const Config = await ethers.getContractFactory("TycoonConfig");

      moonzContract = await Moonz.deploy(ownerAddress);
      gameContract = await Game.deploy();
      tycoonsContract = await Tycoons.deploy("Tycoons", "WGMIT", "HAHA/1", ownerAddress, moonzContract.address);
      configContract = await Config.deploy(ownerAddress, tycoonsContract.address, gameContract.address);

      await gameContract.initialize(ownerAddress);
      await tycoonsContract.connect(owner).setPaused(false);
      await tycoonsContract.connect(owner).grantRole(await tycoonsContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
      await tycoonsContract.connect(owner).grantRole(await tycoonsContract.DEFAULT_ADMIN_ROLE(), configContract.address);
      await gameContract.connect(owner).grantRole(await gameContract.GAME_ADMIN(), configContract.address);
      await configContract.connect(owner).setInterfaces(moonzContract.address, tycoonsContract.address);

      await tycoonsContract.connect(owner).setPaused(false);
      await configContract.connect(owner).configureTycoon([1],[1],[1],[0],[20000]);
      await configContract.connect(owner).configureTycoon([2],[5],[5],[1],[20000]);
      await moonzContract.connect(owner).mint(rosieAddress, "1000000000000000000000000000000");
      await moonzContract.connect(rosie).approve(tycoonsContract.address, "1000000000000000000000000000000");
    });

    it("Mints degen", async function () {
      const options = {
          value: ethers.utils.parseEther("0.1")
      };

      const mint = await tycoonsContract.connect(rosie).mintDegen(10, options);

      expect(mint).to.be.not.undefined;
      expect(mint).to.be.not.null;
    });
})

describe("Tycoon minting failures", function () {
  let gameContract;
  let moonzContract;
  let tycoonsContract;
  let configContract;
  let owner;
  let addr1;
  let rosie;
  let ownerAddress;
  let addr1Address;
  let rosieAddress;

  beforeEach(async () => {
    [owner, addr1, rosie] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    addr1Address = await addr1.getAddress();
    rosieAddress = await rosie.getAddress();

    const Moonz = await ethers.getContractFactory("Moonz");
    const Game = await ethers.getContractFactory("TycoonGame");
    const Tycoons = await ethers.getContractFactory("WGMITycoons");
    const Config = await ethers.getContractFactory("TycoonConfig");

    moonzContract = await Moonz.deploy(ownerAddress);
    gameContract = await Game.deploy();
    tycoonsContract = await Tycoons.deploy("Tycoons", "WGMIT", "HAHA/1", ownerAddress, moonzContract.address);
    configContract = await Config.deploy(ownerAddress, tycoonsContract.address, gameContract.address);

    await gameContract.initialize(ownerAddress);
    await tycoonsContract.connect(owner).setPaused(false);
    await tycoonsContract.connect(owner).grantRole(await tycoonsContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
    await tycoonsContract.connect(owner).grantRole(await tycoonsContract.DEFAULT_ADMIN_ROLE(), configContract.address);
    await gameContract.connect(owner).grantRole(await gameContract.GAME_ADMIN(), configContract.address);
    await configContract.connect(owner).setInterfaces(moonzContract.address, tycoonsContract.address);
    await tycoonsContract.connect(owner).setPaused(false);
  });

  it("Fails to mint tycoon with no allowance", async function () {
    const options = {
        value: ethers.utils.parseEther("0.1")
    };

    await configContract.connect(owner).configureTycoon([1],[1],[1],[0],[20000]);
    await configContract.connect(owner).configureTycoon([2],[5],[5],[1],[20000]);
    await moonzContract.connect(owner).mint(rosieAddress, "1000000000000000000000000000000");

    const mintDegen = await tycoonsContract.connect(rosie).mintDegen(10, options);
    const mint = tycoonsContract.connect(rosie).mintTycoons([2], [1]);

    expect(mintDegen).to.be.not.undefined;
    expect(mintDegen).to.be.not.null;
    await expect(mint).to.be.revertedWith("0: insufficient allowance");
  });

  it("Fails to mint tycoon with no balance", async function () {
    const options = {
        value: ethers.utils.parseEther("0.1")
    };

    await configContract.connect(owner).configureTycoon([1],[1],[1],[0],[20000]);
    await configContract.connect(owner).configureTycoon([2],[5],[5],[1],[20000]);
    await moonzContract.connect(owner).mint(rosieAddress, "1");
    await moonzContract.connect(rosie).approve(tycoonsContract.address, "1000000000000000000000000000000");

    const mintDegen = await tycoonsContract.connect(rosie).mintDegen(10, options);
    const mint = tycoonsContract.connect(rosie).mintTycoons([2], [1]);

    expect(mintDegen).to.be.not.undefined;
    expect(mintDegen).to.be.not.null;
    await expect(mint).to.be.revertedWith("burn amount exceeds balance");
  });

  it("Fails to mint with insufficient tycoon burn", async function () {
    const options = {
        value: ethers.utils.parseEther("0.1")
    };

    await configContract.connect(owner).configureTycoon([1],[1],[1],[0],[20000]);
    await configContract.connect(owner).configureTycoon([2],[5],[5],[2],[20000]);
    await moonzContract.connect(owner).mint(rosieAddress, "1000000000000000000000000000000");
    await moonzContract.connect(rosie).approve(tycoonsContract.address, "1000000000000000000000000000000");

    const mintDegen = await tycoonsContract.connect(rosie).mintDegen(1, options);
    const mint = tycoonsContract.connect(rosie).mintTycoons([2], [1]);

    expect(mintDegen).to.be.not.undefined;
    expect(mintDegen).to.be.not.null;
    await expect(mint).to.be.revertedWith("Burn balance insufficient");
  });

  it("Fails to mint with max supply reached", async function () {
    const options = {
        value: ethers.utils.parseEther("0.1")
    };

    await configContract.connect(owner).configureTycoon([1],[1],[1],[0],[20000]);
    await configContract.connect(owner).configureTycoon([2],[5],[5],[1],[1]);
    await moonzContract.connect(owner).mint(rosieAddress, "1000000000000000000000000000000");
    await moonzContract.connect(rosie).approve(tycoonsContract.address, "1000000000000000000000000000000");

    const mintDegen = await tycoonsContract.connect(rosie).mintDegen(10, options);
    const mint = tycoonsContract.connect(rosie).mintTycoons([2], [2]);

    expect(mintDegen).to.be.not.undefined;
    expect(mintDegen).to.be.not.null;
    await expect(mint).to.be.revertedWith("Max supply reached");
  });

  it("Fails to mint tycoon with no configured", async function () {
    const options = {
        value: ethers.utils.parseEther("0.1")
    };

    await tycoonsContract.connect(owner).setTycoonMaxSupply([1,2],[10000,10000])
    await moonzContract.connect(owner).mint(rosieAddress, "1000000000000000000000000000000");
    const mintDegen = await tycoonsContract.connect(rosie).mintDegen(10, options);
    await moonzContract.connect(rosie).approve(tycoonsContract.address, "1000000000000000000000000000000")
    const mint = tycoonsContract.connect(rosie).mintTycoons([2], [1]);

    expect(mintDegen).to.be.not.undefined;
    expect(mintDegen).to.be.not.null;
    await expect(mint).to.be.revertedWith('Tycoon not configured');
  });

})