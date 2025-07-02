//! # Errors Module
//!
//! This module defines error constants used throughout the Obscura privacy-preserving smart
//! contract.
//! These error messages provide clear feedback when operations fail, helping users
//! understand what went wrong and how to fix it.
//!
//! ## Error Categories
//!
//! The errors are organized into several categories:
//! - **Access Control Errors**: Authorization and permission issues
//! - **Validation Errors**: Input validation and constraint violations
//! - **Cryptographic Errors**: Proof verification and security issues
//! - **System Errors**: Operational and state-related issues

/// Error message for unauthorized account registration attempts.
///
/// This error is thrown when someone tries to register an account that doesn't
/// belong to them. Only the account owner can register their own account.
///
/// # When Thrown
/// - Caller address doesn't match the account owner address
/// - Attempting to register someone else's account
///
/// # Resolution
/// - Ensure the caller is the account owner
/// - Use the correct account address for registration
pub const ERROR_ONLY_OWNER_CAN_BE_REGISTERED: felt252 = 'Only owner can be registered';

/// Error message for invalid Merkle root in transaction proofs.
///
/// This error is thrown when a transaction proof references a Merkle root
/// that is not in the recent history of valid roots.
///
/// # When Thrown
/// - The root in the proof is not found in the recent history
/// - The root is zero (invalid)
/// - The root is too old and has been rotated out
///
/// # Resolution
/// - Use a recent, valid Merkle root
/// - Ensure the proof is based on current state
pub const ERROR_INVALID_MERKLE_ROOT: felt252 = 'Invalid merkle root';

/// Error message for attempting to spend already spent inputs.
///
/// This error is thrown when a transaction tries to use a nullifier that
/// has already been used in a previous transaction.
///
/// # When Thrown
/// - Input nullifier has already been spent
/// - Attempting to double-spend an input
/// - Nullifier is already in the spent set
///
/// # Resolution
/// - Use fresh, unspent inputs for new transactions
/// - Check input status before creating proofs
pub const ERROR_INPUT_ALREADY_SPENT: felt252 = 'Input is already spent';

/// Error message for invalid recipient addresses.
///
/// This error is thrown when a withdrawal transaction specifies a zero
/// address as the recipient.
///
/// # When Thrown
/// - Recipient address is zero (0x0)
/// - Attempting to withdraw to an invalid address
///
/// # Resolution
/// - Use a valid, non-zero recipient address
/// - Ensure the recipient address is properly formatted
pub const ERROR_ZERO_ADDRESS: felt252 = 'Invalid cannot be address';

/// Error message for invalid fee amounts.
///
/// This error is thrown when a transaction fee exceeds the maximum
/// allowed fee or is otherwise invalid.
///
/// # When Thrown
/// - Fee amount exceeds MAX_FEE
/// - Fee calculation results in overflow
/// - Fee is negative or invalid
///
/// # Resolution
/// - Use a fee amount within the system limits
/// - Ensure fee calculation is correct
pub const ERROR_INVALID_FEE: felt252 = 'Invalid fee';

/// Error message for invalid external amounts.
///
/// This error is thrown when the external amount (deposit/withdrawal)
/// is outside the allowed range or invalid.
///
/// # When Thrown
/// - Amount exceeds MAX_EXT_AMOUNT
/// - Amount is below MIN_EXT_AMOUNT
/// - Amount calculation results in overflow
///
/// # Resolution
/// - Use an amount within the system limits
/// - Ensure amount calculation is correct
pub const ERROR_INVALID_EXT_AMOUNT: felt252 = 'Invalid ext amount';

/// Error message for invalid Merkle tree depth.
///
/// This error is thrown when attempting to create a Merkle tree with
/// an invalid depth (too shallow or too deep).
///
/// # When Thrown
/// - Tree depth is 0 (too shallow)
/// - Tree depth is >= 32 (too deep)
/// - Invalid depth parameter during initialization
///
/// # Resolution
/// - Use a depth between 1 and 31
/// - Consider gas costs and storage requirements
pub const ERROR_INVALID_TREE_DEPTH: felt252 = 'Invalid tree depth';

/// Error message for attempting to insert into a full Merkle tree.
///
/// This error is thrown when the Merkle tree has reached its maximum
/// capacity and cannot accept new commitments.
///
/// # When Thrown
/// - Tree has 2^levels commitments (maximum capacity)
/// - No more space available for new commitments
///
/// # Resolution
/// - Wait for commitments to be spent (creating space)
/// - Consider upgrading to a larger tree if needed
pub const ERROR_MERKLE_TREE_IS_FULL: felt252 = 'Merkle tree is full';

/// Error message for incorrect external data hash.
///
/// This error is thrown when the hash of the external data doesn't match
/// the hash provided in the zero-knowledge proof.
///
/// # When Thrown
/// - External data hash mismatch
/// - Proof was generated with different external data
/// - Data tampering or corruption detected
///
/// # Resolution
/// - Ensure external data matches the proof
/// - Regenerate proof with correct external data
pub const ERROR_INCORRECT_EXT_HASH: felt252 = 'Incorrect external data hash';

/// Error message for invalid public amount in proof.
///
/// This error is thrown when the public amount in the zero-knowledge proof
/// doesn't match the calculated public amount from external data.
///
/// # When Thrown
/// - Public amount mismatch between proof and calculation
/// - Proof was generated with incorrect amounts
/// - Fee calculation error
///
/// # Resolution
/// - Ensure amounts are calculated correctly
/// - Regenerate proof with correct amounts
pub const ERROR_INVALID_PUBLIC_AMOUNT: felt252 = 'Invalid public amount';

/// Error message for invalid transaction proof.
///
/// This error is thrown when the zero-knowledge proof fails verification
/// by the external proof verifier contract.
///
/// # When Thrown
/// - Cryptographic proof verification fails
/// - Proof is malformed or invalid
/// - Proof was generated with incorrect inputs
///
/// # Resolution
/// - Regenerate proof with correct inputs
/// - Ensure all proof components are valid
pub const ERROR_INVALID_TRANSACTION_PROOF: felt252 = 'Invalid transaction proof';

/// Error message for deposit amounts exceeding the maximum limit.
///
/// This error is thrown when a deposit amount exceeds the configured
/// maximum deposit amount for the system.
///
/// # When Thrown
/// - Deposit amount > maximum_deposit_amount
/// - Attempting to deposit more than allowed
///
/// # Resolution
/// - Reduce deposit amount to within limits
/// - Split large deposits into smaller transactions
pub const ERROR_AMOUNT_LARGER_THAN_MAXIMUM_DEPOSIT: felt252 = 'Deposit amount is too large';
