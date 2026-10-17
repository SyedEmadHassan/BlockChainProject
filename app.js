import { BrowserProvider, Contract, isAddress, ZeroAddress } from '/vendor/ethers.js';
import { CONFIG } from './config.js';
import { ABI } from './abi.js';

const $ = id => document.getElementById(id);
let provider, contract, account = '', administrator = '', inventory = [], busy = false;
const sameAddress = (a, b) => a.toLowerCase() === b.toLowerCase();
const isAdmin = () => account && sameAddress(account, administrator);

function feedback(message, kind = 'info') {
  $('feedback').textContent = message;
  $('feedback').dataset.kind = kind;
}

function errorMessage(error) {
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') return 'You cancelled the wallet request.';
  if (error.code === -32002) return 'A wallet request is already pending. Open MetaMask to complete it.';
  if (error.code === 'INSUFFICIENT_FUNDS') return 'Not enough test ETH to pay transaction gas.';
  return error.reason || error.info?.error?.message || error.shortMessage || error.message || 'Request failed.';
}

function showTransaction(hash) {
  $('transaction').replaceChildren();
  if (!hash) return;
  $('transaction').append('Transaction: ');
  // Restrict the configured explorer to HTTPS; never render a wallet/contract string as HTML.
  if (CONFIG.explorerUrl.startsWith('https://')) {
    const link = document.createElement('a');
    link.href = `${CONFIG.explorerUrl.replace(/\/$/, '')}/tx/${hash}`;
    link.textContent = hash;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    $('transaction').append(link);
  } else $('transaction').append(hash);
}

function setBusy(value) {
  busy = value;
  $('connect').disabled = value || Boolean(contract);
  $('refresh').disabled = value || !contract;
  $('add').disabled = value || !contract;
  for (const button of $('items').querySelectorAll('button')) button.disabled = value;
}

function detail(list, label, value) {
  const dt = document.createElement('dt'); dt.textContent = label;
  const dd = document.createElement('dd'); dd.textContent = value;
  list.append(dt, dd);
  return dd;
}

function render() {
  $('items').replaceChildren();
  $('total').textContent = inventory.length;
  $('available').textContent = inventory.filter(i => i.status === 0).length;
  $('mine').textContent = inventory.filter(i => sameAddress(i.borrower, account)).length;
  const filter = $('filter').value;
  const shown = inventory.filter(i => filter === 'all' ||
    (filter === 'available' && i.status === 0) ||
    (filter === 'mine' && sameAddress(i.borrower, account)) ||
    (filter === 'returns' && i.status === 2));
  $('empty').hidden = shown.length > 0;
  $('empty').textContent = inventory.length ? 'No equipment matches this filter.' : 'No equipment registered. The administrator can add the first item.';
  for (const item of shown) {
    const card = document.createElement('article'); card.className = 'card';
    const top = document.createElement('div'); top.className = 'card-top';
    const id = document.createElement('span'); id.className = 'item-id'; id.textContent = `ITEM #${item.id}`;
    const badge = document.createElement('span');
    badge.className = `badge ${['', 'borrowed', 'pending'][item.status]}`;
    badge.textContent = ['Available', 'Borrowed', 'Return requested'][item.status];
    top.append(id, badge);
    const name = document.createElement('h3'); name.textContent = item.name;
    const dl = document.createElement('dl');
    detail(dl, 'Borrower', item.borrower === ZeroAddress ? '—' : item.borrower);
    const due = detail(dl, 'Return by', item.dueDate ? new Date(item.dueDate * 1000).toLocaleString() : '—');
    if (item.status !== 0 && item.dueDate * 1000 < Date.now()) {
      due.className = 'overdue'; due.textContent += ' · Past due';
    }
    card.append(top, name, dl);
    let label, action;
    if (item.status === 0 && !isAdmin()) {
      label = 'Borrow for 7 days'; action = () => transact('borrowEquipment', [item.id], 'Equipment borrowed.');
    } else if (item.status === 1 && sameAddress(item.borrower, account)) {
      label = 'Request return'; action = () => transact('requestReturn', [item.id], 'Return requested. Hand the equipment to the administrator.');
    } else if (item.status === 2 && isAdmin()) {
      label = 'Confirm physical return'; action = () => {
        if (window.confirm(`Have you received and inspected ${item.name}?`)) transact('confirmReturn', [item.id], 'Return confirmed. Equipment is available again.');
      };
    }
    if (action) {
      const button = document.createElement('button');
      button.textContent = label; button.disabled = busy; button.addEventListener('click', action); card.append(button);
    } else {
      const note = document.createElement('p'); note.className = 'card-note';
      note.textContent = item.status === 2 ? 'Waiting for administrator inspection.' : item.status === 0 ? 'Students can borrow this item.' : 'This item is currently on loan.';
      card.append(note);
    }
    $('items').append(card);
  }
}

