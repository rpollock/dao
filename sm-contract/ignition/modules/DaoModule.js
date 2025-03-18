// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DaoModule", (m) => {
  const nftContractAddress = "0x2ec92364276Bd9cb9cd4649197f495B4D460AEd1";

  const votingDAO = m.contract("VotingDAO", [nftContractAddress]);

  return { votingDAO };
});
