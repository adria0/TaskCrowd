pragma solidity ^0.4.8;

import "./ShaphakDelegates.sol";
import "./ShaphakCensusI.sol";
import "./ContractBase.sol";

contract ShaphakPoll is ContractBase {

    event LogVoteDelegateNotCount(address indexed voter);

    enum Epoch {
        NOTSTARTED,
        DELEGATESVOTING,
        DIRECTVOTING,
        COUNTING,
        FINISHED
    }

    struct Voter {
        bool    exists;
        uint8   vote;
    }

    // -- contract constrution 
    string[]                  public options;
    uint                      public startDate;
    uint                      public delegatesEndDate;
    uint                      public directEndDate;
    ShaphakDelegates          public delegations;
    ShaphakCensusI            public census;
    
    // -- state mappings
    mapping (address=>Voter)   public voters;
    address[]                  public votersAddr;
    uint                       public voteCollectIndex;
    mapping (uint8=>uint32)    public count;
    
    modifier assertEpoch1(Epoch e1) {
        Epoch epoch = getEpoch();
        if (epoch != e1) throw;
        _;
    }
    modifier assertEpoch2(Epoch e1, Epoch e2) {
        Epoch epoch = getEpoch();
        if (epoch != e1 && epoch != e2) throw;
        _;
    }

    modifier assertInCensus(address addr) {
        if (!census.shaphakCanVote(addr,this)) throw;
        _;
    }
    
    function ShaphakPoll(
        uint             startDate_,
        uint             delegatesEndDate_,
        uint             directEndDate_,
        ShaphakDelegates delegations_,
        ShaphakCensusI   census_
        ) {
            
        startDate = startDate_;
        delegatesEndDate = delegatesEndDate_;
        directEndDate = directEndDate_;
        delegations = delegations_;
        census = census_;
    }
    
    function addChoice(string choice)
    assertEpoch1(Epoch.NOTSTARTED)
    {
        options.push(choice);
    }
    
    function getEpoch() constant returns (Epoch) {
        if (now < startDate) return Epoch.NOTSTARTED;
        if (now < delegatesEndDate ) return Epoch.DELEGATESVOTING;
        if (now < directEndDate ) return Epoch.DIRECTVOTING;
        if (voteCollectIndex < votersAddr.length + delegations.count() - 1)
           return Epoch.COUNTING;
        
        return Epoch.FINISHED;
    } 

    function vote(uint8 choice)
    assertEpoch2(Epoch.DELEGATESVOTING,Epoch.DIRECTVOTING)
    assertInCensus(msg.sender)
    {
        if ( choice >= options.length ) throw;

        var (exists, availableAsDelegate, voteDelegatedTo)
          = delegations.byAddr(msg.sender);
        
        if (availableAsDelegate && getEpoch() == Epoch.DIRECTVOTING) {
            throw;
        }

        Voter voter = voters[msg.sender];
        if (!voter.exists) {
            voter.exists = true;
            votersAddr.push(msg.sender);
            voters[msg.sender] = voter;
        }
        voter.vote = choice;
    }

    // first loop is in the delegated votes
    function count()
    assertEpoch1(Epoch.COUNTING)
    {
        uint delegationsVoterCount = delegations.count();
        
        // loop into delegated votes repository, then check if the last delegate for
        //   the vote voted for an option.
        if (voteCollectIndex < delegationsVoterCount) {
    
            address delegatedVoter = delegations.byPos(voteCollectIndex);
            address delegatedToVoter = delegations.lastDelegatedOf(delegatedVoter);
            Voter voter1 = voters[delegatedToVoter];
            if (voter1.exists) {
                count[voter1.vote]++;
            } else {
                LogVoteDelegateNotCount(delegatedVoter);
            }
            voteCollectIndex++;
            return;

        }
        
        // check for votes that does not exist delegated repository
        if (voteCollectIndex < delegationsVoterCount + votersAddr.length ) {
            
            address voterAddr = votersAddr[voteCollectIndex - votersAddr.length];
            var (exists, availableAsDelegate, voteDelegatedTo)
              = delegations.byAddr(msg.sender);
            
            if (!exists) {
                Voter voter2 = voters[voterAddr];
                count[voter2.vote]++;
            }
            voteCollectIndex++;
            return;
        }

    }
    
}