async function loadEquipment() {
  // Small batches avoid flooding the wallet RPC with requests.
  const count = Number(await contract.equipmentCount());
  const next = [];
  for (let start = 1; start <= count; start += 20) {
    const ids = Array.from({ length: Math.min(20, count - start + 1) }, (_, n) => start + n);
    const items = await Promise.all(ids.map(id => contract.getEquipment(id)));
    next.push(...items.map(i => ({ id: i.id, name: i.name, borrower: i.borrower, dueDate: Number(i.dueDate), status: Number(i.status) })));
  }
  inventory = next;
  render();
}

async function checkWallet() {
  const [chain, accounts] = await Promise.all([
    window.ethereum.request({ method: 'eth_chainId' }),
    window.ethereum.request({ method: 'eth_accounts' })
  ]);
  if (BigInt(chain) !== BigInt(CONFIG.chainId)) throw new Error(`Switch MetaMask to ${CONFIG.networkName}, then reconnect.`);
  if (!accounts[0] || !sameAddress(accounts[0], account)) throw new Error('Wallet account changed. Reload and reconnect.');
}

async function connect() {
  if (busy) return;
  setBusy(true);
  try {
    feedback('Checking wallet and deployment configuration…');
    if (!window.ethereum) throw new Error('Install the MetaMask browser extension, then reload this page.');
    if (!isAddress(CONFIG.contractAddress) || CONFIG.contractAddress === ZeroAddress) throw new Error('Set your deployed contract address in frontend/config.js, then reload this page. See README.md.');
    feedback('Approve the connection request in MetaMask.');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    feedback(`Checking the ${CONFIG.networkName} network and deployed contract…`);
    const chain = await window.ethereum.request({ method: 'eth_chainId' });
    if (BigInt(chain) !== BigInt(CONFIG.chainId)) throw new Error(`Switch MetaMask to ${CONFIG.networkName} (chain ID ${CONFIG.chainId}), then connect again.`);
    provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    account = await signer.getAddress();
    if (await provider.getCode(CONFIG.contractAddress) === '0x') throw new Error('No contract at this address on the selected network. Check config.js.');
    contract = new Contract(CONFIG.contractAddress, ABI, signer);
    administrator = await contract.administrator();
    feedback('Loading equipment from the contract…');
    await loadEquipment();
    $('network').textContent = CONFIG.networkName;
    $('wallet').textContent = `${isAdmin() ? 'Administrator' : 'Student'} · ${account}`;
    $('connect').textContent = 'Wallet connected';
    $('admin-panel').hidden = !isAdmin();
    feedback('Connected. All equipment data below was read from the contract.', 'success');
  } catch (error) {
    contract = null; account = ''; administrator = ''; inventory = [];
    $('items').replaceChildren();
    $('total').textContent = '—';
    $('available').textContent = '—';
    $('mine').textContent = '—';
    $('wallet').textContent = 'Connect your wallet to view equipment.';
    $('network').textContent = 'Not connected';
    $('connect').textContent = 'Connect MetaMask';
    $('admin-panel').hidden = true;
    feedback(errorMessage(error), 'error');
  } finally { setBusy(false); }
}

async function transact(method, args, successMessage) {
  if (busy || !contract) return;
  setBusy(true); showTransaction('');
  try {
    await checkWallet();
    feedback('Confirm the transaction in MetaMask.');
    const tx = await contract[method](...args);
    showTransaction(tx.hash);
    feedback('Transaction submitted. Waiting for confirmation…');
    let receipt;
    try { receipt = await tx.wait(); }
    catch (error) {
      if (error.code === 'TRANSACTION_REPLACED' && !error.cancelled && error.receipt?.status === 1) {
        receipt = error.receipt; showTransaction(receipt.hash);
      } else throw error;
    }
    if (!receipt || receipt.status !== 1) throw new Error('Transaction reverted.');
    if (method === 'addEquipment') $('add-form').reset();
    feedback(`${successMessage} Confirmed in block ${receipt.blockNumber}.`, 'success');
    try { await loadEquipment(); }
    catch { feedback(`${successMessage} Transaction confirmed, but data refresh failed. Click Refresh.`, 'success'); }
  } catch (error) {
    if (error.receipt?.hash) showTransaction(error.receipt.hash);
    feedback(errorMessage(error), 'error');
  } finally { setBusy(false); }
}

$('connect').addEventListener('click', connect);
$('filter').addEventListener('change', () => { if (contract) render(); });
$('refresh').addEventListener('click', async () => {
  if (busy || !contract) return;
  setBusy(true);
  try { await checkWallet(); await loadEquipment(); feedback('Equipment data refreshed.', 'success'); }
  catch (error) { feedback(errorMessage(error), 'error'); }
  finally { setBusy(false); }
});
$('add-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('item-name').value.trim();
  if (!name || new TextEncoder().encode(name).length > 100) {
    feedback('Enter an equipment name between 1 and 100 UTF-8 bytes.', 'error'); return;
  }
  transact('addEquipment', [name], 'Equipment registered.');
});

// A fresh connection prevents stale signer/chain state after wallet changes.
if (window.ethereum?.on) {
  window.ethereum.on('accountsChanged', () => window.location.reload());
  window.ethereum.on('chainChanged', () => window.location.reload());
  window.ethereum.on('disconnect', () => window.location.reload());
}
