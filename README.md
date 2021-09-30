# Grindery Pay

## Smart Contracts

See `/contracts` directory

We’ve built a smart contract wallet along with a trust-less protocol that allows relayers and reward miners to facilitate: 

- Auto swapping of received assets into a token of the user's preference on Harmony (e.g UST on Harmony)

- Bridging of ETH to Harmony and then auto-swapping it into the user's preferred token on Harmony

- Swapping and bridging user's preferred token to Ethereum to facilitate easy off ramps to FIAT via ETH exchanges 

- Bridging ETH to and from Ethereum  of received assets into a stable coins (UST on Harmony by default) of the user’s preference.

- Bridging UST from Harmony to Terra

1. `/contracts/GrinderyWalletHarmonyTest.sol`
Harmony smart wallet with support for initiation of trust-less swapping and bridging of held assets

2. `/contracts/GrinderyWalletEth.sol`
Ethereum smart wallet with support for initiation of trust-less bridging of ETH and ERC20 tokens to Harmony

3. `/contracts/GrinderySwap.sol`
Swap protocol contract that allows relayers and reward miners to trust-lessly facilitate swapping of assets for smart wallets.

4. `/contracts/GrinderyTreasury.sol`
Treasury wallet for swap and bridge protocol, will reward relayers and reward miners in the future


## Chrome Extension
See `/src` and `/public` directories

User Interface that allows users to create smart wallets, fund them, withdraw and send batch transfers/payouts