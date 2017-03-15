pragma solidity ^0.4.8;

import "./TaskCrowd.sol";

contract TaskCrowdFactory {

	event LogCreated(address addr);

    function create(
       string  _name,
       uint8   _rate,
       address _member1,
	   string  _member1Name,
	   address _member2,
	   string  _member2Name
	) returns (TaskCrowd)
	{
	    TaskCrowd taskCrowd = new TaskCrowd(
	    	_name,
	    	_rate,
	    	_member1,_member1Name,
	    	_member2,_member2Name
	    );
	    
	    LogCreated(taskCrowd);
	    
	    return taskCrowd;
	}

}
