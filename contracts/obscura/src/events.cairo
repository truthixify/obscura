//! # Events Module
//!
//! This module defines the events emitted by the Obscura privacy-preserving smart contract.
//! These events provide transparency and allow external systems to track the state
//! of the privacy system while maintaining the privacy of individual transactions.
//!
//! ## Event Categories
//!
//! The events are organized into several categories:
//! - **Commitment Events**: Track new commitments added to the Merkle tree
//! - **Nullifier Events**: Track spent inputs to prevent double-spending
//! - **Account Events**: Track user registration and key management

use starknet::ContractAddress;

/// Event emitted when a new commitment is added to the Merkle tree.
///
/// This event is emitted for each new commitment created during a privacy-preserving
/// transaction. It provides the commitment hash, its index in the tree, and the
/// encrypted output data for the recipient.
///
/// # Privacy Considerations
/// - The commitment hash reveals no information about the transaction amount
/// - The encrypted output can only be decrypted by the intended recipient
/// - The index provides ordering information without revealing transaction details
///
/// # Usage
/// - External systems can track the growth of the Merkle tree
/// - Recipients can scan for their encrypted outputs using their private key
/// - Provides transparency while maintaining transaction privacy
#[derive(Drop, starknet::Event)]
pub struct NewCommitment {
    /// The commitment hash that was added to the Merkle tree.
    /// This is a cryptographic commitment to the transaction output.
    pub commitment: u256,
    /// The index of the commitment in the Merkle tree.
    /// Provides ordering information for tree construction.
    pub index: u32,
    /// The encrypted output data for the transaction recipient.
    /// Contains private transaction details encrypted with the recipient's public key.
    pub encrypted_output: ByteArray,
}

/// Event emitted when a nullifier is used to spend an input.
///
/// This event is emitted for each input nullifier used in a privacy-preserving
/// transaction. It ensures that each input can only be spent once, preventing
/// double-spending attacks.
///
/// # Security Purpose
/// - Prevents double-spending by tracking spent inputs
/// - The nullifier reveals no information about the original input
/// - Provides cryptographic proof of input ownership and spending
///
/// # Usage
/// - External systems can track spent inputs
/// - Enables efficient double-spending detection
/// - Maintains privacy while ensuring transaction validity
#[derive(Drop, starknet::Event)]
pub struct NewNullifier {
    /// The nullifier hash that was used to spend an input.
    /// This is a cryptographic proof that the input was owned and spent.
    pub nullifier: u256,
}

/// Event emitted when a user registers their public key.
///
/// This event is emitted when a user registers their account in the privacy system.
/// It provides transparency about user registration while maintaining the privacy
/// of their transactions.
///
/// # Registration Process
/// - Users must register before they can receive encrypted outputs
/// - The public key is used for encrypted communication
/// - Only the account owner can register their own account
///
/// # Privacy Features
/// - The public key is necessary for encrypted communication
/// - Registration does not reveal transaction history or balances
/// - Enables privacy-preserving communication between users
#[derive(Drop, starknet::Event)]
pub struct PublicKey {
    /// The owner's contract address that controls this account.
    /// This is the key field used for indexing and querying events.
    #[key]
    pub owner: ContractAddress,
    /// The public key used for encrypted communication.
    /// Used to encrypt transaction outputs and verify transaction signatures.
    pub key: ByteArray,
}
