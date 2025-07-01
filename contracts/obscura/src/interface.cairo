//! # Interface Module
//!
//! This module defines the external interface for the Obscura privacy-preserving smart contract.
//! The interface provides the public API that users and other contracts can interact with
//! to perform privacy-preserving transactions and manage the system.
//!
//! ## Core Functions
//!
//! The interface is organized into several categories:
//! - **Account Management**: User registration and key management
//! - **Transaction Processing**: Privacy-preserving transaction execution
//! - **System Configuration**: Administrative functions for system parameters
//! - **Query Functions**: Read-only functions for system state and limits

use crate::custom_type::I256;
use crate::structs::{Account, ExtData, Proof};

/// External interface for the Obscura privacy-preserving smart contract.
///
/// This trait defines all the public functions that can be called on the Obscura contract.
/// It provides a complete API for privacy-preserving transactions, account management,
/// and system configuration.
#[starknet::interface]
pub trait IObscura<TContractState> {
    /// Registers a new account in the privacy system.
    ///
    /// This function allows users to register their public key for encrypted communication.
    /// Only the owner of the account can register it, ensuring proper key management.
    ///
    /// # Arguments
    /// * `account` - The account information containing owner address and public key
    ///
    /// # Events
    /// Emits a `PublicKey` event with the registered account information.
    ///
    /// # Security
    /// - Only the account owner can register their own account
    /// - Public key is stored for encrypted communication
    fn register(ref self: TContractState, account: Account);

    /// Executes a privacy-preserving transaction using zero-knowledge proofs.
    ///
    /// This is the core function for privacy-preserving transactions. It verifies
    /// zero-knowledge proofs, processes token transfers, and updates the Merkle tree.
    ///
    /// # Arguments
    /// * `args` - The zero-knowledge proof and transaction data
    /// * `ext_data` - External data for deposits/withdrawals and fee handling
    ///
    /// # Process
    /// 1. Verifies the zero-knowledge proof is valid
    /// 2. Checks that input nullifiers haven't been spent
    /// 3. Processes external token transfers (deposits/withdrawals)
    /// 4. Updates the Merkle tree with new commitments
    /// 5. Emits events for commitments and nullifiers
    ///
    /// # Security
    /// - All cryptographic proofs are verified externally
    /// - Double-spending is prevented through nullifier tracking
    /// - External data consistency is enforced
    fn transact(ref self: TContractState, args: Proof, ext_data: ExtData);

    /// Combines account registration and transaction execution in a single call.
    ///
    /// This convenience function allows new users to register and immediately
    /// perform their first privacy-preserving transaction.
    ///
    /// # Arguments
    /// * `account` - The account information to register
    /// * `args` - The zero-knowledge proof and transaction data
    /// * `ext_data` - External data for deposits/withdrawals and fee handling
    ///
    /// # Process
    /// 1. Registers the account (equivalent to calling `register`)
    /// 2. Executes the transaction (equivalent to calling `transact`)
    ///
    /// # Use Case
    /// - Optimizes gas usage for new users
    /// - Reduces the number of required transactions
    fn register_and_transact(
        ref self: TContractState, account: Account, args: Proof, ext_data: ExtData,
    );

    /// Configures system limits and parameters (owner-only function).
    ///
    /// This administrative function allows the contract owner to update
    /// system parameters such as maximum deposit amounts.
    ///
    /// # Arguments
    /// * `maximum_deposit_amount` - The new maximum amount allowed for deposits
    ///
    /// # Access Control
    /// - Only the contract owner can call this function
    /// - Used for system maintenance and parameter updates
    fn configure_limits(ref self: TContractState, maximum_deposit_amount: u256);

    /// Calculates the public amount for zero-knowledge proof verification.
    ///
    /// This function computes the public amount that must be consistent with
    /// the external data and zero-knowledge proof for transaction validation.
    ///
    /// # Arguments
    /// * `ext_amount` - The external amount (positive for deposits, negative for withdrawals)
    /// * `fee` - The transaction fee paid to the relayer
    ///
    /// # Returns
    /// * The calculated public amount for proof verification
    ///
    /// # Formula
    /// public_amount = ext_amount - fee (with proper field arithmetic)
    fn calculate_public_amount(self: @TContractState, ext_amount: I256, fee: u256) -> u256;

    /// Checks if a nullifier has already been spent.
    ///
    /// This function verifies whether a specific nullifier has been used
    /// in a previous transaction, preventing double-spending.
    ///
    /// # Arguments
    /// * `nullifier_hash` - The nullifier hash to check
    ///
    /// # Returns
    /// * `true` if the nullifier has been spent, `false` otherwise
    ///
    /// # Security
    /// - Critical for preventing double-spending attacks
    /// - Used during transaction verification
    fn is_spent(self: @TContractState, nullifier_hash: u256) -> bool;

    /// Returns the finite field size used in cryptographic operations.
    ///
    /// This function provides access to the system's mathematical foundation
    /// for external verification and compatibility checks.
    ///
    /// # Returns
    /// * The field size constant used in zero-knowledge proofs
    fn field_size(self: @TContractState) -> u256;

    /// Returns the maximum allowed external amount for transactions.
    ///
    /// This function provides the current system limit for deposits
    /// and withdrawals to ensure compliance.
    ///
    /// # Returns
    /// * The maximum external amount constant
    fn max_ext_amount(self: @TContractState) -> u256;

    /// Returns the minimum allowed external amount for transactions.
    ///
    /// This function provides the current system minimum for deposits
    /// and withdrawals to prevent dust attacks.
    ///
    /// # Returns
    /// * The minimum external amount constant
    fn min_ext_amount(self: @TContractState) -> u256;

    /// Returns the maximum allowed fee amount for transactions.
    ///
    /// This function provides the current system limit for transaction
    /// fees to prevent economic attacks.
    ///
    /// # Returns
    /// * The maximum fee constant
    fn max_fee(self: @TContractState) -> u256;
}
