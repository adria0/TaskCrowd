var ADDRZERO = "0x0000000000000000000000000000000000000000"
var MINING_TIMEOUT = 60000

var taskCrowd

var refreshCount = 0
var startingBlockNumber = -1
var account

var members       = []
var membersByAddr = new Object();
var tasks   = []

var lineStatusBlock
var lineStatusNetwork


function addr_url(_addr,_text) {
  return "<a href=https://testnet.etherscan.io/address/"+_addr+" target="+_addr+">"+_text+"</a>";
}

function tx_url(_tx) {
  return "<a href=https://testnet.etherscan.io/tx/"+_tx+" target="+_tx+">"+_tx+"</a>";
}

function member_name(_addr) {

  var member = membersByAddr[_addr];
  var name;

  if ( member != null )
  {
     name = member.name;
  } else {    
     name = "Unknown";
  }

  return name;

}

function set_status(_msg, _loading) {

  if (_loading) {
    _msg = "<img src='https://media.giphy.com/media/eb21J3yEB8yGY/source.gif' />"+_msg;
  }
  $("#status").html(_msg)  
}

function member_icon(_addr, _scale) {

  var icon = blockies.create({ // All options are optional
    seed: _addr, // seed used to generate icon data, default: random
    size: 8, // width/height of the icon in blocks, default: 8
    scale: _scale, // width/height of each block in pixels, default: 4
    spotcolor: '#000', // each pixel has a 13% chance of being of a third color, 
    bgcolor: '#ECF0F1',
    //color: '#444'
  });  

  return icon;
}

function set_member_icon(_addr, _element) {

  var name = member_name(_addr);

  _element.innerHTML = '';
  var e = document.createElement("div")
  e.setAttribute("class","blockymember");
  var text = document.createElement("div")
  text.innerHTML = addr_url(_addr,name);
  var icon = member_icon(_addr,4)
  icon.setAttribute("class","blocky");
  e.appendChild(icon)
  e.appendChild(text)
  _element.appendChild(e)

}


function add_log(_message) {
  var logs = document.getElementById("logs");
  logs.innerHTML = _message+"<br>"+logs.innerHTML;
};

function taskstatus2str(_status) {
  return (["Pending","Finished","Approving","Approved"])[_status];
}

// Metamask fiendly getTransactionReceiptMined
function getTransactionReceiptMined(txnHash, interval) {
    var transactionReceiptAsync;
    interval = interval ? interval : 500;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
            web3.eth.getTransactionReceipt(txnHash)
                .then(function (receipt) {
                    if (receipt == null) {
                        setTimeout(function () {
                            transactionReceiptAsync(txnHash, resolve, reject);
                        }, interval);
                    } else {
                        resolve(receipt);
                    }
                });
        } catch(e) {
            reject(e);
        }
    };

    if (Array.isArray(txnHash)) {
        var promises = [];
        txnHash.forEach(function (oneTxHash) {
            promises.push(getTransactionReceiptMined(oneTxHash, interval));
        });
        return Promise.all(promises);
    } else {
        return new Promise(function (resolve, reject) {
                transactionReceiptAsync(txnHash, resolve, reject);
            });
    }
};

