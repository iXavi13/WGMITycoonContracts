const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Moonshot configuration", function () {
    let gameContract;
    let moonzContract;
    let tokenContract;
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
        const Game = await ethers.getContractFactory("MoonshotGame");
        const Moonshot = await ethers.getContractFactory("Moonshot");
        const Config = await ethers.getContractFactory("MoonshotConfig");
        const Holder = await ethers.getContractFactory("MoonshotHolder");

        moonzContract = await Moonz.deploy(ownerAddress);
        gameContract = await Game.deploy();
        tokenContract = await Moonshot.deploy("Moonshot", "MSHOT", "HAHA/1", ownerAddress, moonzContract.address);
        configContract = await Config.deploy(ownerAddress, tokenContract.address, gameContract.address);
        holderContract = await Holder.deploy(gameContract.address, ownerAddress);

        await gameContract.initialize(ownerAddress);
        await tokenContract.grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), configContract.address);
        await tokenContract.grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
        await gameContract.connect(owner).grantRole(await gameContract.GAME_ADMIN(), configContract.address);

        await configContract.connect(owner).setInterfaces(moonzContract.address, tokenContract.address, holderContract.address);
        await tokenContract.connect(owner).setPaused(false);
    });

    it("Configures business", async function () {
      const configuration = await configContract.connect(owner).configureBusiness([1],[1],[1],[20000]);
      const businessYield = await gameContract.yield(1);
      const businessCost = await tokenContract.businessCost(1);

      expect(configuration).to.be.not.undefined;
      expect(configuration).to.be.not.null;
      expect(businessYield).to.be.equal(ethers.BigNumber.from(1))
      expect(businessCost[1].toString()).to.be.equal('1')
    });
    
    it("Sets business cost", async function () {
        const configuration = await tokenContract.connect(owner).setBusinessCost([1],[0],[1]);
  
        expect(configuration).to.be.not.undefined;
        expect(configuration).to.be.not.null;
    });

    it("Sets business supply", async function () {
        const configuration = await tokenContract.connect(owner).setBusinessMaxSupply([1],[20000]);
        const supply = await tokenContract.maxBusinessSupply(1)

        expect(configuration).to.be.not.undefined;
        expect(configuration).to.be.not.null;
        expect(supply.toString()).to.be.equal('20000');
    });

    it("Configures multipliers", async function () {
        const configuration = await configContract.connect(owner).configureBusiness([1],[1],[1],[20000]);
        const multipliers = await configContract.connect(owner).setMultiplierLevels([1],[1],[1],[0]);
        const multiplierMax = await configContract.connect(owner).setMultiplierMaxLevels([1],[4]);
        const multiplierMaxLevel = await gameContract.maxLevel(1)

        expect(configuration).to.be.not.undefined;
        expect(configuration).to.be.not.null;
        expect(multipliers).to.be.not.undefined;
        expect(multipliers).to.be.not.null;
        expect(multiplierMax).to.be.not.undefined;
        expect(multiplierMax).to.be.not.null;
        expect(multiplierMaxLevel.multiplier.toString()).to.be.equal('4');
    });

    it("Configures capacities", async function () {
        const configuration = await configContract.connect(owner).configureBusiness([1],[1],[1],[20000]);
        const capacitys = await configContract.connect(owner).setCapacityLevels([1],[1],[20],[5]);
        const capacityMax = await configContract.connect(owner).setCapAndMultiplierMaxLevels([1,2],[4,3],[4,3])
        const capacityMaxLevel = await gameContract.maxLevel(1);
        const capacity = await gameContract.capacity(1,1);

        expect(configuration).to.be.not.null;
        expect(capacitys).to.be.not.null;
        expect(capacityMax).to.be.not.null;
        expect(capacity.capacity.toString()).to.be.equal('20');
        expect(capacity.cost.toString()).to.be.equal('5');
        expect(capacityMaxLevel.capacity.toString()).to.be.equal('4');
    });
})

describe("Business configuration failures", function () {
    let gameContract;
    let moonzContract;
    let tokenContract;
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
        const Game = await ethers.getContractFactory("MoonshotGame");
        const Moonshot = await ethers.getContractFactory("Moonshot");
        const Config = await ethers.getContractFactory("MoonshotConfig");
        const Holder = await ethers.getContractFactory("MoonshotHolder");

        moonzContract = await Moonz.deploy(ownerAddress);
        gameContract = await Game.deploy();
        tokenContract = await Moonshot.deploy("Moonshot", "MSHOT", "HAHA/1", ownerAddress, moonzContract.address);
        configContract = await Config.deploy(ownerAddress, tokenContract.address, gameContract.address);
        holderContract = await Holder.deploy(gameContract.address, ownerAddress);

        await gameContract.initialize(ownerAddress);
        await tokenContract.grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), configContract.address);
        await tokenContract.grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
        await gameContract.connect(owner).grantRole(await gameContract.GAME_ADMIN(), configContract.address);

        await configContract.connect(owner).setInterfaces(moonzContract.address, tokenContract.address, holderContract.address);
        await tokenContract.connect(owner).setPaused(false);
    });

    it("Fails to configure business", async function () {
        const configuration = configContract.connect(owner).configureBusiness([1],[1],[1,0],[20000]);
  
        await expect(configuration).to.be.revertedWith("Incorrect array lengths");
    });

    it("Fails to set business cost by setup", async function () {
        const configuration = tokenContract.connect(owner).setBusinessCost([1],[0,2],[1]);

        await expect(configuration).to.be.revertedWith("Incorrect array lengths");
    });
      
    it("Fails to set business cost by overflow", async function () {
        const configuration = tokenContract.connect(owner).setBusinessCost([1],[0],[-1]);

        await expect(configuration).to.be.reverted;
    });

    it("Fails to set business supply", async function () {
        const configuration = tokenContract.connect(owner).setBusinessMaxSupply([1],[-1]);

        await expect(configuration).to.be.reverted;
    });

    it("Fails to configure multipliers", async function () {
        const configuration = await configContract.connect(owner).configureBusiness([1],[1],[1],[20000]);
        const multipliers = configContract.connect(owner).setMultiplierLevels([1],[1,2],[1],[0]);
        const multiplierMax = configContract.connect(owner).setMultiplierMaxLevels([1,2],[4]);

        expect(configuration).to.be.not.undefined;
        expect(configuration).to.be.not.null;
        await expect(multipliers).to.be.revertedWith('Incorrect array lengths')
        await expect(multiplierMax).to.be.revertedWith("Incorrect array lengths");
    });

    it("Fails to configure capacities", async function () {
        const configuration = await configContract.connect(owner).configureBusiness([1],[1],[1],[20000]);
        const capacitys = configContract.connect(owner).setCapacityLevels([1],[1,2],[5],[20]);
        const capacityMax = configContract.connect(owner).setCapacityMaxLevels([1,2],[4]);

        expect(configuration).to.be.not.undefined;
        expect(configuration).to.be.not.null;
        await expect(capacitys).to.be.revertedWith('Incorrect array lengths')
        await expect(capacityMax).to.be.revertedWith("Incorrect array lengths");
    });
})