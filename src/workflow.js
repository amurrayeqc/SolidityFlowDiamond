import { encodeDeployData } from 'viem';

export function normalizeApiUrl(value) {
  let url; try { url = new URL(value); } catch { throw new Error('Compiler API URL is invalid'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Compiler API must use HTTP or HTTPS');
  return url.toString().replace(/\/$/, '');
}

export function compileInput({ source, fileName, contractName, optimizerRuns = 200 }) {
  if (typeof source !== 'string' || !source.trim()) throw new Error('Solidity source is required');
  if (!/^[A-Za-z0-9_.-]+\.sol$/.test(fileName || '')) throw new Error('Filename must be a safe .sol filename');
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(contractName || '')) throw new Error('Contract name is required and must be a Solidity identifier');
  const runs = Number(optimizerRuns); if (!Number.isInteger(runs) || runs < 1 || runs > 1_000_000) throw new Error('Optimizer runs must be from 1 to 1,000,000');
  return { source, fileName, contractName, optimizer: { enabled: true, runs } };
}

export function parseConstructorArgs(value, abi) {
  const constructor = abi?.find(item => item.type === 'constructor'); const inputs = constructor?.inputs || [];
  let args; try { args = value.trim() ? JSON.parse(value) : []; } catch { throw new Error('Constructor arguments must be valid JSON'); }
  if (!Array.isArray(args)) throw new Error('Constructor arguments must be a JSON array');
  if (args.length !== inputs.length) throw new Error(`Constructor expects ${inputs.length} argument${inputs.length === 1 ? '' : 's'}, received ${args.length}`);
  return args;
}

export function buildDeployData(artifact, constructorArgs) {
  if (!artifact?.bytecode || !/^0x[0-9a-f]*$/i.test(artifact.bytecode) || artifact.bytecode === '0x') throw new Error('Compiled creation bytecode is unavailable');
  return encodeDeployData({ abi: artifact.abi, bytecode: artifact.bytecode, args: constructorArgs });
}

export class CompilerClient {
  constructor(baseUrl, fetchImpl = globalThis.fetch) { this.baseUrl = normalizeApiUrl(baseUrl); this.fetch = fetchImpl.bind(globalThis); }
  async compile(input) {
    const response = await this.fetch(`${this.baseUrl}/api/compile`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
    let payload; try { payload = await response.json(); } catch { throw new Error(`Compiler API returned non-JSON HTTP ${response.status}`); }
    if (!response.ok) { const error = new Error(payload.error || `Compiler API returned HTTP ${response.status}`); error.diagnostics = payload.diagnostics || []; throw error; }
    if (!payload.result?.contracts?.length) throw new Error('Compiler returned no deployable contracts');
    return payload.result;
  }
}

export class WalletClient {
  constructor(provider) { if (!provider?.request) throw new Error('No injected EIP-1193 wallet found'); this.provider = provider; }
  async connect() { const accounts = await this.provider.request({ method: 'eth_requestAccounts' }); const chainId = await this.provider.request({ method: 'eth_chainId' }); if (!accounts?.[0]) throw new Error('Wallet returned no account'); return { account: accounts[0], chainId }; }
  async deploy({ account, data }) {
    const transaction = { from: account, data };
    const gas = await this.provider.request({ method: 'eth_estimateGas', params: [transaction] });
    const hash = await this.provider.request({ method: 'eth_sendTransaction', params: [{ ...transaction, gas }] });
    return { hash, gas };
  }
  async waitForReceipt(hash, { interval = 1000, timeout = 120000 } = {}) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const receipt = await this.provider.request({ method: 'eth_getTransactionReceipt', params: [hash] });
      if (receipt) return receipt;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Deployment receipt timed out after ${timeout}ms`);
  }
  async verify(address) { const code = await this.provider.request({ method: 'eth_getCode', params: [address, 'latest'] }); return typeof code === 'string' && code !== '0x' && code !== '0x0'; }
}

export function historyEntry({ result, artifact, receipt, account, chainId }) {
  return { contractName: artifact.name, compiler: result.compiler, sourceHash: result.sourceHash, transactionHash: receipt.transactionHash, contractAddress: receipt.contractAddress, blockNumber: receipt.blockNumber, account, chainId, deployedAt: new Date().toISOString() };
}
