pragma solidity ^0.4.8;

import "./ContractBase.sol";
import "./ShaphakCensusI.sol";

contract Directory is ContractBase, ShaphakCensusI {

   uint16 constant ERRNONE                = 0;
   uint16 constant ERRBASE                = 1000;
   uint16 constant ERRMEMBERALREADYEXISTS = ERRBASE+1;
   uint16 constant ERRMEMBERNOTEXISTS     = ERRBASE+2;
   uint16 constant ERRINVALIDSTATE        = ERRBASE+3;
   uint16 constant ERRINVALIDCALLER       = ERRBASE+4;

   event LogDirectoryAction(string msg, address member);

   struct Member {
       address            addr;
       string             name;
       address            approver1;
       address            approver2;
   }

   Member[] public members;
   mapping ( address => uint ) membersIndex;

   function addMemberPriv
   (
     address _member,
     string _name,
     address _approver1,
     address _approver2
   ) onlyOwner() returns (uint16)
   {
      if (membersIndex[_member] != 0)
        return logError(ERRMEMBERALREADYEXISTS);
      
        members.push( Member({
            addr      : _member,
            name      : _name,
            approver1 : _approver1,
            approver2 : _approver2
        }));
        membersIndex[_member] = members.length;
        LogDirectoryAction("member-added",_member);
        return ERRNONE;   	
   }

   modifier onlyMembers() {
       if (!isMemberEnrolled(msg.sender)) throw;
       _;
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
        LogDirectoryAction("member-added",_member);
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
      
      LogDirectoryAction("member-approved",_member);
      return ERRNONE;
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

}
