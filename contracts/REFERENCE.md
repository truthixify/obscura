# Contract Reference

## Constants

| Name                   | Type   | Value/Description                                                                                                    |
|------------------------|--------|---------------------------------------------------------------------------------------------------------------------|
| `FIELD_SIZE`           | u256   | The prime field size for BN254 curve: 21888242871839275222246405745257275088548364400416034343698204186575808495617. Used for all cryptographic operations and modular arithmetic in ZK proofs. |
| `MAX_EXT_AMOUNT`       | u256   | 2^248. Maximum allowed external amount for deposits/withdrawals. Prevents overflow and ensures system stability.     |
| `MAX_FEE`              | u256   | 2^248. Maximum allowed fee for transactions. Prevents excessive fee extraction and economic attacks.                |
| `MIN_EXT_AMOUNT`       | u256   | 5 × 10^17. Minimum allowed external amount (0.5 tokens in wei). Prevents dust/spam transactions.                    |
| `VERIFIER_CLASSHASH`   | felt252| Class hash of the ZK proof verifier contract. Used for verifying cryptographic proofs.                              |
| `ROOT_HISTORY_SIZE`    | u32    | 100. Number of past Merkle roots stored for history verification. Balances privacy and security.                    |
| `FELT_STRK_CONTRACT`   | felt252| Mainnet STRK token contract address. Used for all token transfers in the shielded pool.                            |

---

## Custom Types

### I256 (Signed 256-bit Integer)
- **Purpose:** Represents signed values (positive/negative) for external amounts (deposits/withdrawals).
- **Fields:**
  - `value: u256` — The absolute value.
  - `is_negative: bool` — True if negative, false if positive.
- **Usage:** Used for deposit/withdrawal amounts, fee calculations, and ZK proof consistency.

### U1024 (Unsigned 1024-bit Integer)
- **Purpose:** Represents very large numbers for cryptographic operations.
- **Fields:** `limb0` through `limb7` (u128 each) — Little-endian storage of the 1024-bit value.
- **Usage:** Used for cryptographic calculations requiring extended precision.

---

## Structs

### MerkleTreeWithHistory
- **Purpose:** Stores commitments and their history for shielded transactions.
- **Fields:**
  - `levels: u32` — Depth of the tree.
  - `filled_subtrees: Vec<u256>` — Intermediate subtree roots.
  - `roots: Vec<u256>` — Historical Merkle roots.
  - `current_root_index: u32` — Index of the current root.
  - `next_index: u32` — Next available index for new leaves.
  - `zeros: Vec<u256>` — Precomputed zero hashes for empty nodes.

### ExtData
- **Purpose:** Public data for a shielded transaction.
- **Fields:**
  - `recipient: ContractAddress` — Address for withdrawals or contract for deposits.
  - `ext_amount: I256` — External amount (positive for deposit, negative for withdrawal).
  - `relayer: ContractAddress` — Address to receive transaction fee.
  - `fee: u256` — Fee paid to the relayer.
  - `encrypted_output1: ByteArray` — Encrypted output for the first commitment.
  - `encrypted_output2: ByteArray` — Encrypted output for the second commitment.

### Proof
- **Purpose:** Zero-knowledge proof data for shielded transaction validation.
- **Fields:**
  - `proof: Span<felt252>` — The ZK proof.
  - `root: u256` — Merkle root for the transaction.
  - `input_nullifiers: Array<u256>` — Nullifiers for input commitments.
  - `output_commitments: Array<u256>` — Commitments for transaction outputs.
  - `public_amount: u256` — Public amount for proof verification.
  - `ext_data_hash: u256` — Hash of external data for consistency.

### Account
- **Purpose:** User registration and key management.
- **Fields:**
  - `owner: ContractAddress` — Owner's address.
  - `public_key: ByteArray` — Public key for encrypted communication.

---

## Events

### NewCommitment
- **Emitted:** When a new commitment is added to the Merkle tree.
- **Fields:**
  - `commitment: u256` — The cryptographic commitment.
  - `index: u32` — Index in the Merkle tree.
  - `encrypted_output: ByteArray` — Encrypted output for the recipient.
