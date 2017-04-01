var TaskCrowdFactory = artifacts.require("./TaskCrowdFactory.sol");
var TaskCrowd = artifacts.require("./TaskCrowd.sol");

contract('TaskCrowdFactory', accounts => {

  var tc;

  var capybara = accounts[0];
  var rockcavy = accounts[1];
  var coypu    = accounts[2];
  var cuy      = accounts[6];

  beforeEach(async () => {

    let factory = await TaskCrowdFactory.deployed()
    let result  = await factory.create("niceshower",1,capybara,"capybara",rockcavy,"rockcavy" , { from : capybara } );
    assert.equal( result.logs.length, 1, "One contract is created");      
    tc = TaskCrowd.at( result.logs[0].args.addr);

  });

  it("construction is correct", async () => {
    
    let name = await tc.name()
    assert.equal(name, "niceshower");      
    
    let memberCount = await tc.getMemberCount();
    assert.equal( memberCount, 2);      
    
    let capybaraEnrolled = await tc.isMemberEnrolled(capybara)
    assert.equal(capybaraEnrolled, true, "Should be enrolled");
    
    let rockcavyEnrolled = await tc.isMemberEnrolled(rockcavy)
    assert.equal(rockcavyEnrolled, true, "Should be enrolled");

  });

  it("cannot add existing member", async () => {
    let result = await tc.addMember( rockcavy, "rockcavy1", { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");      
  });

  it("cannot aprove an unknown member", async () => {
    let result =  await tc.approveMember( rockcavy, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");      
  });


  it("two different members can add a member", async () => {
    let enrolled = await tc.isMemberEnrolled(coypu)
    assert.equal( enrolled, false, "Should not enrolled");
    
    let result = await tc.addMember( coypu, "coypu", { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogMemberAction");
    assert.equal( result.logs[0].args.msg, "member-added");

    enrolled = await tc.isMemberEnrolled(coypu);
    assert.equal( enrolled, false, "Should not enrolled yet");

    result = await tc.approveMember(coypu, { from : rockcavy } );
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogMemberAction");
    assert.equal( result.logs[0].args.msg, "member-approved");

    enrolled = await tc.isMemberEnrolled(coypu);
    assert.equal( enrolled, true, "Should be enrolled");
  });

  it("one member cannot add and approve another member", async () => {
    await tc.addMember( coypu, "coypu", { from : capybara } )
    let result = await tc.approveMember(coypu, { from : capybara } );
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");
  });

  it("a member cannot add a task for himself", async () => {
    let result = await tc.addTask( capybara, 1, "waterfaucet", 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");
  });

  it("a member cannot add a task for a non-member", async () => {
    let result = await tc.addTask( cuy, 1, "learngolang", 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");
  });

  it("cannot create two tasks with the same id", async () => {
    let result = await tc.addTask( rockcavy, 1, "tumbling", 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-added");

    result = await tc.addTask( rockcavy, 1, "openfaucetagain", 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");
  });

  it("only task owner can finish the task", async () => {
    let result = await tc.addTask( rockcavy, 1, "backstroke", 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-added");      

    result = await tc.finishTask( 1, 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");

    result = await tc.finishTask( 1, 1000, { from : rockcavy } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-finished");
  });

  it("task workload limit cannot be exeeded", async () => {
    let result = await tc.addTask( rockcavy, 1, "swim", 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-added");

    result = await tc.finishTask( 1, 1001, { from : rockcavy } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");
  });

  it("task owner cannot aprove the task", async () => {
    let result = await tc.addTask( rockcavy, 1, "jump", 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-added");

    result = await tc.finishTask( 1, 1000, { from : rockcavy } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-finished");
    
    result = await tc.approveTask( 1, 1000, { from : rockcavy } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogError");
  });

  it("task should be approved by two different members", async () => {
    let result = await tc.addTask( rockcavy, 1, "playwithball", 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-added");

    result = await tc.finishTask( 1, 1000, { from : rockcavy } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-finished");

    result = await tc.approveTask( 1, 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-approving");

    result = await tc.approveTask( 1, 1000, { from : capybara } )
    assert.equal( result.logs.length, 1);
    assert.equal( result.logs[0].event, "LogError");

    await tc.addMember( coypu, "coypu", { from : capybara } )
    await tc.approveMember( coypu, { from : rockcavy } )
    result = await tc.approveTask( 1, 1000, { from : coypu } )
    assert.equal( result.logs.length, 1);      
    assert.equal( result.logs[0].event, "LogTaskAction");
    assert.equal( result.logs[0].args.msg, "task-approved");

  });

});
