const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.only("Moonshot game functionality", function () {
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
        await tokenContract.connect(owner).grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
        await tokenContract.connect(owner).grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), configContract.address);
        await gameContract.connect(owner).grantRole(await gameContract.GAME_ADMIN(), configContract.address);
        await moonzContract.connect(owner).grantRole(await moonzContract.MINTER_ROLE(), gameContract.address);

        await holderContract.connect(owner).setMoonshotInterface(tokenContract.address);
        await holderContract.connect(owner).setApprovalForTransfer(gameContract.address, true);
        await configContract.connect(owner).setInterfaces(moonzContract.address, tokenContract.address, holderContract.address);
        await tokenContract.connect(owner).setPaused(false);

        //ids - yields - cost - burn - supply
        await configContract.connect(owner)
            .configureBusiness(
                [1,2],
                [1000000000000000,5000000000000000],
                [1,5],
                [20000,20000]
            );
        //ids - levels - value - cost
        await configContract.connect(owner)
            .setMultiplierLevels(
                [1,1,1,2,2,2],
                [1,2,3,1,2,3],
                [1,2,3,1,2,3],
                [100,200,300,100,200,200]
            );
        await configContract.connect(owner)
            .setCapacityLevels(
                [1,1,1,2,2,2],
                [1,2,3,1,2,3],
                [500,2000,6000,500,2000,6000], 
                [100,200,300,100,200,300]);
        //ids- maxlevel
        await configContract.connect(owner).setCapAndMultiplierMaxLevels([1,2],[3,3],[3,3]);

        await moonzContract.connect(owner).mint(rosieAddress, "10000000000000000000000000000000000");
        await moonzContract.connect(rosie).approve(tokenContract.address, "9999999999999999999999999999999999999");
        await moonzContract.connect(rosie).approve(gameContract.address, "9999999999999999999999999999999999999");
        await gameContract.setYieldStart((Math.floor(Date.now()/1000)).toString());

        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        await tokenContract.connect(rosie).setApprovalForAll(gameContract.address, true);
        await tokenContract.connect(rosie).mintStarter(10, options);
        await gameContract.connect(rosie).stakeBusiness(1,10);
        await gameContract.connect(rosie).mintAndStake([2], [1]);
    });

    it("Claims moonz - cap", async function () {
        await configContract.connect(owner)
            .setCapacityLevels(
                [1,1,1,2,2,2],
                [1,2,3,1,2,3],
                [1,2000,6000,1,2000,6000], 
                [100,200,300,100,200,300]);
        const moonzBalance = await moonzContract.balanceOf(rosieAddress);
        const claim = await gameContract.connect(rosie).claim([1,2]);
        const moonzBalanceAfterClaim = await moonzContract.balanceOf(rosieAddress);
        
        const stakedAmount1 = Number(await gameContract.stakedTokens(rosieAddress,1));
        const stakedAmount2 = Number(await gameContract.stakedTokens(rosieAddress,2));
        const capacity1 = Number((await gameContract.capacity(1,1)).capacity);
        const capacity2 = Number((await gameContract.capacity(2,1)).capacity);
        const claimedAmount = (stakedAmount1 * capacity1) + (stakedAmount2 * capacity2);
        const total = (claimedAmount * 10**18) + Number(moonzBalance)


        expect(claim).to.be.not.undefined;
        expect(claim).to.be.not.null;
        expect(Number(moonzBalance)).to.be.lessThan(Number(moonzBalanceAfterClaim));
        expect(Number(moonzBalanceAfterClaim)).to.be.equal(total)
    });

    it("Claims moonz - non-cap", async function () {
        await configContract.connect(owner).setYields([1],[200000]);
        const moonzBalance = await moonzContract.balanceOf(rosieAddress);
        const claim = await gameContract.connect(rosie).claim([1]);
        const moonzBalanceAfterClaim = await moonzContract.balanceOf(rosieAddress);

        const stakedAmount = Number(await gameContract.stakedTokens(rosieAddress,1));
        const capacity = Number((await gameContract.capacity(1,1)).capacity);
        const claimedAmount = (stakedAmount * capacity);
        const totalCap = (claimedAmount * 10**18) + Number(moonzBalance)

        expect(claim).to.be.not.undefined;
        expect(claim).to.be.not.null;
        expect(Number(moonzBalance)).to.be.lessThan(Number(moonzBalanceAfterClaim));
        expect(Number(moonzBalanceAfterClaim)).to.be.lessThan(totalCap)
    });

    it("Increases capacity", async function () {
        const increase = await gameContract.connect(rosie).increaseCaps([1]);
        const capLevel = Number((await gameContract.business(rosieAddress,1)).capacityLevel);

        expect(increase).to.be.not.undefined;
        expect(increase).to.be.not.null;
        expect(capLevel).to.be.equal(2);
    });

    it("Increases multiplier", async function () {
        const increase = await gameContract.connect(rosie).increaseMultipliers([1]);
        const multiplierLevel = Number((await gameContract.business(rosieAddress,1)).multiplierLevel);

        expect(increase).to.be.not.undefined;
        expect(increase).to.be.not.null;
        expect(multiplierLevel).to.be.equal(2);
    });

    it("Increases caps and multipliers in one", async function () {
        const increase = await gameContract.connect(rosie).increaseCapsAndMultipliers([1,1], [1]);
        const capLevel = Number((await gameContract.business(rosieAddress,1)).capacityLevel);
        const multiplierLevel = Number((await gameContract.business(rosieAddress,1)).multiplierLevel);

        expect(increase).to.be.not.undefined;
        expect(increase).to.be.not.null;
        expect(multiplierLevel).to.be.equal(2);
        expect(capLevel).to.be.equal(3);
    });

    it("Returns more moonz with increased capacity", async function () {
        await gameContract.connect(rosie).claim([1]);
        let moonzBalance = await moonzContract.balanceOf(rosieAddress);
        let claim = await gameContract.connect(rosie).claim([1]);
        let moonzBalanceAfterClaim = await moonzContract.balanceOf(rosieAddress);
        const preIncreaseClaim = Number(moonzBalanceAfterClaim) - Number(moonzBalance)

        const increase = await gameContract.connect(rosie).increaseCaps([1]);

        moonzBalance = await moonzContract.balanceOf(rosieAddress);
        claim = await gameContract.connect(rosie).claim([1]);
        moonzBalanceAfterClaim = await moonzContract.balanceOf(rosieAddress);

        const postIncreaseClaim = Number(moonzBalanceAfterClaim) - Number(moonzBalance)

        expect(Number(preIncreaseClaim)).to.be.lessThan(Number(postIncreaseClaim));
        expect(increase).to.be.not.undefined;
        expect(increase).to.be.not.null;
    });

    it("Returns less moonz after unstaked", async function () {
        await gameContract.connect(rosie).claim([1]);
        let moonzBalance = await moonzContract.balanceOf(rosieAddress);
        let claim = await gameContract.connect(rosie).claim([1]);
        let moonzBalanceAfterClaim = await moonzContract.balanceOf(rosieAddress);
        const preIncreaseClaim = Number(moonzBalanceAfterClaim) - Number(moonzBalance)

        const increase = await gameContract.connect(rosie).unstakeBusiness(1,1);

        moonzBalance = await moonzContract.balanceOf(rosieAddress);
        claim = await gameContract.connect(rosie).claim([1]);
        moonzBalanceAfterClaim = await moonzContract.balanceOf(rosieAddress);

        const postIncreaseClaim = Number(moonzBalanceAfterClaim) - Number(moonzBalance)

        expect(Number(preIncreaseClaim)).to.be.greaterThan(Number(postIncreaseClaim));
        expect(increase).to.be.not.undefined;
        expect(increase).to.be.not.null;
    });

    it('Unstakes tokens to address', async function () {
        const preUnstake = await gameContract.stakedTokens(rosieAddress,1)
        const preTokenBalance = await tokenContract.balanceOf(rosieAddress,1);
        await gameContract.connect(rosie).unstakeBusiness(1,5)
        const postUnstake = await gameContract.stakedTokens(rosieAddress,1)
        const postTokenBalance = await tokenContract.balanceOf(rosieAddress,1);

        expect(postUnstake).to.be.equal(preUnstake - 5);
        expect(postTokenBalance).to.be.equal(preTokenBalance + 5);
    })

    it("Mints configured business", async function () {
      const mint = await gameContract.connect(rosie).mintAndStake([2], [1]);

      expect(mint).to.be.not.undefined;
      expect(mint).to.be.not.null;
    });

    it("Mints business with burn", async function () {
      const options = {
          value: ethers.utils.parseEther("0.1")
      };

      const mintStarter = await tokenContract.connect(rosie).mintStarter(10, options);
      const mintBalance = await tokenContract.balanceOf(rosieAddress, 1);
      await gameContract.connect(rosie).stakeBusiness(1,10);
      const mint = await gameContract.connect(rosie).mintAndStake([2], [1]);
      await gameContract.connect(rosie).unstakeBusiness(1,9)
      const mintBalanceAfterBurn = await tokenContract.balanceOf(rosieAddress, 1);

      expect(mintStarter).to.be.not.undefined;
      expect(mintStarter).to.be.not.null;
      expect(mint).to.be.not.undefined;
      expect(mint).to.be.not.null;
      expect(mintBalance).to.not.be.equal(mintBalanceAfterBurn)
    });
});

