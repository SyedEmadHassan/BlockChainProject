# CampusGear

A Solidity + HTML/CSS/JavaScript DApp for lending campus equipment. Students borrow available equipment for seven days, request a return, and wait for an administrator to confirm physical receipt. MetaMask signs transactions; Ethers.js reads the contract and sends transactions. No database or backend application is required. The included Node server only serves static files.

## What is implemented

- Administrator-only registration and return confirmation.
- Student borrowing, return requests, and a fixed seven-day deadline.
- Contract validation for IDs, names, permissions, and state transitions.
- Events recording each lifecycle action and the previous borrower on return.
- Wallet connection, account/network change handling, transaction status/hash, role-specific UI, equipment filters and overdue display.



## Files

| File | Purpose |
| --- | --- |
| `CampusGear.sol` | Smart contract |
| `index.html` | Interface |
| `style.css` | Styling |
| `app.js` | MetaMask/Ethers integration |
| `abi.js` | Generated contract ABI;|

## 1. Install and check locally

Install Node.js (version 20 or newer) and the MetaMask browser extension. Extract the ZIP, open a terminal in the `campusgear` folder (where package.json lives), then run:

```sh
npm ci
npm run compile
npm test
```

Dependencies are version-pinned and a lockfile is included. `npm test` creates a temporary Ganache chain with disposable accounts, deploys the contract, runs the tests, then discards the chain. This does not deploy to Sepolia or your MetaMask network.

## 2. Prepare MetaMask

1. Use a test wallet; never put a private key or recovery phrase in source code, screenshots, or GitHub.
2. Start Ganache in a separate terminal with `npx ganache --server.host 127.0.0.1 --server.port 8545 --chain.chainId 1337`, then add/select the MetaMask custom network using RPC `http://127.0.0.1:8545`, chain ID **1337**, and currency **ETH**.
3. Create three test accounts: A (administrator), B (student), C (another student).
4. Use Ganache's disposable development accounts for transactions. Import their private keys into MetaMask only for this local test network; never use these accounts for real assets or publish their keys.
5. Select account A before deployment. The deployer becomes the permanent administrator.

## 3. Compile and deploy using Remix

1. Open https://remix.ethereum.org/ in the browser with MetaMask.
2. Create `CampusGear.sol` in Remix and paste `contracts/CampusGear.sol` into it.
3. Open Solidity Compiler and select **0.8.24**.
4. Compile.
5. Open **Deploy & Run Transactions**. Choose **Browser Extension → MetaMask** (older versions call this **Injected Provider - MetaMask**).
6. Approve connection, check that the network is Local Ganache (chain ID **1337**) and the account is the one used for Administrator, and select `CampusGear` as the contract. Leave Value at **0**. There are no constructor arguments.
7. Click **Deploy**, approve in MetaMask, and wait for confirmation.
8. Copy the deployed contract address from Remix.



## 4. Configure and run the frontend

Edit `frontend/config.js`:

```js
export const CONFIG = {
  contractAddress: 'PASTE_YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
  chainId: 1337,
  networkName: 'Local Ganache',
  explorerUrl: ''
};
```

Then run:

```sh
npm start
```

Open **http://localhost:8080** in your MetaMask-enabled browser. Do not double-click index.html: JavaScript module loading needs the local server. Ethers.js is served from the installed npm package, so there is no runtime CDN dependency.

Click **Connect MetaMask**. When connected as A, register `Arduino Kit 01` and `Camera 01`. Every write requires wallet approval and confirmation. Read-only refreshes do not submit transactions.






