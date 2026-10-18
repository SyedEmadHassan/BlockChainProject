import fs from 'node:fs';
import solc from 'solc';

export function compile() {
  const input = {
    language: 'Solidity',
    sources: { 'CampusGear.sol': { content: fs.readFileSync(new URL('../contracts/CampusGear.sol', import.meta.url), 'utf8') } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'paris',
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
    }
  };
  const result = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (result.errors || []).filter(e => e.severity === 'error');
  if (errors.length) throw new Error(errors.map(e => e.formattedMessage).join('\n'));
  return result.contracts['CampusGear.sol'].CampusGear;
}

const artifact = compile();
fs.writeFileSync(new URL('../frontend/abi.js', import.meta.url),
  `// Generated from CampusGear.sol with Solidity 0.8.24.\nexport const ABI = ${JSON.stringify(artifact.abi, null, 2)};\n`);
console.log('Compiled CampusGear.sol; generated frontend/abi.js');