describe.only("Moonshot game failures", function () {
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
        await tokenContract.connect(owner).grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), gameContract.address);
        await tokenContract.connect(owner).grantRole(await tokenContract.DEFAULT_ADMIN_ROLE(), configContract.address);
        await gameContract.connect(owner).grantRole(await gameContract.GAME_ADMIN(), configContract.address);
        await moonzContract.connect(owner).grantRole(await moonzContract.MINTER_ROLE(), gameContract.address);

        await holderContract.connect(owner).setMoonshotInterface(tokenContract.address);
        await holderContract.connect(owner).setApprovalForTransfer(gameContract.address, true);
        await configContract.connect(owner).setInterfaces(moonzContract.address, tokenContract.address, holderContract.address);
        await tokenContract.connect(owner).setPaused(false);

        //ids - levels - value - cost
        await configContract.connect(owner)
            .setMultiplierLevels(
                [1,1,1,2,2,2],
                [1,2,3,1,2,3],
                [1,2,3,1,2,3],
                [100,200,300,100,200,200]
            );
        await configContract.connect(owner)
            .setCapacityLevels(
                [1,1,1,2,2,2],
                [1,2,3,1,2,3],
                [500,2000,6000,500,2000,6000], 
                [100,200,300,100,200,300]);
        //ids- maxlevel
        await configContract.connect(owner).setCapAndMultiplierMaxLevels([1,2],[3,3],[3,3]);

        // await moonzContract.connect(owner).mint(rosieAddress, "10000000000000000000000000000000000");
        // await moonzContract.connect(rosie).approve(tokenContract.address, "9999999999999999999999999999999999999");
        // await moonzContract.connect(rosie).approve(gameContract.address, "9999999999999999999999999999999999999");
        await gameContract.setYieldStart((Math.floor(Date.now()/1000)).toString());

        await tokenContract.connect(rosie).setApprovalForAll(gameContract.address, true);
    });

    it("Fails to mint business with no allowance", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        await configContract.connect(owner).configureBusiness([1],[1],[1],[20000]);
        await configContract.connect(owner).configureBusiness([2],[5],[5],[20000]);
        await moonzContract.connect(owner).mint(rosieAddress, "1000000000000000000000000000000");

        const mintStarter = await tokenContract.connect(rosie).mintStarter(10, options);
        await gameContract.connect(rosie).stakeBusiness(1,10);
        const mint = gameContract.connect(rosie).mintAndStake([2], [1]);

        expect(mintStarter).to.be.not.undefined;
        expect(mintStarter).to.be.not.null;
        await expect(mint).to.be.revertedWith("0: insufficient allowance");
    });

    it("Fails to mint business with no balance", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        await configContract.connect(owner).configureBusiness([1],[1],[1],[20000]);
        await configContract.connect(owner).configureBusiness([2],[5],[5],[20000]);
        await moonzContract.connect(owner).mint(rosieAddress, "1");
        await moonzContract.connect(rosie).approve(gameContract.address, "1000000000000000000000000000000");

        const mintStarter = await tokenContract.connect(rosie).mintStarter(10, options);
        await gameContract.connect(rosie).stakeBusiness(1,10);
        const mint = gameContract.connect(rosie).mintAndStake([2], [1]);

        expect(mintStarter).to.be.not.undefined;
        expect(mintStarter).to.be.not.null;
        await expect(mint).to.be.revertedWith("burn amount exceeds balance");
    });

    it("Fails to mint with max supply reached", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        await configContract.connect(owner).configureBusiness([1],[1],[1],[20000]);
        await configContract.connect(owner).configureBusiness([2],[5],[5],[1]);
        await moonzContract.connect(owner).mint(rosieAddress, "100000000000000000000000000000");
        await moonzContract.connect(rosie).approve(gameContract.address, "1000000000000000000000000000000");

        const mintStarter = await tokenContract.connect(rosie).mintStarter(10, options);
        await gameContract.connect(rosie).stakeBusiness(1,10);
        const mint = gameContract.connect(rosie).mintAndStake([2], [2]);

        expect(mintStarter).to.be.not.undefined;
        expect(mintStarter).to.be.not.null;
        await expect(mint).to.be.revertedWith("Max supply reached");
    });

    it("Fails to mint business with no yield set", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        await tokenContract.connect(owner).setBusinessMaxSupply([1,2],[10000,10000])
        await moonzContract.connect(owner).mint(rosieAddress, "1000000000000000000000000000000");
        await moonzContract.connect(rosie).approve(tokenContract.address, "1000000000000000000000000000000")
        const mintStarter = await tokenContract.connect(rosie).mintStarter(10, options);
        const staking = gameContract.connect(rosie).stakeBusiness(1,10);

        expect(mintStarter).to.be.not.undefined;
        expect(mintStarter).to.be.not.null;
        await expect(staking).to.be.revertedWith('Yield not set');
    });

    it("Fails to mint business with no config", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        await tokenContract.connect(owner).setBusinessMaxSupply([1,2],[10000,10000])
        await configContract.connect(owner).setYields([1,2],[200000,20000]);
        await moonzContract.connect(owner).mint(rosieAddress, "1000000000000000000000000000000");
        await moonzContract.connect(rosie).approve(tokenContract.address, "1000000000000000000000000000000")
        const mintStarter = await tokenContract.connect(rosie).mintStarter(10, options);
        await gameContract.connect(rosie).stakeBusiness(1,10);
        await tokenContract.connect(owner).mint(ownerAddress,2,1);
        const mint = gameContract.connect(rosie).mintAndStake([2], [1]);

        expect(mintStarter).to.be.not.undefined;
        expect(mintStarter).to.be.not.null;
        await expect(mint).to.be.revertedWith('Business not configured');
    });

})