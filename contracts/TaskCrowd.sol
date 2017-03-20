pragma solidity ^0.4.8;

contract TaskCrowd {

   // Constants --------------------------------------------------------------

  uint16 constant ERRNONE                = 0;
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

   event LogError(uint16 errno);
   event LogMemberAction(string msg, address member);
   event LogTaskAction(string msg, uint16 taskId);


   // Construction parameters  -----------------------------------------------

   string  public name;
   address public superseded;
   uint8   public rate; // rate per hour


   // State variables --------------------------------------------------------

   struct Member {
       address            addr;
       string             name;
       address            approver1;
       address            approver2;
   }

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

   Member[] public members;
   mapping ( address => uint ) membersIndex;

   Task[] public tasks;
   mapping ( uint16 => uint ) tasksIndex;


  // Modifiers --------------------------------------------------------------

   modifier onlyMembers() {
       if (!isMemberEnrolled(msg.sender)) throw;
       _;
   }


   // The code ---------------------------------------------------------------
 
  function logError(
    uint16 errNo
  ) internal returns (uint16)
  {
    LogError(errNo);
    return errNo;
  }

  function TaskCrowd(
     string  _name,
     uint8   _rate,
     address _member1,
     string  _memberName1,
     address _member2,
     string  _memberName2
     ) {

        name = _name;
        rate = _rate;

        members.push( Member({
            addr      : _member1,
            name      : _memberName1,
            approver1 : _member1,
            approver2 : _member2
        }));
        membersIndex[_member1] = members.length;
        LogMemberAction("member-added",_member1);

        members.push( Member({
            addr      : _member2,
            name      : _memberName2,
            approver1 : _member2,
            approver2 : _member1
        }));
        membersIndex[_member2] = members.length;
        LogMemberAction("member-added",_member2);
  }

  function addMember(
    address _member,
    string _name
  ) onlyMembers() returns (uint16) 
  {
      if (membersIndex[_member] != 0)
        return logError(ERRMEMBERALREADYEXISTS);
      
        members.push( Member({
            addr      : _member,
            name      : _name,
            approver1 : msg.sender,
            approver2 : 0
        }));
        membersIndex[_member] = members.length;
        LogMemberAction("member-added",_member);
        return ERRNONE;
  }

  function approveMember(
    address _member
  ) onlyMembers() external returns (uint16) 
  {
      if (membersIndex[_member] == 0) return logError(ERRMEMBERNOTEXISTS);
      var member = members[membersIndex[_member]-1];

      if (member.approver1 == 0) return logError(ERRINVALIDSTATE);
      if (member.approver2 != 0) return logError(ERRINVALIDSTATE);

      if (member.approver1 == msg.sender) return logError(ERRINVALIDCALLER);
      
      member.approver2 = msg.sender;
      
      LogMemberAction("member-approved",_member);
      return ERRNONE;
  }

  function addTask(
     address _member,
     uint16  _taskId,
     string  _description,
     uint8   _maxWorkload
  )  onlyMembers() external returns (uint16) {

        if (msg.sender == _member) return logError(ERRINVALIDCALLER);
        if (membersIndex[_member] == 0) return logError(ERRMEMBERNOTEXISTS);
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

  function isMemberEnrolled(address addr) constant returns (bool) {
    if (membersIndex[addr] == 0) return false;
    if (members[membersIndex[addr]-1].approver2 == 0) return false;
    return true;
  }

  // Web3 helpers  ---------------------------------------------------------------

  function getMemberCount() external constant returns (uint) {
    return members.length;
  }

  function getMemberAtPos(uint pos) constant
  returns (address addr, string name, address approver1, address approver2) {
    addr = members[pos].addr;
    name = members[pos].name;
    approver1 = members[pos].approver1;
    approver2 = members[pos].approver2;
  }

  function getMemberAtAddr(address addr) constant returns (uint) {
    return membersIndex[addr];
  }

  function getTaskCount() external constant returns (uint) {
    return tasks.length;
  }

}
