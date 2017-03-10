var TaskCrowdFactory = artifacts.require("./TaskCrowdFactory.sol");
var TaskCrowd = artifacts.require("./TaskCrowd.sol");

contract('TaskCrowdFactory', accounts => {

  var tc;

  var capybara = accounts[0];
  var rockcavy = accounts[1];
  var coypu    = accounts[2];
  var cuy      = accounts[6];

  beforeEach("setup", done => {

    TaskCrowdFactory.deployed()
    .then( _factory => {
      return _factory.create("niceshower",1,"capybara",rockcavy,"rockcavy" , { from : capybara } );
    }).then ( _result => {
      assert.equal( _result.logs.length, 1, "One contract is created");
      tc = TaskCrowd.at(_result.logs[0].args.addr);
      done();
    })

  });

  it("construction is correct", function() {
    
    return tc.name()
    .then ( _name => {
      assert.equal( _name, "niceshower");      
      return tc.getMemberCount();
    }).then ( _getMemberCount => {
      assert.equal( _getMemberCount, 2);      
      return tc.isMemberEnrolled(capybara)
    }).then ( _enrolled => {
      assert.equal( _enrolled, true, "Should be enrolled");
      return tc.isMemberEnrolled(rockcavy)
    }).then ( _enrolled => {
      assert.equal( _enrolled, true, "Should be enrolled");
    })

  });

  it("cannot add existing member", function() {
    return tc.addMember( rockcavy, "rockcavy1", { from : capybara } )
    .then ( _result => {
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogError");      
    })
  });

  it("cannot aprove an unknown member", function() {
    return tc.approveMember( rockcavy, { from : capybara } )
    .then ( _result => {
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogError");      
    })
  });


  it("two different members can add a member", function() {
    return tc.isMemberEnrolled(coypu)
    .then ( _enrolled  => {
      assert.equal( _enrolled, false, "Should not enrolled");
      return tc.addMember( coypu, "coypu", { from : capybara } )
    }).then ( _result => {
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogMemberAdded");
      return tc.isMemberEnrolled(coypu);
    }).then ( _enrolled  => {
      assert.equal( _enrolled, false, "Should not enrolled yet");
      return tc.approveMember(coypu, { from : rockcavy } );
    }).then ( _result  => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogMemberApproved");
      return tc.isMemberEnrolled(coypu);
    }).then ( _enrolled  => {
      assert.equal( _enrolled, true, "Should be enrolled");
    })
  });

  it("one member cannot add and approve another member", function() {
    return tc.addMember( coypu, "coypu", { from : capybara } )
    .then ( _result => {
      return tc.approveMember(coypu, { from : capybara } );
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogError");
    })
  });

  it("a member cannot add a task for himself", function() {
    return tc.addTask( capybara, 1, "waterfaucet", 1000, { from : capybara } )
    .then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogError");
    })
  });

  it("cannot create two tasks with the same id", function() {
    return tc.addTask( rockcavy, 1, "tumbling", 1000, { from : capybara } )
    .then ( _result => {   
      assert.equal( _result.logs.length, 1);
      assert.equal( _result.logs[0].event, "LogTaskAdded");
      return tc.addTask( rockcavy, 1, "openfaucetagain", 1000, { from : capybara } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogError");
    })
  });

  it("only task owner can finish the task", function() {
    return tc.addTask( rockcavy, 1, "backstroke", 1000, { from : capybara } )
    .then ( _result => {
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskAdded");
      return tc.finishTask( 1, 1000, { from : capybara } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogError");
      return tc.finishTask( 1, 1000, { from : rockcavy } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskFinished");
    })
  });

  it("task workload limit cannot be exeeded", function() {
    return tc.addTask( rockcavy, 1, "swim", 1000, { from : capybara } )
    .then ( _result => {
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskAdded");
      return tc.finishTask( 1, 1001, { from : rockcavy } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogError");
    })
  });

  it("task owner cannot aprove the task", function() {
    return tc.addTask( rockcavy, 1, "jump", 1000, { from : capybara } )
    .then ( _result => {
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskAdded");
      return tc.finishTask( 1, 1000, { from : rockcavy } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskFinished");
      return tc.approveTask( 1, 1000, { from : rockcavy } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogError");
    })
  });

  it("task should be approved by two different members", function() {
    return tc.addTask( rockcavy, 1, "playwithball", 1000, { from : capybara } )
    .then ( _result => {
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskAdded");
      return tc.finishTask( 1, 1000, { from : rockcavy } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskFinished");
      return tc.approveTask( 1, 1000, { from : capybara } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskApproving");
      return tc.approveTask( 1, 1000, { from : capybara } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);
      assert.equal( _result.logs[0].event, "LogError");
      return tc.addMember( coypu, "coypu", { from : capybara } )
    }).then ( _result => {   
      return tc.approveMember( coypu, { from : rockcavy } )
    }).then ( _result => {   
      return tc.approveTask( 1, 1000, { from : coypu } )
    }).then ( _result => {   
      assert.equal( _result.logs.length, 1);      
      assert.equal( _result.logs[0].event, "LogTaskApproved");
    })
  });

});
