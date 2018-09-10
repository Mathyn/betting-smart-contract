const Bet = artifacts.require("Bet");

contract("Bet", async (accounts) => {
    let instance = null;
    let ownerAddress = accounts[0];

    beforeEach(async () => {
        instance = await Bet.deployed();
    });

    it("should be able to start a new vote as the owner", async () => {
        await instance.startNewVote();
    });

    it("should not be able to start a new vote as a non-owner", async () => {
        let exceptionRaised = true;
        try {
            await instance.startNewVote({from: accounts[1]});
            exceptionRaised = false;
        }
        catch(ex) {
            expect(ex.toString()).to.equal("Error: VM Exception while processing transaction: revert");
        }

        expect(exceptionRaised, "An exception should have been raised").to.be.true;
    });

    it("should update the answer and phase correctly when starting a new vote", async () => {
        await instance.startNewVote();

        let phase = await instance.getPhase();
        let answer = await instance.getAnswer();

        expect(phase.toString()).to.equal("0");
        expect(answer.toString()).to.equal("-1");
    });

    it("should be able to lock the votes as the owner", async () => {
        await instance.lockVotes();
    });

    it("should not be able to lock the votes as a non-owner", async () => {
        let exceptionRaised = true;
        try {
            await instance.lockVotes({from: accounts[1]});
            exceptionRaised = false;
        }
        catch(ex) {
            expect(ex.toString()).to.equal("Error: VM Exception while processing transaction: revert");
        }

        expect(exceptionRaised, "An exception should have been raised").to.be.true;
    });

    it("should update the answer and phase correctly when locking the votes", async () => {
        await instance.lockVotes();

        let phase = await instance.getPhase();
        let answer = await instance.getAnswer();

        expect(phase.toString()).to.equal("1");
        expect(answer.toString()).to.not.equal("-1");
    });

    it("should be able to finish the vote as the owner", async () => {
        await instance.finishVote();
    });

    it("should not be able to finish the vote as a non-owner", async () => {
        let exceptionRaised = true;
        try {
            await instance.finishVote({from: accounts[1]});
            exceptionRaised = false;
        }
        catch(ex) {
            expect(ex.toString()).to.equal("Error: VM Exception while processing transaction: revert");
        }

        expect(exceptionRaised, "An exception should have been raised").to.be.true;
    });

    it("should update the phase correctly when finishing the vote", async () => {
        await instance.finishVote();

        let phase = await instance.getPhase();

        expect(phase.toString()).to.equal("2");
    });
});