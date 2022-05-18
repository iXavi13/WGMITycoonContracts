const { expect } = require("chai");
const { ethers } = require("hardhat");

// ===================== UTIL FUNCTIONS ========================

describe("LegendX setters, getters and utils", function () {
    let contract;
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
      const LegendX = await ethers.getContractFactory("LegendX");
      contract = await LegendX.deploy();
    });

    it("Sets baseuri", async function () {
        const options = {
            value: ethers.utils.parseEther("1.0")
        };

        await contract.connect(owner).setPublicSaleTime(1644113480, 2644113480);
        await contract.connect(owner).setPaused(false);
        await contract.publicSaleMint(1, options);
        const uri = await contract.connect(owner).setBaseURI("some string/");
        const tokenUri = await contract.tokenURI(1);

        expect(uri).to.be.not.undefined;
        expect(uri).to.be.not.null;
        expect(tokenUri).to.be.equal("some string/1")
    });

    it("Sets max supply", async function () {
        await contract.connect(owner).setMaxSupply(10, 5);
        const config = await contract.saleConfig()

        expect(config.collectionSize).to.be.equal(10)
        expect(config.claimSize).to.be.equal(5)
    });

    it("Sets allowlist time", async function () {
        await contract.connect(owner).setAllowlistSaleTime(1644113480,1644113480);
        const config = await contract.saleConfig()

        expect(config.allowlistStartTime).to.be.equal(1644113480)
        expect(config.allowlistEndTime).to.be.equal(1644113480)
    });

    it("Sets claimlist time", async function () {
        await contract.connect(owner).setClaimlistSaleTime(1644113480,1644113480);
        const config = await contract.saleConfig()

        expect(config.claimlistStartTime).to.be.equal(1644113480)
        expect(config.claimlistEndTime).to.be.equal(1644113480)
    });

    it("Sets public time", async function () {
        await contract.connect(owner).setPublicSaleTime(1644113480, 1644113480);
        const config = await contract.saleConfig()

        expect(config.publicStartTime).to.be.equal(1644113480)
        expect(config.publicEndTime).to.be.equal(1644113480)
    });

    it("Sets allowlist merkle root", async function () {
        await contract.connect(owner).setAllowlistMerkleRoot("0x0b6e25a995ad97c378eb717afb66025c9b97b8b64727cc38277af800b89efc67");
        const merkleRoot = await contract.allowlistMerkleRoot()

        expect(merkleRoot).to.be.equal("0x0b6e25a995ad97c378eb717afb66025c9b97b8b64727cc38277af800b89efc67")
    });

    it("Sets claimlist merkle root", async function () {
        await contract.connect(owner).setClaimlistMerkleRoot("0x0b6e25a995ad97c378eb717afb66025c9b97b8b64727cc38277af800b89efc67");
        const merkleRoot = await contract.claimlistMerkleRoot()

        expect(merkleRoot).to.be.equal("0x0b6e25a995ad97c378eb717afb66025c9b97b8b64727cc38277af800b89efc67")
    });

    it("Sets paused", async function () {
        await contract.connect(owner).setPaused(false);
        const isPaused = await contract.isPaused()

        expect(isPaused).to.be.equal(false)
    });


    it("Fails when non-owner tries to use only owner function", async function () {
        const attempt = contract.connect(addr1).setAllowlistMerkleRoot("0x0b6e25a995ad97c378eb717afb66025c9b97b8b64727cc38277af800b89efc67");

        await expect(attempt).to.be.reverted;
    });

});

// ===================== Allowlist ========================

