# Betting system using an Ethereum Smart Contract

_!!!disclaimer!!!_ do not use this in production! This is my first attempt at writing a Smart Contract...

## Before running this project

Make sure you have Node and Truffle installed. Next in the root of the project do:

```
npm install
```

## Running this project

Start the Truffle develop console:

```
truffle develop
```

Next run the migrations to deploy the Bet contract

```
migrate
```

Finally run the test script

```
exec ./scripts/Bet/run.js
```

The test script will simulate three voters competing agains each other. 

## Testing

To run the unit tests do:

```
truffle test ./test/Bet.js
```
