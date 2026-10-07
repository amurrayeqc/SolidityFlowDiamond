import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildDeployData, compileInput, CompilerClient, historyEntry, parseConstructorArgs, WalletClient } from './workflow.js';

const abi = [{ type: 'constructor', inputs: [{ name: 'message', type: 'string' }], stateMutability: 'nonpayable' }];

describe('deployment workflow', () => {
  test('validates compiler inputs and constructor arguments', () => {
    assert.equal(compileInput({ source: 'contract C {}', fileName: 'C.sol', contractName: 'C' }).optimizer.runs, 200);
    assert.deepEqual(parseConstructorArgs('["hello"]', abi), ['hello']);
    assert.throws(() => parseConstructorArgs('[]', abi), /expects 1/);
  });
  test('encodes creation bytecode and dynamic constructor data', () => {
    const data = buildDeployData({ abi, bytecode: '0x60006000' }, ['hello']); assert.ok(data.startsWith('0x60006000')); assert.ok(data.length > 10);
  });
  test('compiles through SolidityStackDiamond', async () => {
    const result = { contracts: [{ name: 'C', abi: [], bytecode: '0x60' }] };
    const client = new CompilerClient('http://localhost:3000', async (_url, init) => { assert.equal(JSON.parse(init.body).contractName, 'C'); return { ok: true, status: 200, json: async () => ({ success: true, result }) }; });
    assert.deepEqual(await client.compile({ contractName: 'C' }), result);
  });
  test('estimates, sends, polls, and verifies through EIP-1193', async () => {
    let polls = 0; const calls = [];
    const provider = { request: async request => { calls.push(request.method); if (request.method === 'eth_requestAccounts') return ['0x1111111111111111111111111111111111111111']; if (request.method === 'eth_chainId') return '0x1'; if (request.method === 'eth_estimateGas') return '0x5208'; if (request.method === 'eth_sendTransaction') return '0xabc'; if (request.method === 'eth_getTransactionReceipt') return ++polls > 1 ? { transactionHash: '0xabc', contractAddress: '0x2222222222222222222222222222222222222222', status: '0x1' } : null; if (request.method === 'eth_getCode') return '0x6000'; } };
    const wallet = new WalletClient(provider); const connection = await wallet.connect(); const sent = await wallet.deploy({ account: connection.account, data: '0x6000' }); const receipt = await wallet.waitForReceipt(sent.hash, { interval: 1, timeout: 100 });
    assert.equal(connection.chainId, '0x1'); assert.equal(receipt.status, '0x1'); assert.equal(await wallet.verify(receipt.contractAddress), true); assert.ok(calls.includes('eth_estimateGas'));
  });
  test('creates portable deployment history entries', () => {
    const entry = historyEntry({ result: { compiler: 'solc', sourceHash: 'sha256:x' }, artifact: { name: 'C' }, receipt: { transactionHash: '0x1', contractAddress: '0x2', blockNumber: '0x3' }, account: '0xa', chainId: '0x1' }); assert.equal(entry.contractName, 'C'); assert.equal(entry.compiler, 'solc');
  });
});
