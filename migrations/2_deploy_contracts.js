// © Barbu Angelo-Gabriel - angelo.barbu123@gmail.com - 2024

const EnergyTrading = artifacts.require("EnergyTrading");

module.exports = async function(deployer, network, accounts) {
  // Deployment logic
  // The deployment script deploys the EnergyTrading contract.

  // Deploy the EnergyTrading contract
  await deployer.deploy(EnergyTrading);

  // Get the deployed instance of the EnergyTrading contract
  const energyTrading = await EnergyTrading.deployed();

  console.log("EnergyTrading contract deployed at address:", energyTrading.address);
};