function refresh() {

   web3.eth.getBlockNumber( (_error, _blockNumber) => {
     var blocksSinceStart
     if (startingBlockNumber == -1) {
       startingBlockNumber = _blockNumber
       blocksSinceStart = 0
     } else {
       blocksSinceStart = _blockNumber - startingBlockNumber
     }
     lineStatusBlock = blocksSinceStart + " blocks ("+startingBlockNumber+"&rarr;"+_blockNumber+")"
   });

   web3.eth.getAccounts( (_err, _accs) => {
    if (_err != null) {
      add_log("There was an error fetching your accounts.");
      return;
    }

    if (_accs.length == 0) {
      add_log("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }

    var currentAccountElement = document.getElementById("currentAccount");

    if (account != _accs[0] ) {

      account = _accs[0];

      set_member_icon(account,$("#currentMember")[0])
    }

   });

   refreshCount++;

   var taskcrowdAddress
   try {
      taskcrowdAddress = "Deployed at "+addr_url(TaskCrowd.address,TaskCrowd.address);
   } catch(e) {}

   document.getElementById("statusline").innerHTML = lineStatusNetwork + "<br>" + taskcrowdAddress + "<br>" + lineStatusBlock;

   setTimeout(function(){
       refresh();
   }, 1000);

};

function add_member() {

  var memberName = prompt("Member name?")
  var memberAddress = prompt("Member address?")

  add_log("Adding member "+memberAddress);
  taskCrowd.addMember(memberAddress, memberName)
  .then ( (_tx) => {
    console.log(_tx);
    set_status("Waiting network agrees with operation...",true);
    return getTransactionReceiptMined(_tx);     
  }).then ( ( _resolve, _reject ) => {
    set_status("",false);
    update_project_info();
  }).catch ( (e) => {
    console.log(e);
    add_log("failed "+e);
    set_status("",false);
    alert("Operation failed");
  })

}

function approve_member(_addr) {

  add_log("Approving member "+_addr);
  taskCrowd.approveMember(_addr)
  .then ( (_tx) => {
    console.log(_tx);
    set_status("Waiting network agrees with operation...",true);
    return getTransactionReceiptMined(_tx);     
  }).then ( ( _resolve, _reject ) => {
    set_status("",false);
    update_project_info();
  }).catch ( (e) => {
    console.log(e);
    add_log("failed "+e);
    set_status("",false);
    alert("Operation failed");
  })

}

function add_task() {

  var taskId = prompt("Task id?")
  var member = prompt("Member address?")
  var description = prompt("Description?")
  var maxWorkload = prompt("Max workload?")

  add_log("Adding task "+taskId);
  taskCrowd.addTask(member,taskId,description,maxWorkload)
  .then ( (_tx) => {
    console.log(_tx);
    set_status("Waiting network agrees with operation...",true);
    return getTransactionReceiptMined(_tx);     
  }).then ( ( _resolve, _reject ) => {
    set_status("",false);
    update_project_info();
  }).catch ( (e) => {
    console.log(e);
    add_log("failed "+e);
    set_status("",false);
    alert("Operation failed");
  })

}

function finish_task(_taskId) {

  var finalWorkload = prompt("FinalWorkload?")

  add_log("finish_task"+_taskId);
  taskCrowd.finishTask(_taskId,finalWorkload)
  .then ( (_tx) => {
    console.log(_tx);
    set_status("Waiting network agrees with operation...",true);
    return getTransactionReceiptMined(_tx);     
  }).then ( ( _resolve, _reject ) => {
    set_status("",false);
    update_project_info();
  }).catch ( (e) => {
    console.log(e);
    add_log("failed "+e);
    set_status("",false);
    alert("Operation failed");
  })

}

function approve_task(_taskId) {

  add_log("approve_task"+_taskId);
  taskCrowd.approveTask(_taskId)
  .then ( (_tx) => {
    console.log(_tx);
    set_status("Waiting network agrees with operation...",true);
    return getTransactionReceiptMined(_tx);     
  }).then ( ( _resolve, _reject ) => {
    set_status("",false);
    update_project_info();
  }).catch ( (e) => {
    console.log(e);
    add_log("failed "+e);
    set_status("",false);
    alert("Operation failed");
  })

}


function update_project_info() {

    tasks = []
    members = []
    membersByAddr = new Object();
    
    taskCrowd.getMemberCount()
    .then ( (_memberCount) => {

        add_log("Membercount="+_memberCount);

        var promises = []
        var memberCount = _memberCount.toNumber();

        for (i=0;i<memberCount;i++) {

          promise = taskCrowd.members.call(i)
          .then( (_fields) => {
            
            var member = {
              address   : _fields[0] ,
              name      : _fields[1] ,
              approver1 : _fields[2] ,
              approver2 : _fields[3]
            }
            members.push(member);
            membersByAddr[member.address] = member;
          })
          promises.push(promise);
        }
        return Promise.all(promises);

    }).then( () => {

       var table = document.getElementById("members");

       var rows = table.rows.length
       while (rows > 1)  {
          table.deleteRow(rows-1);
          rows--;
       }

       for (i=0;i<members.length;i++) {

          var row = table.insertRow(-1);

          var cellName      = row.insertCell(0);
          var cellApprover1 = row.insertCell(1);
          var cellApprover2 = row.insertCell(2);
          var cellActions   = row.insertCell(3);

          set_member_icon(members[i].address,cellName);
          set_member_icon(members[i].approver1,cellApprover1);

          if (members[i].approver2 != ADDRZERO) {
            set_member_icon(members[i].approver2,cellApprover2);
          } else {
            cellActions.innerHTML = "<button onclick='approve_member(\""+members[i].address+"\")'>Approve</button>";
          }
       }

       return taskCrowd.getTaskCount();

    }).then( (_taskCount) => {

        var promises = []
        var taskCount = _taskCount.toNumber();

        add_log("taskCount="+_taskCount);

        for (i=0;i<taskCount;i++) {

          promise = taskCrowd.tasks.call(i)
          .then( (_fields) => {
            
            var task = {
               status        : _fields[0] ,
               member        : _fields[1] ,
               description   : _fields[2] ,
               date          : _fields[3] ,
               taskId        : _fields[4] ,
               maxWorkload   : _fields[5] ,
               finalWorkload : _fields[6] ,
               approver1     : _fields[7] ,
               approver2     : _fields[8]
            }

            console.log(task)

            tasks.push(task);
          })
          promises.push(promise);
        }
        return Promise.all(promises);

     }).then( () => {

       var table = document.getElementById("tasks");

       var rows = table.rows.length
       while (rows > 1)  {
          table.deleteRow(rows-1);
          rows--;
       }
              add_log("begin");


       for (i=0;i<tasks.length;i++) {

          var row             = table.insertRow(-1);

          var cellId          = row.insertCell(0);
          var cellOwner       = row.insertCell(1);
          var cellDescription = row.insertCell(2);
          var cellStatus      = row.insertCell(3);
          var cellWorkload    = row.insertCell(4);
          var cellApprover1   = row.insertCell(5);
          var cellApprover2   = row.insertCell(6);
          var cellActions     = row.insertCell(7);

          cellId.innerHTML = tasks[i].taskId;
          set_member_icon(tasks[i].member,cellOwner);
          cellDescription.innerHTML = tasks[i].description;
          cellStatus.innerHTML = taskstatus2str(tasks[i].status.toNumber());
          cellWorkload.innerHTML = tasks[i].finalWorkload.toNumber() + "/" + tasks[i].maxWorkload.toNumber();

          if (tasks[i].approver1 != ADDRZERO) {
            set_member_icon(tasks[i].approver1,cellApprover1);
          } 
          if (tasks[i].approver2 != ADDRZERO) {
            set_member_icon(tasks[i].approver2,cellApprover2);
          } 

          switch (tasks[i].status.toNumber()) {
            case 0:
              cellActions.innerHTML = "<button onclick='finish_task("+tasks[i].taskId+")'>Finish</button>";
              break;
            case 1:
            case 2:
              cellActions.innerHTML = "<button onclick='approve_task("+tasks[i].taskId+")'>Approve</button>";
              break;
          }

       }
       add_log("done");
       if (refreshCount==0) refresh();


    }).catch( (e) => {
      add_log("Error getting info "+e);
    });

}

window.onload = function() {

  TaskCrowd.deployed()
  .then( _taskCrowd => {
    taskCrowd = _taskCrowd;
    return taskCrowd.name();
  }).then ( _name => {
    document.getElementById("taskCrowdName").innerHTML = _name +" Task Crowd ";
    update_project_info();
  });

  web3.version.getNetwork( (_error, _network) => {

     if (_error != null) {
       document.getElementById("network").innerHTML = errror;
       return;
     }

     var networkName = "Network "+_network;

     if (_network == 1) networkName = "Main Network";
     else if (_network == 2) networkName = "Morden Network";
     else if (_network == 3) networkName = "Ropsten Network";
     else networkName = "Unknown Network";

     lineStatusNetwork = networkName;
  })

  $("#addMemberBtn").click( () => { add_member(); })
  $("#addTaskBtn").click( () => { add_task(); })

}