- **Purpose:** Allows recipients to scan for their outputs and track tree growth, while maintaining privacy.

### NewNullifier
- **Emitted:** When a nullifier is used (input is spent).
- **Fields:**
  - `nullifier: u256` — The nullifier hash.
- **Purpose:** Prevents double-spending and enables external systems to track spent inputs.

### PublicKey
- **Emitted:** When a user registers their public key.
- **Fields:**
  - `owner: ContractAddress` — Owner's address (indexed).
  - `key: ByteArray` — Public key for encrypted communication.
- **Purpose:** Enables shielded communication and registration tracking.

### Event Enum (in contract)
- **Variants:**
  - `NewCommitment(NewCommitment)`
  - `NewNullifier(NewNullifier)`
  - `PublicKey(PublicKey)`
  - `OwnableEvent(OwnableComponent::Event)` — For access control events from OpenZeppelin's Ownable.

---

## Errors

| Error Constant                              | Message                              | When Thrown                                                                                      | Resolution                                                                                   |
|---------------------------------------------|--------------------------------------|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| ERROR_ONLY_OWNER_CAN_BE_REGISTERED          | Only owner can be registered         | Caller is not the account owner when registering; trying to register someone else's account      | Ensure the caller is the account owner; use the correct account address for registration     |
| ERROR_INVALID_MERKLE_ROOT                   | Invalid merkle root                  | Transaction proof references a Merkle root not in recent history, is zero, or too old            | Use a recent, valid Merkle root; ensure the proof is based on current state                  |
| ERROR_INPUT_ALREADY_SPENT                   | Input is already spent               | Transaction tries to use a nullifier already used in a previous transaction (double-spending)    | Use fresh, unspent inputs for new transactions; check input status before creating proofs     |
| ERROR_ZERO_ADDRESS                          | Invalid cannot be address            | Withdrawal transaction specifies a zero address as the recipient                                 | Use a valid, non-zero recipient address; ensure the recipient address is properly formatted  |
| ERROR_INVALID_FEE                           | Invalid fee                          | Transaction fee exceeds MAX_FEE, is negative, or calculation results in overflow                 | Use a fee amount within system limits; ensure fee calculation is correct                     |
| ERROR_INVALID_EXT_AMOUNT                    | Invalid ext amount                   | External amount (deposit/withdrawal) is outside allowed range or calculation overflows           | Use an amount within system limits; ensure amount calculation is correct                     |
| ERROR_INVALID_TREE_DEPTH                    | Invalid tree depth                   | Attempting to create a Merkle tree with depth 0, >=32, or invalid parameter                     | Use a depth between 1 and 31; consider gas costs and storage requirements                    |
| ERROR_MERKLE_TREE_IS_FULL                   | Merkle tree is full                  | Merkle tree has reached maximum capacity (2^levels commitments); no space for new commitments    | Wait for commitments to be spent; consider upgrading to a larger tree if needed              |
| ERROR_INCORRECT_EXT_HASH                    | Incorrect external data hash         | Hash of external data doesn't match the hash in the zero-knowledge proof                        | Ensure external data matches the proof; regenerate proof with correct external data          |
| ERROR_INVALID_PUBLIC_AMOUNT                 | Invalid public amount                | Public amount in the ZK proof doesn't match calculated public amount from external data          | Ensure amounts are calculated correctly; regenerate proof with correct amounts               |
| ERROR_INVALID_TRANSACTION_PROOF             | Invalid transaction proof            | Zero-knowledge proof fails verification by the external verifier contract                       | Regenerate proof with correct inputs; ensure all proof components are valid                  |
| ERROR_AMOUNT_LARGER_THAN_MAXIMUM_DEPOSIT    | Deposit amount is too large          | Deposit amount exceeds the configured maximum deposit amount                                     | Reduce deposit amount to within limits; split large deposits into smaller transactions       |
