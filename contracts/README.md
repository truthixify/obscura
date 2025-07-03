# Obscura: Shielded Pool for Private Transactions on Starknet

## Overview

**Obscura** is a shielded pool smart contract for Starknet, enabling shielded (private) transactions using zero-knowledge proofs and Merkle trees. It allows users to deposit, transfer, and withdraw tokens in a shielded manner, so transaction details are hidden from the public, leveraging advanced cryptography for privacy and security.

**For a full technical reference of all contract constants, types, events, errors, and more, see [REFERENCE.md](./REFERENCE.md).**

---

## Architecture

- **Deposits:** Users can deposit tokens into the shielded pool.
- **Shielded Withdrawals:** Users can withdraw tokens to specific addresses, preserving privacy.
- **Shielded Transfers:** Internal transfers between users remain completely shielded.
- **Zero-Knowledge Proofs:** All transactions are validated using cryptographic proofs, ensuring correctness without revealing sensitive data.
- **Merkle Tree Management:** Commitments are stored in a Merkle tree, enabling efficient and shielded state verification.

### Key Components

- **Commitments:** Cryptographic commitments to transaction outputs.
- **Nullifiers:** One-time-use values that prevent double-spending.
- **Merkle Trees:** Efficient storage and verification of commitments.
- **Zero-Knowledge Proofs:** Prove transaction validity without revealing details.

### Security Model

- Cryptographic commitments hide transaction amounts.
- Nullifiers prevent double-spending without revealing inputs.
- Zero-knowledge proofs validate transactions cryptographically.
- Encrypted outputs ensure only recipients can decrypt transaction details and spend the outputs.

---

## Contract Flow

1. **Registration:**  
   Users register their public key for encrypted communication. Only the account owner can register their own account.

2. **Deposits:**  
   Users deposit tokens and receive commitments. The contract verifies deposit limits and updates the Merkle tree.

3. **Shielded Transfers:**  
   Users transfer tokens to registered users within the shielded pool. The contract checks nullifiers, verifies proofs, and updates commitments.

4. **Shielded Withdrawals:**  
   Users withdraw tokens to external addresses. The contract ensures correct withdrawal amounts and updates the Merkle tree.

5. **Events:**  
   The contract emits events for new commitments, nullifiers, and public key registrations, enabling off-chain tracking while preserving privacy.

---

## Project Structure

```
contracts/
  obscura/
    src/
      constants.cairo         # System-wide constants and configuration values
      custom_type/
        i256.cairo            # Signed 256-bit integer implementation (I256)
        u1024.cairo           # Unsigned 1024-bit integer implementation (U1024)
      custom_type.cairo       # Module for custom types used throughout the contract
      errors.cairo            # Error messages and constants for contract operations
      events.cairo            # Event definitions for contract interactions
      interface.cairo         # External interface definitions (public API)
      lib.cairo               # Main entry point, imports all modules
      obscura.cairo           # Main contract implementation (shielded pool logic)
      structs.cairo           # Core data structures (Account, Proof, ExtData, MerkleTree)
    tests/
      test_contract.cairo     # Cairo integration tests for the contract
  deployments/
    clear.mjs                # Script to clear deployments
  tests/
    test.ts                  # Jest e2e tests for shielded pool flows
    deploy.ts                # Helper for deploying contracts in tests
    utils.ts                 # Shared test utilities
  utils/
    index.ts                 # Main utility index, exports helpers for tests
    keypair.ts               # Keypair and encryption utilities for shielded transactions
    prover.ts                # Zero-knowledge proof generation helpers
    utils.ts                 # General utility functions
    utxo.ts                  # UTXO model for shielded transactions
    custom_type.ts           # TypeScript helpers for custom Cairo types
    events_parsing.ts        # Helpers for parsing contract events in tests
    helper.ts                # Miscellaneous helper functions
  scripts-ts/
    deploy-contract.ts       # Script to deploy the main contract
    deploy-test-contract.ts  # Script to deploy a test contract
    deploy.ts                # General deployment script
    interact.ts              # Script for interacting with deployed contracts
    types.ts                 # TypeScript type definitions for scripts
    verify-contracts.ts      # Script to verify deployed contracts
    helpers/
      colorize-log.ts        # Helper for colored logging in scripts
      deploy-wrapper.ts      # Wrapper for deployment logic
      networks.ts            # Network configuration for deployments
      parse-deployments.ts   # Helper to parse deployment outputs
  assets/
    circuit.json             # Compiled NOIR circuit code
    verifier.json            # Verifier contract definition
    vk.bin                   # Verification key binary for ZK proofs
    verifier/
      src/
        honk_verifier.cairo    # Main verifier contract for the NOIR circuit
        ...                    # Other verifier modules and logic
      Scarb.toml               # Scarb project configuration for the verifier
      Scarb.lock               # Scarb lock file for the verifier
      .tool-versions           # Tool version pinning for the verifier
  package.json               # Node.js project configuration and scripts
  tsconfig.json              # TypeScript configuration
  jest.config.js             # Jest test configuration
  Scarb.toml                 # Cairo/Scarb project configuration
  snfoundry.toml             # Starknet Foundry configuration
```

