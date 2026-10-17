# CampusGear

A Solidity + HTML/CSS/JavaScript DApp for lending campus equipment. Students borrow available equipment for seven days, request a return, and wait for an administrator to confirm physical receipt. MetaMask signs transactions; Ethers.js reads the contract and sends transactions. No database or backend application is required. The included Node server only serves static files.

## What is implemented

- Administrator-only registration and return confirmation.
- Student borrowing, return requests, and a fixed seven-day deadline.
- Contract validation for IDs, names, permissions, and state transitions.
- Events recording each lifecycle action and the previous borrower on return.
- Wallet connection, account/network change handling, transaction status/hash, role-specific UI, equipment filters and overdue display.
- Automated tests against an ephemeral Ganache blockchain, including a mined failed transaction.



## Files

| File | Purpose |
| --- | --- |
| `contracts/CampusGear.sol` | Smart contract |
| `frontend/index.html` | Interface |
| `frontend/style.css` | Styling |
| `frontend/app.js` | MetaMask/Ethers integration |
| `frontend/config.js` | Your deployment address and network |
| `frontend/abi.js` | Generated contract ABI; already supplied |
| `scripts/compile.mjs` | Compile contract and regenerate ABI |
| `scripts/serve.mjs` | Local static-file server |
| `tests/contract.test.mjs` | Automated contract tests |
| `test-results.txt` | Actual automated test run output |
| `MANUAL_TESTS.md` | Testnet/Remix testing worksheet |
| `DEPLOYMENT.md` | Deployment details to fill in |

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
4. In compiler advanced settings, select **Paris** as EVM version and enable optimization with **200 runs**, matching the supplied compile script.
5. Compile and capture the required compilation screenshot.
6. Open **Deploy & Run Transactions**. Choose **Browser Extension → MetaMask** (older versions call this **Injected Provider - MetaMask**).
7. Approve connection, check that the network is Local Ganache (chain ID **1337**) and the account is A, and select `CampusGear` as the contract. Leave Value at **0**. There are no constructor arguments.
8. Click **Deploy**, approve in MetaMask, and wait for confirmation.
9. Copy the deployed contract address from Remix. Capture the deployment screenshot and fill in `DEPLOYMENT.md`.



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

## 5. Demonstrate the complete flow

1. As A, add an item.
2. Switch MetaMask to B. The page reloads to avoid retaining the old signer. Click Connect again. Ensure B is the selected account for this site in MetaMask.
3. Borrow the item. The UI shows B's address and a seven-day deadline.
4. Switch to C: the item remains unavailable.
5. Switch to B and request return. The item stays unavailable while awaiting inspection.
6. Switch to A and confirm physical return. The item becomes available and its active borrower/deadline are cleared.
7. Switch to C and borrow it again.

Click Refresh to retrieve changes made by another account or in Remix. If switching accounts during a pending transaction reloads the page, check the hash in MetaMask's Activity before retrying.




