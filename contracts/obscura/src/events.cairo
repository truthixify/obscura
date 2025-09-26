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
//! - **Token Management Events**: Track token whitelist changes and emergency rescues

use starknet::ContractAddress;

/// Event emitted when a new commitment is added to the Merkle tree.
///
/// This event is emitted for each new commitment created during a privacy-preserving
/// transaction. It provides the commitment hash, its index in the tree, the token
/// address associated with the commitment, and the encrypted output data for the recipient.
///
/// # Privacy Considerations
/// - The commitment hash reveals no information about the transaction amount
/// - The encrypted output can only be decrypted by the intended recipient
/// - The index provides ordering information without revealing transaction details
/// - The token address enables filtering commitments by token type
///
/// # Usage
/// - External systems can track the growth of the Merkle tree
/// - Recipients can scan for their encrypted outputs using their private key
/// - Token-specific filtering allows tracking commitments for specific ERC20 tokens
/// - Provides transparency while maintaining transaction privacy
#[derive(Drop, starknet::Event)]
pub struct NewCommitment {
    /// The commitment hash that was added to the Merkle tree.
    /// This is a cryptographic commitment to the transaction output.
    pub commitment: u256,
    /// The index of the commitment in the Merkle tree.
    /// Provides ordering information for tree construction.
    pub index: u32,
    /// The ERC20 token contract address associated with this commitment.
    /// This is a key field for efficient event filtering by token type.
    #[key]
    pub token_address: ContractAddress,
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

/// Event emitted when tokens are rescued from the contract in emergency situations.
///
/// This event is emitted when the contract owner uses the rescue functionality
/// to recover tokens that may be stuck in the contract due to various issues.
///
/// # Administrative Purpose
/// - Provides transparency for emergency token recovery operations
/// - Allows tracking of rescued tokens and recipients
/// - Ensures accountability for owner-only rescue operations
///
/// # Usage
/// - External systems can monitor emergency token rescues
/// - Provides audit trail for administrative actions
/// - Enables transparency while maintaining emergency capabilities
#[derive(Drop, starknet::Event)]
pub struct TokenRescued {
    /// The ERC20 token contract address that was rescued.
    /// This is a key field for efficient event filtering.
    #[key]
    pub token_address: ContractAddress,
    /// The recipient address that received the rescued tokens.
    /// This is a key field for efficient event filtering.
    #[key]
    pub recipient: ContractAddress,
    /// The amount of tokens that were rescued.
    /// Provides transparency about the rescue operation.
    pub amount: u256,
}

/// Event emitted when a new token is added to the whitelist.
///
/// This event is emitted when the contract owner adds a new ERC20 token
/// to the list of supported tokens for privacy-preserving transactions.
///
/// # Token Management Purpose
/// - Provides transparency for token whitelist additions
/// - Allows tracking of supported tokens and their indices
/// - Enables external systems to monitor token support changes
///
/// # Usage
/// - External systems can track newly supported tokens
/// - Users can be notified when new tokens become available
/// - Provides audit trail for token management decisions
#[derive(Drop, starknet::Event)]
pub struct TokenAdded {
    /// The ERC20 token contract address that was added to the whitelist.
    /// This is a key field for efficient event filtering.
    #[key]
    pub token_address: ContractAddress,
    /// The index assigned to the token in the whitelist.
    /// Used for efficient token enumeration and lookup.
    pub token_index: u8,
}

/// Event emitted when multiple tokens are added to the whitelist in a batch operation.
///
/// This event is emitted when the contract owner adds multiple ERC20 tokens
/// to the list of supported tokens for privacy-preserving transactions in a single transaction.
/// This provides more efficient event emission compared to individual TokenAdded events.
///
/// # Batch Token Management Purpose
/// - Provides transparency for batch token whitelist additions
/// - Allows tracking of multiple supported tokens and their indices in one event
/// - Enables external systems to monitor bulk token support changes efficiently
/// - Reduces gas costs and event processing overhead for bulk operations
///
/// # Event Structure
/// - Contains an array of tuples where each tuple represents (token_address, token_index)
/// - Each tuple corresponds to one token that was successfully added to the whitelist
/// - The token_index represents the position assigned to that token in the whitelist
///
/// # Usage
/// - External systems can track newly supported tokens in bulk with a single event
/// - Users can be notified when multiple new tokens become available simultaneously
/// - Provides complete audit trail for batch token management decisions
/// - Enables efficient indexing and querying of bulk token additions
///
/// # Example
/// If tokens A, B, and C are added with indices 5, 6, and 7 respectively,
/// the event will contain: [(A, 5), (B, 6), (C, 7)]
#[derive(Drop, starknet::Event)]
pub struct TokensBatchAdded {
    /// Array of tuples containing (token_address, token_index) pairs for tokens added to the
    /// whitelist.
    /// Each tuple represents a token that was successfully added with its assigned index.
    /// The order of tuples corresponds to the order of processing during the batch operation.
    pub tokens: Array<(ContractAddress, u8)>,
}

/// Event emitted when a token is removed from the whitelist.
///
/// This event is emitted when the contract owner removes an ERC20 token
/// from the list of supported tokens for privacy-preserving transactions.
///
/// # Token Management Purpose
/// - Provides transparency for token whitelist removals
/// - Allows tracking of token support changes
/// - Enables external systems to monitor token availability
///
/// # Usage
/// - External systems can track when tokens are no longer supported
/// - Users can be notified when tokens become unavailable
/// - Provides audit trail for token management decisions
#[derive(Drop, starknet::Event)]
pub struct TokenRemoved {
    /// The ERC20 token contract address that was removed from the whitelist.
    /// This is a key field for efficient event filtering.
    #[key]
    pub token_address: ContractAddress,
    /// The index that was previously assigned to the token in the whitelist.
    /// Provides reference to the token's former position.
    pub token_index: u8,
}

/// Event emitted when multiple tokens are removed from the whitelist in a batch operation.
///
/// This event is emitted when the contract owner removes multiple ERC20 tokens
/// from the list of supported tokens for privacy-preserving transactions in a single transaction.
/// This provides more efficient event emission compared to individual TokenRemoved events.
///
/// # Batch Token Management Purpose
/// - Provides transparency for batch token whitelist removals
/// - Allows tracking of multiple token support changes in one event
/// - Enables external systems to monitor bulk token availability changes efficiently
/// - Reduces gas costs and event processing overhead for bulk operations
///
/// # Event Structure
/// - Contains an array of tuples where each tuple represents (token_address, token_index)
/// - Each tuple corresponds to one token that was successfully removed from the whitelist
/// - The token_index represents the former position that token held in the whitelist
///
/// # Usage
/// - External systems can track when multiple tokens are no longer supported with a single event
/// - Users can be notified when multiple tokens become unavailable simultaneously
/// - Provides complete audit trail for batch token management decisions
/// - Enables efficient indexing and querying of bulk token removals
///
/// # Example
/// If tokens A, B, and C are removed with former indices 3, 7, and 12 respectively,
/// the event will contain: [(A, 3), (B, 7), (C, 12)]
#[derive(Drop, starknet::Event)]
pub struct TokensBatchRemoved {
    /// Array of tuples containing (token_address, token_index) pairs for tokens removed from the
    /// whitelist.
    /// Each tuple represents a token that was successfully removed with its former index.
    /// The order of tuples corresponds to the order of processing during the batch operation.
    pub tokens: Array<(ContractAddress, u8)>,
}