describe("LegendX allowlist minting", function () {
let contract;
let owner;
let addr1;
let rosie;
let ownerAddress;
let addr1Address;
let rosieAddress;
let proof;
  
    beforeEach(async () => {
      [owner, addr1, rosie] = await ethers.getSigners();
      ownerAddress = await owner.getAddress();
      addr1Address = await addr1.getAddress();
      rosieAddress = await rosie.getAddress();
      const LegendX = await ethers.getContractFactory("LegendX");
      contract = await LegendX.deploy();
      await contract.connect(owner).setAllowlistSaleTime(1644113480, 2644113480);
      await contract.connect(owner).setAllowlistMerkleRoot("0x0b6e25a995ad97c378eb717afb66025c9b97b8b64727cc38277af800b89efc67");
      await contract.connect(owner).setPaused(false)
      proof = [
          '0x72895db48a7b52e16314800769e95c81669fb63197ea9cea700dd7402e843702',
          '0x19771089a766be3051e1b8ee91931fd83fdf6d33f06398ccf7fcb41957c0c622',
          '0xa110bb51e5f66f862628176b12792e68f810f975225b5dd54baff36bbfcb19a4'
      ]
    });

    it("Mints", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        const mint = await contract.connect(rosie).allowlistMint(1, proof, options);

        expect(mint).to.be.not.undefined;
        expect(mint).to.be.not.null;
    });

    it("Fails if mint paused", async function () {
        const options = {
            value: ethers.utils.parseEther("1.0")
        };

        await contract.connect(owner).setPaused(true)
        const mint = contract.connect(rosie).allowlistMint(2, proof, options);

        await expect(mint).to.be.revertedWith("Mint paused");
    });

    it("Fails if collection size has been reached", async function () {
        const options = {
            value: ethers.utils.parseEther("1.0")
        };

        await contract.connect(owner).setMaxSupply(1,0);
        const mint = contract.connect(rosie).allowlistMint(2, proof, options);

        await expect(mint).to.be.revertedWith("Reached max supply");
    });


    it("Fails if allowlist time has not started", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        await contract.connect(owner).setAllowlistSaleTime(2527693879,2527693880);
        const mint = contract.connect(rosie).allowlistMint(1, proof, options);

        await expect(mint).to.be.revertedWith("Allowlist window is closed!");
    });

    it("Fails with incorrect proof", async function () {
        const options = {
            value: ethers.utils.parseEther("1.2")
        };

        const proof = [
            '0x72895db48a7b52e16314800769e95c81669fb63197ea9cea700dd7402e843702',
            '0x19771089a766be3051e1b8ee91931fd83fdf6d33f06398ccf7fcb41957c0c622'
        ]

        const mint = contract.connect(rosie).allowlistMint(1, proof, options);

        await expect(mint).to.be.revertedWith("Proof not on allowlist!");
    });

    it("Fails to mint more than max", async function () {
        const options = {
            value: ethers.utils.parseEther("1.2")
        };
        const config = await contract.purchaseConfig();
        const mint = contract.connect(rosie).allowlistMint(Math.ceil(Number(config.maxAllowlistTxn)+1), proof, options);

        await expect(mint).to.be.revertedWith("Mint Amount Incorrect");
    });

    it("Fails to mint more than max in two transactions", async function () {
        const options = {
            value: ethers.utils.parseEther("1.2")
        };
        const config = await contract.purchaseConfig();

        await contract.connect(rosie).allowlistMint(Math.ceil(Number(config.maxAllowlistTxn)/2), proof, options);
        const mint = contract.connect(rosie).allowlistMint(Math.ceil(Number(config.maxAllowlistTxn)/2)+1, proof, options);

        await expect(mint).to.be.revertedWith("Exceeds max mint amount!");
    });

    it("Fails if incorrect eth amount sent", async function () {
        const options = {
            value: ethers.utils.parseEther("0.03")
        };

        const mint = contract.connect(rosie).allowlistMint(1, proof, options);

        await expect(mint).to.be.revertedWith("Incorrect payment amount!");
    });

    it("Fails if 0 amount sent", async function () {
        const options = {
            value: ethers.utils.parseEther("1.0")
        };

        const mint = contract.connect(rosie).allowlistMint(0, proof, options);

        await expect(mint).to.be.revertedWith("Mint Amount Incorrect");
    });

    it("Fails to mint if not on list", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        const mint = contract.connect(addr1).allowlistMint(1, proof, options);

        await expect(mint).to.be.revertedWith("Proof not on allowlist!");
    });
});

// ===================== Claimlist ========================

describe("LegendX claimlist minting", function () {
let contract;
let owner;
let addr1;
let rosie;
let ownerAddress;
let addr1Address;
let rosieAddress;
let proof;
    
    beforeEach(async () => {
        [owner, addr1, rosie] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
        addr1Address = await addr1.getAddress();
        rosieAddress = await rosie.getAddress();
        const LegendX = await ethers.getContractFactory("LegendX");
        contract = await LegendX.deploy();
        await contract.connect(owner).setPaused(false)
        await contract.connect(owner).setClaimlistSaleTime(1644113480, 2644113480);
        await contract.connect(owner).setClaimlistMerkleRoot("0x5901829e5cbb7ab8996ca63c4d81d35dc2f09b8d28fbf1075e895bd737f82178");
        proof = [
        '0xff119c548fd3868a6f91288ef6067a265dccb9ae3365e710b939fc4b85160474'
        ]
    });

    it("Mints", async function () {
        const mint = await contract.connect(rosie).claimMint(3, proof);

        expect(mint).to.be.not.undefined;
        expect(mint).to.be.not.null;
    });

    it("Fails if mint paused", async function () {
        await contract.connect(owner).setPaused(true)
        const mint = contract.connect(rosie).claimMint(3, proof);

        await expect(mint).to.be.revertedWith("Mint paused");
    });

    it("Fails if claimlist sale has not started", async function () {
        await contract.connect(owner).setClaimlistSaleTime(2527693879,2527693880);
        const mint = contract.connect(rosie).claimMint(1, proof);

        await expect(mint).to.be.revertedWith("Claim window is closed!");
    });

    it("Fails if collection size has been reached", async function () {

        await contract.connect(owner).setMaxSupply(2,0);
        const mint = contract.connect(rosie).claimMint(3, proof);

        await expect(mint).to.be.revertedWith("Reached max supply");
    });

    it("Fails with incorrect proof", async function () {
        const proof = [
            '0x72895db48a7b52e16314800769e95c81669fb63197ea9cea700dd7402e843702',
            '0x19771089a766be3051e1b8ee91931fd83fdf6d33f06398ccf7fcb41957c0c622'
        ]

        const mint = contract.connect(rosie).claimMint(0, proof);

        await expect(mint).to.be.revertedWith("Proof not on claimlist!");
    });

    it("Fails to mint more than once", async function () {
        await contract.connect(rosie).claimMint(3, proof);
        const mint = contract.connect(rosie).claimMint(3, proof);

        await expect(mint).to.be.revertedWith("Already claimed!");
    });

    it("Fails to claim if not on list", async function () {
        const mint = contract.connect(addr1).claimMint(1, proof);

        await expect(mint).to.be.revertedWith("Proof not on claimlist!");
    });
});

