var ADDRZERO = "0x0000000000000000000000000000000000000000"

var account
var taskCrowd
var members       = []
var membersByAddr = new Object();
var tasks         = []

var refreshCount        = 0
var startingBlockNumber = -1
var lineStatusBlock
var lineStatusNetwork

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
    _msg = "<img src='img/loading.gif' />"+_msg;
  }
  $("#status").html(_msg)  
}

function member_icon(_addr, _scale) {

  var icon = blockies.create({ // All options are optional
    seed: _addr, // seed used to generate icon data, default: random
    size: 8, // width/height of the icon in blocks, default: 8
    scale: _scale, // width/height of each block in pixels, default: 4
    spotcolor: '#000', // each pixel has a 13% chance of being of a third color, 
    bgcolor: '#ECF0F1'
  });

  icon.addEventListener('click', () => {
    var ct = document.getElementById("copyTarget");
    ct.style.display = 'block';
    ct.setAttribute("value",_addr);
    ct.focus()
    ct.setSelectionRange(0,_addr.length)
    document.execCommand('copy');
    ct.style.display = 'none';
    toastr.info(addr_url(_addr,'Address ')+' copied to clipboard');
  }, false);

  return icon;
}

function set_member_icon(_addr, _element) {

  var name = member_name(_addr);

  _element.innerHTML = '';
  var e = document.createElement("div")
  e.setAttribute("class","blockymember");
  var text = document.createElement("div")
  text.innerHTML = name;
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

function is_account_member() {
  var member = membersByAddr[account];
  if ( member == null ) return false;
  return ( member.approver1 != ADDRZERO && member.approver2 != ADDRZERO )
}

function remove_table_rows(_table) {
   var rows = _table.rows.length
   while (rows > 1)  {
      _table.deleteRow(rows-1);
      rows--;
   }
}

function refresh_current_account() {

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
      update_project_info();

    }

   });

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

   var taskcrowdAddress
   try {
      taskcrowdAddress = "Deployed at "+addr_url(taskCrowd.address,taskCrowd.address);
   } catch(e) {}

   document.getElementById("statusline").innerHTML = lineStatusNetwork + "<br>" + taskcrowdAddress + "<br>" + lineStatusBlock;

   refreshCount++;

   setTimeout(function(){
       refresh_current_account();
   }, 1000);

};

function do_transaction(_promise) {
  _promise
  .then ( (_tx) => {
    toastr.info('Operation sent');
    add_log("tx "+tx_url(_tx.tx,_tx.tx));
    set_status("Waiting network agrees with operation...",true);
    return getTransactionReceiptMined(_tx.tx);     
  }).then ( ( _resolve, _reject ) => {
    set_status("",false);
    toastr.info('Success');
    update_project_info();
  }).catch ( (e) => {
    toastr.error('Failed, see logs')
    console.log(e);
    add_log("failed "+e);
    set_status("",false);
    alert("Operation failed");
  })

}

function errcode_2_str(_errCode) {
  return "Error "+  _errCode;
}

function add_member() {

  var memberName = prompt("Member name?")
  if (memberName == null) return;
  var memberAddress = prompt("Member address?")
  if (memberAddress == null) return;

  taskCrowd.addMember.call(memberAddress, memberName)
  .then ( (_errCode) => {
    if (_errCode != 0) {
       toastr.error("Failed" + errcode_2_str(_errCode));
       return;
    }    
    do_transaction(taskCrowd.addMember(memberAddress, memberName))
  })
}

function approve_member(_addr) {

  taskCrowd.approveMember.call(_addr)
  .then ( (_errCode) => {
    if (_errCode != 0) {
       toastr.error("Failed" + errcode_2_str(_errCode));
       return;
    }    
    do_transaction(taskCrowd.approveMember(_addr));
  })

}

function add_task() {

  var taskId = prompt("New task id?")
  if (taskId == null) return;
  var member = prompt("Member address?")
  if (member == null) return;
  var description = prompt("Description?")
  if (description == null) return;
  var maxWorkload = prompt("Max workload?")
  if (maxWorkload == null) return;

  taskCrowd.addTask.call(member,taskId,description,maxWorkload)
  .then ( (_errCode) => {
    if (_errCode != 0) {
       toastr.error("Failed" + errcode_2_str(_errCode));
       return;
    }    
    do_transaction(taskCrowd.addTask(member,taskId,description,maxWorkload))
  })

}

function finish_task(_taskId) {

  var finalWorkload = prompt("FinalWorkload?")
  if (finalWorkload == null) return;

  taskCrowd.finishTask.call(_taskId,finalWorkload)
  .then ( (_errCode) => {
    if (_errCode != 0) {
       toastr.error("Failed" + errcode_2_str(_errCode));
       return;
    }    
    do_transaction(taskCrowd.finishTask(_taskId,finalWorkload))
  })

}

function approve_task(_taskId) {

  taskCrowd.approveTask.call(_taskId)
  .then ( (_errCode) => {
    if (_errCode != 0) {
       toastr.error("Failed" + errcode_2_str(_errCode));
       return;
    }    
    do_transaction(taskCrowd.approveTask(_taskId))
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

       members.sort((a, b)=>{return a.name.localeCompare(b.name)});

       set_member_icon(account,$("#currentMember")[0])
       $("#addMemberBtn").prop("disabled",!is_account_member());
       $("#addTaskBtn").prop("disabled",!is_account_member());

       var table = document.getElementById("members");

       remove_table_rows(table)

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
            if (members[i].approver1 != account && is_account_member() )
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

            tasks.push(task);
          })
          promises.push(promise);
        }
        return Promise.all(promises);

     }).then( () => {

       tasks.sort((a, b)=>{return a.taskId-b.taskId});

       var table = document.getElementById("tasks");

       remove_table_rows(table)

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
              console.log(account+"=="+tasks[i].member)
              if (account==tasks[i].member)
                cellActions.innerHTML = "<button onclick='finish_task("+tasks[i].taskId+")'>Finish</button>";
              break;
            case 1:
              if (account!=tasks[i].member && is_account_member())
                cellActions.innerHTML = "<button onclick='approve_task("+tasks[i].taskId+")'>Approve</button>";
              break;
            case 2:
              if (account!=tasks[i].member && account!=tasks[i].approver1 && is_account_member())
                cellActions.innerHTML = "<button onclick='approve_task("+tasks[i].taskId+")'>Approve</button>";
              break;
          }

       }
       add_log("done");


    }).catch( (e) => {
      add_log("Error getting info "+e);
    });

}

window.onload = function() {

  toastr.options.timeOut = 4000;

/*
  TaskCrowd.deployed()
  .then( _taskCrowd => {
    taskCrowd = _taskCrowd;
    return taskCrowd.name();
  }).then ( _name => {

*/    
  taskCrowd = TaskCrowd.at("0x7b6b01d2a669d602c87d5b453c2ed9115daddbb7");
  taskCrowd.name()
  .then ( _name => {

    document.getElementById("taskCrowdName").innerHTML = _name +" Task Crowd ";

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

       refresh_current_account();

    })

  });

  $("#addMemberBtn").click( () => { add_member(); })
  $("#addTaskBtn").click( () => { add_task(); })

}
