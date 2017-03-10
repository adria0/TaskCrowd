var TaskCrowdFactory = artifacts.require("./TaskCrowdFactory.sol");

module.exports = function(deployer) {
  deployer.deploy(TaskCrowdFactory);
};