// ===================== Public ========================

describe("LegendX public minting", function () {
let contract;
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
        const LegendX = await ethers.getContractFactory("LegendX");
        contract = await LegendX.deploy();
        await contract.connect(owner).setPaused(false)
        await contract.connect(owner).setPublicSaleTime(1644113480, 2644113480);
    });

    it("Mints", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        const mint = await contract.connect(rosie).publicSaleMint(1, options);

        expect(mint).to.be.not.undefined;
        expect(mint).to.be.not.null;
    });

    it("Fails if mint paused", async function () {
        const options = {
            value: ethers.utils.parseEther("1.0")
        };

        await contract.connect(owner).setPaused(true)
        const mint = contract.connect(rosie).publicSaleMint(3, options);

        await expect(mint).to.be.revertedWith("Mint paused");
    });

    it("Fails if collection size minus claim size has been reached", async function () {
        const options = {
            value: ethers.utils.parseEther("1.0")
        };

        await contract.connect(owner).setMaxSupply(4,3);
        const mint = contract.connect(rosie).publicSaleMint(2, options);

        await expect(mint).to.be.revertedWith("Reached max supply");
    });

    it("Fails if collection size has been reached", async function () {
        const options = {
            value: ethers.utils.parseEther("1.0")
        };

        await contract.connect(owner).setMaxSupply(3,0);
        const mint = contract.connect(rosie).publicSaleMint(4, options);

        await expect(mint).to.be.revertedWith("Reached max supply");
    });


    it("Fails if public time has not started", async function () {
        const options = {
            value: ethers.utils.parseEther("0.1")
        };

        await contract.connect(owner).setPublicSaleTime(2527693879, 2527693879);
        const mint = contract.connect(rosie).publicSaleMint(1, options);

        await expect(mint).to.be.revertedWith("Public window is closed!");
    });

    it("Fails to mint more than max", async function () {
        const options = {
            value: ethers.utils.parseEther("1.2")
        };
        const config = await contract.purchaseConfig();

        const mint = contract.connect(rosie).publicSaleMint(Number(config.maxPublicTxn)+1, options);

        await expect(mint).to.be.revertedWith("Mint Amount Incorrect");
    });

    it("Fails if incorrect eth amount sent", async function () {
        const options = {
            value: ethers.utils.parseEther("0.03")
        };

        const mint = contract.connect(rosie).publicSaleMint(1, options);

        await expect(mint).to.be.revertedWith("Incorrect payment amount!");
    });

    it("Fails if 0 amount sent", async function () {
        const options = {
            value: ethers.utils.parseEther("1.0")
        };

        const mint = contract.connect(rosie).publicSaleMint(0, options);

        await expect(mint).to.be.revertedWith("Mint Amount Incorrect");
    });
});

// ===================== Dev Mint ========================

describe("LegendX Dev mint", function () {
    let contract;
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
        const LegendX = await ethers.getContractFactory("LegendX");
        contract = await LegendX.deploy();
        await contract.connect(owner).setPaused(false)
    });

    it("Mints", async function () {
        const mint = await contract.connect(owner).devMint([rosieAddress],[1]);

        expect(mint).to.be.not.undefined;
        expect(mint).to.be.not.null;
    });

    it("Fails if reached max mints", async function () {
        await contract.connect(owner).setMaxSupply(3,0);
        const mint = contract.connect(owner).devMint([rosieAddress],[4]);

        await expect(mint).to.be.revertedWith("Reached max supply");
    });

    it("Fails to dev mint if arrays different sizes", async function () {
        const mint = contract.connect(owner).devMint([rosieAddress],[1,2]);

        await expect(mint).to.be.revertedWith("Arrays dont match");
    });

    it("Fails to dev mint if 0 quantity", async function () {
        const mint = contract.connect(owner).devMint([rosieAddress, addr1Address],[1,0]);

        await expect(mint).to.be.revertedWith("Cannot mint 0!");
    });
});