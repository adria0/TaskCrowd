var TaskCrowdFactory = artifacts.require("./TaskCrowdFactory.sol");
var TaskCrowd = artifacts.require("./TaskCrowd.sol");

module.exports = function(deployer) {
  var acc1 = "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1";
  var acc2 = "0xffcf8fdee72ac11b5c542428b35eef5769c409f0";
  deployer.deploy(TaskCrowd,"Test",50,acc1,"capibara",acc2,"rockcavy");
  deployer.deploy(TaskCrowdFactory);
};
