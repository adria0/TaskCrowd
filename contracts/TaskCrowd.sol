pragma solidity ^0.4.8;

import "./ContractBase.sol";
import "./Directory.sol";

contract TaskCrowd is ContractBase {

   // Constants --------------------------------------------------------------

  uint16 constant ERRNONE                = 0;
  uint16 constant ERRBASE                = 0;
  uint16 constant ERRMEMBERALREADYEXISTS = 1;
  uint16 constant ERRMEMBERNOTEXISTS     = 2;
  uint16 constant ERRINVALIDSTATE        = 3;
  uint16 constant ERRINVALIDCALLER       = 4;
  uint16 constant ERRTASKALREADYEXISTS   = 5;
  uint16 constant ERRTASKNOTEXISTS       = 6;
  uint16 constant ERRINVALIDWORKLOAD     = 7;

   // State machines  --------------------------------------------------------

   enum TaskStatus {
     Doing,
     Finished,
     Approving,
     Approved
   }


   // Logs  ------------------------------------------------------------------

   event LogTaskAction(string msg, uint16 taskId);

   // Construction parameters  -----------------------------------------------

   string    public name;
   Directory public directory;

   // State variables --------------------------------------------------------

   struct Task {
       TaskStatus         status;
       address            member;
       string             description;
       uint               date;
       uint16             taskId;
       uint8              maxWorkload;
       uint8              finalWorkload;
       address            approver1;
       address            approver2;
   }

   Task[] public tasks;
   mapping ( uint16 => uint ) tasksIndex;

  // Modifiers --------------------------------------------------------------

   modifier onlyMembers() {
       if (!directory.isMemberEnrolled(msg.sender)) throw;
       _;
   }


   // The code ---------------------------------------------------------------
 

  function TaskCrowd(
     string  _name,
     Directory _directory
     ) {

     name = _name;
     directory = _directory;
  }


  function addTask(
     address _member,
     uint16  _taskId,
     string  _description,
     uint8   _maxWorkload
  )  onlyMembers() external returns (uint16) {

        if (msg.sender == _member) return logError(ERRINVALIDCALLER);
        if (!directory.isMemberEnrolled(_member)) return logError(ERRMEMBERNOTEXISTS);
        if (tasksIndex[_taskId] != 0 ) return logError(ERRTASKALREADYEXISTS);

        tasks.push( Task({
           status        : TaskStatus.Doing,
           member        : _member,
           description   : _description,
           date          : now,
           taskId        : _taskId,
           maxWorkload   : _maxWorkload,
           finalWorkload : 0,
           approver1     : 0,
           approver2     : 0
        }));

        tasksIndex[_taskId] = tasks.length;
        
        LogTaskAction("task-added",_taskId);
        return ERRNONE;
  }
  
  function finishTask(
     uint16   _taskId,
     uint8    _finalWorkload
  ) external returns (uint16)  {

       if (tasksIndex[_taskId] == 0 ) return logError(ERRTASKNOTEXISTS);
       var task = tasks[tasksIndex[_taskId]-1];
       
       if (task.status != TaskStatus.Doing) return logError(ERRINVALIDSTATE);
       if (task.member != msg.sender) return logError(ERRINVALIDCALLER);

       if (_finalWorkload > task.maxWorkload) return logError(ERRINVALIDWORKLOAD);
       
       task.finalWorkload = _finalWorkload;
       task.status = TaskStatus.Finished;
       
       LogTaskAction("task-finished",_taskId);
       return ERRNONE;
       
  }
  
  function approveTask(
    uint16 _taskId
  ) onlyMembers() external returns (uint16) 
  {
    
    if (tasksIndex[_taskId] == 0 )  return logError(ERRTASKNOTEXISTS);
    Task storage task = tasks[tasksIndex[_taskId]-1];
    if (task.member == msg.sender)  return logError(ERRINVALIDCALLER);

    if (task.status == TaskStatus.Finished) {
      task.status = TaskStatus.Approving;
      task.approver1 = msg.sender;
      LogTaskAction("task-approving",_taskId);
      return ERRNONE;
    }

    if (task.status == TaskStatus.Approving) {
       if (task.approver1 == msg.sender) return logError(ERRINVALIDCALLER);
       task.approver2 = msg.sender;
       task.status = TaskStatus.Approved;
       LogTaskAction("task-approved",_taskId);
       return ERRNONE;
    }

    return logError(ERRINVALIDSTATE);

  }


  function getTaskCount() external constant returns (uint) {
    return tasks.length;
  }

}