### Directory and File Descriptions

- **src/**: Contains all Cairo source code for the shielded pool contract, including constants, custom types, errors, events, interfaces, main logic, and data structures.
- **src/custom_type/**: Custom Cairo types for extended integer support (signed 256-bit, unsigned 1024-bit).
- **src/tests/**: Cairo-based integration tests for the contract.
- **tests/**: TypeScript-based end-to-end tests, deployment helpers, and utilities for shielded pool flows.
- **utils/**: TypeScript utilities for cryptography, event parsing, UTXO modeling, and general helpers used in tests and scripts.
- **scripts-ts/**: TypeScript scripts for deploying, verifying, and interacting with contracts, plus deployment helpers and network configuration.
- **assets/**: Contains ZK circuit and verifier files required for proof generation and verification.
- **verifier/**: Contains the zero-knowledge proof verifier contract and related modules. This contract is deployed separately and is used by the shielded pool to verify ZK proofs for deposits, transfers, and withdrawals.
- **deployments/**: Deployment management scripts.
- **package.json, tsconfig.json, jest.config.js**: Project, TypeScript, and Jest configuration files.
- **Scarb.toml, snfoundry.toml**: Cairo and Starknet Foundry configuration files.

---

## How to Test

### Prerequisites

- Node.js (v20+ recommended)
- Yarn
- Cairo toolchain (for contract compilation)
- Starknet Devnet (for local testing)

### Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Start Starknet Devnet:**
   ```bash
   yarn chain
   ```
   This will start a local Starknet devnet with pre-funded accounts.

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in the required values (e.g., `RPC_URL_DEVNET`, `PRIVATE_KEY_DEVNET`, `ACCOUNT_ADDRESS_DEVNET`).

4. **Declare contracts:**
   ```bash
   make declare-verifier
   make declare-contract
   ```
    Copy the contract ClassHash you get into `tests/deploy.ts`

### Running Jest E2E Tests

The main Jest test suite is located at `tests/test.ts`. It covers:

- Encryption/decryption logic
- Contract constants and limits
- Nullifier checks (double-spend prevention)
- Account registration and event emission
- Shielded deposit, transfer, and withdrawal flows
- End-to-end shielded transaction scenarios

**To run the tests:**
```bash
yarn test:e2e
```

This will execute all Jest-based e2e tests, deploying the contract to your local devnet and running through the full shielded flow.

---

## Test Flow Explained

- **Keypair Generation:**  
  Each user (Alice, Bob) generates a keypair for encryption and privacy.

- **Account Registration:**  
  Users register their public key with the contract, emitting a `PublicKey` event.

- **Deposit:**  
  Users deposit tokens, creating a UTXO (unspent transaction output) and emitting a `NewCommitment` event.

- **Shielded Transfer:**  
  Users can transfer tokens to registered users within the shielded pool. The contract verifies the proof, updates the Merkle tree, and emits events.

- **Shielded Withdrawal:**  
  Users can withdraw tokens to an external address, with the contract ensuring correct amounts and privacy.

- **Event Parsing:**  
  The test suite uses event parsing utilities to track commitments, nullifiers, and public key registrations, verifying the correct flow and privacy guarantees.

---

## Utilities

- **Keypair & Encryption:**  
  Utilities for generating keypairs, encrypting/decrypting data, and signing transactions.

- **UTXO Model:**  
  Represents shielded balances and enables shielded transfers using commitments and nullifiers.

- **Merkle Tree:**  
  Used for efficient and shielded state management of commitments.

- **Event Parsing:**  
  Helpers for extracting and verifying contract events during tests.

---

## Contract Compilation & Deployment

- **Compile contracts:**
  ```bash
  yarn compile
  ```
- **Deploy contracts:**
  ```bash
  yarn deploy --network <sepolia | mainnet> # don't add network flag for devnet deployment
  ```

---

## License

MIT