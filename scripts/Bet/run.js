const artifacts = require("../../build/contracts/Bet.json");
const contract = require("truffle-contract");
const Bet = contract(artifacts);
Bet.setProvider(web3.currentProvider);
Bet.defaults({gas: 1000000});

console.log(web3);

let betContract;

let ownerAddress = "0x627306090abab3a6e1400e9345bc60c78a8bef57";

let voters = [
    {
        address: "0xf17f52151ebef6c7334fad080c5704d77216b732",
        hashedVote: null,
        guess: 1,
        bet: web3.utils.toWei(0.5, "ether")
    },
    {
        address: "0xc5fdf4076b8f3a5357c5e395ab970b5b54098fef",
        hashedVote: null,
        guess: 5,
        bet: web3.utils.toWei(0.3, "ether")
    },
    {
        address: "0x821aea9a577a9b44299b9c15c88cf3087f3b5544",
        hashedVote: null,
        guess: 10,
        bet: web3.utils.toWei(1.0, "ether")
    }
];

module.exports = function(callback) {
    Bet.deployed().then((contract) => {
        betContract = contract;
    }).then(
        () => {
            // Start a new vote
            console.log("Start new vote...");
            return startNewVote();
        }
    ).then(
        () => {
            // Set hashed vote value for each voter
            console.log("Calculate hashed votes...");
            return calculateHashedVotes();
        }
    ).then(
        () => {
            // Cast the hased vote for each voter
            console.log("Cast hashed votes...");
            return castHashedVotes();
        }
    ).then(
        () => {
            // Show bets
            console.log("Show bets...");
            return showBets();
        }
    ).then(
        () => {
            // Lock the voting
            console.log("Lock voting...");
            return lockVotes();
        }
    ).then(
        () => {
            // Cast actual vote
            console.log("Cast actual votes...");
            return castVotes();
        }
    ).then(
        () => {
            // Finish voting
            console.log("Finish voting...");
            return finishVote();
        }
    ).then(
        () => {
            // Show winners
            return showWinners();
        }
    ).then(
        () => callback(),
        (error) => callback(error)
    );
}

function startNewVote() {
    return betContract.startNewVote({from: ownerAddress});
}

function lockVotes() {
    return betContract.lockVotes({from: ownerAddress});
}

function finishVote() {
    return betContract.finishVote({from: ownerAddress});
}

function showWinners() {
    return betContract.getWinners().then(
        (winners) => {
            console.log("---- WINNERS ----");
            for(let winner of winners) {
                console.log(winner);
            }
        }
    )
}

function showBets() {
    return betContract.getBets().then(
        (bets) => {
            console.log("---- BETS ----");
            for(let bet of bets) {
                console.log(bet);
            }
        }
    );
}

/**
 * Cast the actual vote for every voter.
 */
function castVotes() {
    let promises = [];

    for(let voter of voters) {
        promises.push(castVote(voter));
    }

    return Promise.all(promises);
}
/**
 * Cast the actual vote for the given voter.
 */
function castVote(voter) {
    return betContract.castVote(voter.guess, {from: voter.address});
}

/**
 * Cast the hashed vote for every voter.
 */
function castHashedVotes() {
    let promises = [];

    for(let voter of voters) {
        promises.push(castHashedVote(voter));
    }

    return Promise.all(promises);
}
/**
 * Cast the hashed vote for the given voter.
 * @param {Object} voter 
 */
function castHashedVote(voter) {
    return betContract.castHashedVote(voter.hashedVote, {from: voter.address, gas: voter.bet});
}

/**
 * Calculates the hashed vote value for each voter
 */
function calculateHashedVotes() {
    let promises = [];

    for(let voter of voters) {
        promises.push(calculateHashedVote(voter));
    }

    return Promise.all(promises);
}
/**
 * Calculates and sets the hashed vote value for the given voter.
 * @param {Object} voter 
 */
function calculateHashedVote(voter) {
    return betContract.getHash(voter.guess).then(
        (result) => voter.hashedVote = result
    );
}
