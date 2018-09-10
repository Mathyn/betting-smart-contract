pragma solidity 0.4.24;

contract Bet {
    enum BettingPhase {
        PreVote,
        Vote,
        Complete
    }
    
    // The cast votes in hashed form
    mapping(address => bytes32) public castHashedVotes;
    // The cast votes in non-hashed form
    mapping(address => int) public castVotes;
    // Mapping containing true if someone is a voter
    mapping(address => bool) private knownVoters;
    // Mapping containing a hashed vote (to prevent two people voting on the same number)
    mapping(bytes32 => bool) private knownVotes;
    // The bet in ETH per voter.
    mapping(address => uint) private bets;
    // Stores rewards for each player. It is up to the player to claim these rewards.
    mapping(address => uint) private rewards;
    
    address[] private voters;
    
    BettingPhase private phase = BettingPhase.PreVote;
    
    // The answer. Only when the betting phase is Vote or Complete will this contain any meaningful value.
    int public answer;
    
    // The winner of the vote
    address[] public winners;
    
    // Owner of the contract e.g. the one who deployed it
    address private owner;
    
    constructor() public {
        owner = msg.sender;
    }
    
    modifier isPhase(BettingPhase requiredPhase) {
        require(phase == requiredPhase, "Not correct phase");
        _;
    }
    
    modifier isUniqueVote(bytes32 vote) {
        require(!knownVotes[vote], "Someone already cast this vote");
        _;
    }
    
    modifier isOwner() {
        require(msg.sender == owner, "Only contract owner can do this");
        _;
    }
    
    modifier isVoter() {
        require(knownVoters[msg.sender], "Only voters can do this");
        _;
    }
    
    modifier isNotVoter() {
        require(!knownVoters[msg.sender], "Only non voters can do this");
        _;
    }
    
    // Cast a hashed vote. The hashed vote 'locks down' the non-hashed vote the user is going to
    // cast at a later time. Effectively this prevents cheating when the answer is known.
    function castHashedVote(bytes32 voteHash) public payable isPhase(BettingPhase.PreVote) isNotVoter isUniqueVote(voteHash) {
        require(msg.value > 0.1 ether, "At least 0.1 Ether is expected");
        castHashedVotes[msg.sender] = voteHash;
        knownVoters[msg.sender] = true;
        bets[msg.sender] = msg.value;
        voters.push(msg.sender);
    }

    function getHash(int guess) public pure returns(bytes32) {
        return keccak256(abi.encodePacked(guess));
    }
    
    // Cast the actual vote. 
    function castVote(int guess) public isPhase(BettingPhase.Vote) isVoter {
        // Require the cast vote to equal the original hash of the vote
        require(castHashedVotes[msg.sender] == keccak256(abi.encodePacked(guess)), "Vote cannot differ from initial vote");
        
        castVotes[msg.sender] = guess;
    }
    
    function startNewVote() public isOwner {
        phase = BettingPhase.PreVote;
        answer = -1;
        clearPreviousVoterData();
    }
    
    function lockVotes() public isOwner {
        phase = BettingPhase.Vote;
        answer = 4; // Fair dice roll :D
    }
    
    function finishVote() public isOwner {
        phase = BettingPhase.Complete;
        
        markWinners(getClosestVoteDifference());
    }
    
    function clearPreviousVoterData() internal {
        for(uint i = 0; i < voters.length; i++) {
            address voter = voters[i];
            
            bytes32 castHashedVote = castHashedVotes[voter];
            
            delete knownVotes[castHashedVote];
            delete castHashedVotes[voter];
            delete castVotes[voter];
            delete knownVoters[voter];
            delete bets[voter];
        }
        
        voters = new address[](0);
    }
    
    function getClosestVoteDifference() internal view returns(int) {
        // Calculate shortest path to winner
        int closestVote = -1;
        
        for(uint i = 0; i < voters.length; i++) {
            address voter = voters[i];
            
            int vote = castVotes[voter];
            
            // Calculate absolute value of vote - answer
            int diff = vote - answer;
            if(diff < 0)
                diff = -diff;
                
            // No value registered or difference is lower than lowest known difference?
            if(closestVote == -1 || diff < closestVote)
                closestVote = diff;
        }
        
        return closestVote;
    }
    
    function markWinners(int closestVoteDifference) internal {
        // Now find the voters which match the closest guess
        winners = new address[](0);
        for(uint j = 0; j < voters.length; j++) {
            address voter = voters[j];
            
            int vote = castVotes[voter];
            
            // Calculate absolute value of vote - answer
            int diff = vote - answer;
            if(diff < 0)
                diff = -diff;
                
            if(diff == closestVoteDifference) {
                winners.push(voter);
            }
        }

        // Dispense rewards
        uint[] memory bets_ = getBets();
        uint totalBet = 0;
        for(uint i = 0; i < bets_.length; i++) {
            totalBet += bets_[i];
        }

        for(uint k = 0; k < winners.length; k++) {
            address winner = winners[i];

            uint bet = bets[winner];

            uint betShare = bet + (bet / totalBet); // This does not work!

            rewards[winner] += betShare;
        }
    }

    // Returns the current answer. If the answer is still undetermined
    // a value of -1 will be returned.
    function getAnswer() public view returns(int answer_) {
        return answer;
    }

    // Returns the current betting phase.
    function getPhase() public view returns(BettingPhase phase_) {
        return phase;
    }

    // Returns the current reward for the given player.
    function getReward(address player) public view returns(uint reward) {
        return rewards[player];
    }

    // Claims the reward for the given player. This will send the complete reward to the player.
    function claimReward(address player) public {
        uint reward = rewards[player];
        rewards[player] = 0;
        player.transfer(reward);
    }

    function getBets() public view returns(uint[] bets_) {
        bets_ = new uint[](voters.length);

        for(uint i = 0; i < voters.length; i++) {
            address voter = voters[i];

            bets_[i] = bets[voter];
        }

        return bets_;
    }
    
    function getVoters() public view returns(address[]) {
        return voters;
    }
    
    function getWinners() public view isPhase(BettingPhase.Complete) returns(address[]) {
        return winners;
    }
}