pragma solidity ^0.4.8;

import "./Pausable.sol";

contract ContractBase is Pausable {
	
  event LogError(uint16 errno);

  function logError(
    uint16 errNo
  ) internal returns (uint16)
  {
    LogError(errNo);
    return errNo;
  }

}
