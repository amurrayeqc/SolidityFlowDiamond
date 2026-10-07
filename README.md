# SolidityFlowDiamond

[![CI](https://github.com/centxyz/SolidityFlowDiamond/actions/workflows/ci.yml/badge.svg)](https://github.com/centxyz/SolidityFlowDiamond/actions/workflows/ci.yml)

SolidityFlowDiamond is a browser deployment runbook for Solidity contracts. It compiles source through [SolidityStackDiamond](https://github.com/centxyz/SolidityStackDiamond), encodes typed constructor arguments, connects to an injected EIP-1193 wallet, estimates gas, requests deployment, waits for the transaction receipt, and verifies runtime bytecode at the resulting address.

Private keys never enter the application. The connected wallet performs approval and signing. Verified deployments are stored only in browser local storage.

## Run

Start SolidityStackDiamond on port 3000, then:

```bash
git clone https://github.com/centxyz/SolidityFlowDiamond.git
cd SolidityFlowDiamond
npm install
npm run dev
```

Open the displayed URL in a browser with an injected wallet such as MetaMask. Choose the intended wallet network before deployment.

## Workflow

1. Enter source, filename, and target contract name.
2. Compile and review the selected artifact.
3. Enter constructor values as a JSON array in ABI order.
4. Connect the wallet and approve the deployment transaction.
5. SolidityFlowDiamond waits for the receipt and confirms deployed bytecode with `eth_getCode`.

## Verify

```bash
npm test
npm run build
```

Tests cover validation, dynamic constructor encoding, compiler integration, wallet connection, gas estimation, submission, receipt polling, bytecode verification, and deployment history records.

## Security boundaries

- SolidityFlowDiamond does not audit source code or guarantee contract safety.
- Compiler API and wallet network selection are independent; verify both before signing.
- A verified deployment means runtime bytecode exists at the receipt address, not that the source is secure or externally verified.

## License

MIT © cent

## Current limitations

- Deployment requires a compatible compiler service, an injected wallet, a funded account, and a suitable EVM network.
- Runtime bytecode presence is a basic verification check, not source-code verification or a security audit.
- Gas estimates, wallet prompts, and receipts depend on the connected provider and live chain state.
