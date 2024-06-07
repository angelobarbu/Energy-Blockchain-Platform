const EnergyTrading = artifacts.require("EnergyTrading");

module.exports = function(deployer, network, accounts) {
  const bufferWallet = accounts[9]; // Use the 9th account as the buffer wallet
  deployer.deploy(EnergyTrading, bufferWallet);
};
