const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingDAO", function () {
  let VotingDAO, votingDAO, MockNFT, nftMock;
  let owner, voter1, voter2, nonVoter;

  beforeEach(async function () {
    [owner, voter1, voter2, nonVoter] = await ethers.getSigners();
    MockNFT = await ethers.getContractFactory("MockNFT");
    nftMock = await MockNFT.deploy();
    await nftMock.waitForDeployment();

    const nftAddress = await nftMock.getAddress();
    console.log("MockNFT deployed at:", nftAddress);

    VotingDAO = await ethers.getContractFactory("VotingDAO");
    votingDAO = await VotingDAO.deploy(nftAddress);
    await votingDAO.waitForDeployment();
  });

  it("Should set the correct NFT contract and owner", async function () {
    const nftAddress = await nftMock.getAddress();
    expect(await votingDAO.nftContract()).to.equal(nftAddress);
    expect(await votingDAO.owner()).to.equal(owner.address);
  });

  it("Should allow the owner to create a proposal", async function () {
    const tx = await votingDAO.createProposal("Proposal 1", 3600);
    const receipt = await tx.wait();

    const event = receipt.logs.find((log) => log.eventName === "ProposalCreated");
    expect(event).to.not.be.undefined;

    const proposalId = event.args.proposalId;
    expect(proposalId).to.equal(0);
  });

  it("Should allow NFT holders to vote", async function () {

    await nftMock.mint(voter1.address);
    await votingDAO.createProposal("Proposal 1", 3600);
    const votingDAOAsVoter1 = votingDAO.connect(voter1);
    await expect(votingDAOAsVoter1.vote(0, true))
      .to.emit(votingDAO, "Voted")
      .withArgs(0, voter1.address, true, 1);

    const proposal = await votingDAO.getProposal(0);
    expect(proposal.forVotes).to.equal(1);
  });

  it("Should not allow voting twice by the same voter", async function () {
    await nftMock.mint(voter1.address);
    await votingDAO.createProposal("Proposal 1", 3600);

    const votingDAOAsVoter1 = votingDAO.connect(voter1);
    await votingDAOAsVoter1.vote(0, true);

    await expect(votingDAOAsVoter1.vote(0, true))
      .to.be.revertedWith("Already voted");
  });

  it("Should correctly record votes", async function () {
    await nftMock.mint(voter1.address);
    await nftMock.mint(voter2.address);

    await votingDAO.createProposal("Proposal 1", 3600);

    await votingDAO.connect(voter1).vote(0, true);
    await votingDAO.connect(voter2).vote(0, false);

    const proposal = await votingDAO.getProposal(0);
    expect(proposal.forVotes).to.equal(1);
    expect(proposal.againstVotes).to.equal(1);
  });
});
