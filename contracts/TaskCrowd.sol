pragma solidity ^0.4.8;

contract TaskCrowd {

   // State machines  --------------------------------------------------------

   enum TaskStatus {
     Doing,
     Finished,
     Approving,
     Approved
   }

   // Logs  ------------------------------------------------------------------

   event LogError(address sender, uint16 errno);
   event LogMemberAdded(address member);
   event LogMemberApproved(address member);
   event LogTaskAdded(uint16 taskId);
   event LogTaskFinished(uint16 taskId);
   event LogTaskApproving(uint16 taskId);
   event LogTaskApproved(uint16 taskId);

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
    LogError(msg.sender,errNo);
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
        
        members.push( Member({
            addr      : _member2,
            name      : _memberName2,
            approver1 : _member2,
            approver2 : _member1
        }));
        membersIndex[_member2] = members.length;
  }

  function addMember(
    address _member,
    string _name
  ) onlyMembers() external returns (uint16) 
  {
      if (membersIndex[_member] != 0) return logError(101);
      
        members.push( Member({
            addr      : _member,
            name      : _name,
            approver1 : msg.sender,
            approver2 : 0
        }));
        membersIndex[_member] = members.length;
        LogMemberAdded(_member);
  }

  function approveMember(
    address _member
  ) onlyMembers() external returns (uint16) 
  {
      if (membersIndex[_member] == 0) return logError(201);
      var member = members[membersIndex[_member]-1];

      if (member.approver1 == 0) return logError(202);
      if (member.approver1 == msg.sender) return logError(203);
      if (member.approver2 != 0) return logError(204);
      
      member.approver2 = msg.sender;
      
      LogMemberApproved(_member);
  }

  function addTask(
     address _member,
     uint16  _taskId,
     string  _description,
     uint8   _maxWorkload
  )  onlyMembers() external returns (uint16) {

        if (msg.sender == _member) return logError(301);
        if (membersIndex[_member] == 0) return logError(306);
        if (tasksIndex[_taskId] != 0 ) return logError(302);

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
        
        LogTaskAdded(_taskId);
  }
  
  function finishTask(
     uint16   _taskId,
     uint8    _finalWorkload
  ) external returns (uint16)  {

       if (tasksIndex[_taskId] == 0 ) return logError(401);
       var task = tasks[tasksIndex[_taskId]-1];
       
       if (task.status != TaskStatus.Doing) return logError(402);
       if (task.member != msg.sender) return logError(403);

       if (_finalWorkload > task.maxWorkload) return logError(404);
       
       task.finalWorkload = _finalWorkload;
       task.status = TaskStatus.Finished;
       
       LogTaskFinished(_taskId);
       
  }
  
  function approveTask(
    uint16 _taskId
  ) onlyMembers() external returns (uint16) 
  {
    
    if (tasksIndex[_taskId] == 0 )  return logError(501);
    Task storage task = tasks[tasksIndex[_taskId]-1];
    if (task.member == msg.sender)  return logError(502);

    if (task.status == TaskStatus.Finished) {
      task.status = TaskStatus.Approving;
      task.approver1 = msg.sender;
      LogTaskApproving(_taskId);
      return;
    }

    if (task.status == TaskStatus.Approving) {
       if (task.approver1 == msg.sender) return logError(503);
       task.approver2 = msg.sender;
       task.status = TaskStatus.Approved;
       LogTaskApproved(_taskId);
       return;
    }

    return logError(504);

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
