pragma solidity ^0.4.8;

import "./ContractBase.sol";

contract ShaphakDelegates is ContractBase {
    
    uint8 constant MAXDELEGATION = 8;
    
    struct Voter {
        bool    exists;
        bool    availableAsDelegate;
        address voteDelegatedTo;
    }

    uint                     public lockedUntil;
    mapping (address=>Voter) public voters;
    address[]                public votersAddr;
    
    function register(address addr) internal returns (Voter storage) {
        Voter voter = voters[addr];
        if (!voter.exists) {

            voter.exists = true;
            voter.availableAsDelegate = false;
            voter.voteDelegatedTo = 0;

            votersAddr.push(msg.sender);
            voters[msg.sender] = voter;
            
        }
        return voter;
    } 
    
    function availableAsDelegate(bool yes) stopInEmergency {

        if (now < lockedUntil) throw;

        Voter voter = register(msg.sender);
        voter.availableAsDelegate = yes;
    }
    
    function delegateVoteTo(address to) stopInEmergency {
        
        if (now < lockedUntil) throw;

        if (to != 0) {
            Voter voter = voters[to];
            if (!voter.exists) throw;
            if (!voter.availableAsDelegate) throw;
        }
        
        voter = register(msg.sender);
        voter.voteDelegatedTo = to;
    }
    
    function byAddr(address voterAddress) constant returns (bool, bool, address) {
        Voter voter = voters[voterAddress];
        return (voter.exists, voter.availableAsDelegate,voter.voteDelegatedTo);
    }
    
    function count() constant returns (uint) {
        return votersAddr.length;
        
    }

    function byPos(uint index) constant returns (address) {
        return votersAddr[index];
    }
     
    function lastDelegatedOf(address _voterAddress) constant returns (address) {

        address voterAddress = _voterAddress;
        Voter voter = voters[voterAddress];
        
        uint hooplimit = MAXDELEGATION;
        while (voter.voteDelegatedTo  != 0
              && voter.voteDelegatedTo!= _voterAddress
              && hooplimit > 0) {
                  
            voterAddress = voter.voteDelegatedTo;
            voter = voters[voter.voteDelegatedTo];
    
            hooplimit--;
        }
        
        if (voter.voteDelegatedTo != 0 ) {
            return 0;
        }

        return voterAddress;        
    }
    
}
