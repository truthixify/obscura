//! # Data Structures Module
//!
//! This module defines the core data structures used throughout the Obscura privacy-preserving
//! contract.
//! These structures represent the fundamental components of the privacy system including Merkle
//! trees, transaction proofs, and account information.

use starknet::ContractAddress;
use starknet::storage::Vec;
use crate::custom_type::I256;

/// A Merkle tree with history for storing and managing commitments in the privacy system.
///
/// This structure implements a sparse Merkle tree that maintains a history of recent roots
/// to enable privacy-preserving transaction verification while preventing double-spending.
///
/// # Components
/// - `levels`: The depth of the Merkle tree (number of levels)
/// - `filled_subtrees`: Intermediate hashes of subtree roots at each level
/// - `roots`: Historical Merkle roots for verification
/// - `current_root_index`: Index of the current active root
/// - `next_index`: Next available index for inserting new leaves
/// - `zeros`: Precomputed zero hashes for empty nodes at each level
///
/// # Privacy Features
/// - Maintains commitment history without revealing individual transactions
/// - Enables zero-knowledge proof verification against recent state
/// - Prevents double-spending through nullifier tracking
#[starknet::storage_node]
pub struct MerkleTreeWithHistory {
    /// The depth of the Merkle tree (number of levels).
    /// Determines the maximum number of commitments that can be stored.
    pub levels: u32,
    /// Stores intermediate hashes of subtree roots at each level.
    /// Used for efficient Merkle tree updates and proof generation.
    pub filled_subtrees: Vec<u256>,
    /// Stores the historical Merkle roots for transaction verification.
    /// Allows verification against recent state while maintaining privacy.
    pub roots: Vec<u256>,
    /// Tracks the index of the current Merkle root in the circular buffer.
    /// Used for efficient root rotation and history management.
    pub current_root_index: u32,
    /// Tracks the next available index for inserting a new leaf.
    /// Ensures sequential insertion and proper tree structure.
    pub next_index: u32,
    /// Precomputed zero hashes for empty nodes at each level.
    /// Optimizes Merkle tree operations by avoiding repeated hash calculations.
    pub zeros: Vec<u256>,
}

/// External data associated with a privacy-preserving transaction.
///
/// This structure contains the public information that must be revealed
/// for a transaction to be processed, while keeping the actual amounts
/// and recipients private through zero-knowledge proofs.
///
/// # Privacy Model
/// - `recipient` and `ext_amount` are public for deposit/withdrawal operations
/// - Internal transfers remain completely private
/// - `encrypted_output` contains private transaction details
#[derive(Debug, Drop, PartialEq, Serde)]
pub struct ExtData {
    /// The recipient address for withdrawals or the contract address for deposits.
    /// Must be a valid Starknet contract address.
    pub recipient: ContractAddress,
    /// The external amount for deposit (positive) or withdrawal (negative).
    /// This value is public and used for token transfers.
    pub ext_amount: I256,
    /// The relayer address that will receive the transaction fee.
    /// Incentivizes transaction processing and network maintenance.
    pub relayer: ContractAddress,
    /// The fee amount paid to the relayer for processing the transaction.
    /// Must be within the system's fee limits.
    pub fee: u256,
    /// Encrypted output data for the first commitment.
    /// Contains private transaction details that only the recipient can decrypt.
    pub encrypted_output1: ByteArray,
    /// Encrypted output data for the second commitment.
    /// Contains private transaction details that only the recipient can decrypt.
    pub encrypted_output2: ByteArray,
}

/// Zero-knowledge proof data for validating a privacy-preserving transaction.
///
/// This structure contains all the cryptographic proof elements needed to
/// verify that a transaction is valid without revealing private information.
///
/// # Cryptographic Components
/// - `proof`: The zero-knowledge proof demonstrating transaction validity
/// - `root`: The Merkle root that the transaction is based on
/// - `input_nullifiers`: Nullifiers proving input ownership and preventing double-spending
/// - `output_commitments`: New commitments for the transaction outputs
/// - `public_amount`: The public amount that must be consistent with external data
/// - `ext_data_hash`: Hash of external data for consistency verification
#[derive(Debug, Drop, PartialEq, Serde)]
pub struct Proof {
    /// The zero-knowledge proof demonstrating the validity of the transaction.
    /// Verified by the external proof verifier contract.
    pub proof: Span<felt252>,
    /// The Merkle root that the transaction inputs are based on.
    /// Must be a known root from the recent history.
    pub root: u256,
    /// Nullifiers for the input commitments, proving ownership and preventing double-spending.
    /// Each nullifier can only be used once and reveals no information about the input.
    pub input_nullifiers: Array<u256>,
    /// New commitments for the transaction outputs.
    /// These will be inserted into the Merkle tree after verification.
    pub output_commitments: Array<u256>,
    /// The public amount that must be consistent with the external data.
    /// Calculated as ext_amount - fee and used for zero-knowledge proof verification.
    pub public_amount: u256,
    /// Hash of the external data for consistency verification.
    /// Ensures the proof corresponds to the provided external data.
    pub ext_data_hash: u256,
}

/// Account information for user registration in the privacy system.
///
/// This structure contains the public information needed to identify
/// and communicate with users in the privacy-preserving system.
///
/// # Registration Process
/// - Users register their public key with the contract
/// - The public key is used for encrypted communication
/// - Only the owner can register their own account
#[derive(Debug, Drop, PartialEq, Serde)]
pub struct Account {
    /// The owner's contract address that controls this account.
    /// Must match the caller's address during registration.
    pub owner: ContractAddress,
    /// The public key used for encrypted communication and transaction verification.
    /// Used to encrypt transaction outputs and verify transaction signatures.
    pub public_key: ByteArray,
}
