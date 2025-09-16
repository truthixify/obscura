//! # Interface Module
//!
//! This module defines the external interface for the Obscura privacy-preserving smart contract.
//! The interface provides the public API that users and other contracts can interact with
//! to perform privacy-preserving transactions and manage the multitoken system.
//!
//! ## Core Functions
//!
//! The interface is organized into several categories:
//! - **Account Management**: User registration and key management
//! - **Transaction Processing**: Privacy-preserving transaction execution with multitoken support
//! - **Token Management**: Administrative functions for managing supported tokens
//! - **System Configuration**: Administrative functions for system parameters
//! - **Query Functions**: Read-only functions for system state, limits, and token information

use starknet::ContractAddress;
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

    /// Executes a privacy-preserving transaction using zero-knowledge proofs with multitoken
    /// support.
    ///
    /// This is the core function for privacy-preserving transactions. It verifies
    /// zero-knowledge proofs, processes token transfers, and updates the Merkle tree.
    /// The function now supports multiple ERC20 tokens through the token_address parameter.
    ///
    /// # Arguments
    /// * `args` - The zero-knowledge proof and transaction data
    /// * `ext_data` - External data for deposits/withdrawals and fee handling
    /// * `token_address` - The ERC20 token contract address (must be whitelisted)
    ///
    /// # Process
    /// 1. Validates that the token is whitelisted and allowed
    /// 2. Verifies the zero-knowledge proof is valid
    /// 3. Checks that input nullifiers haven't been spent
    /// 4. Processes external token transfers (deposits/withdrawals) for the specified token
    /// 5. Updates the Merkle tree with new commitments
    /// 6. Emits events for commitments and nullifiers
    ///
    /// # Security
    /// - Only whitelisted tokens can be used in transactions
    /// - All cryptographic proofs are verified externally
    /// - Double-spending is prevented through nullifier tracking
    /// - External data consistency is enforced
    fn transact(
        ref self: TContractState, args: Proof, ext_data: ExtData, token_address: ContractAddress,
    );

    /// Combines account registration and transaction execution in a single call with multitoken
    /// support.
    ///
    /// This convenience function allows new users to register and immediately
    /// perform their first privacy-preserving transaction with any whitelisted token.
    ///
    /// # Arguments
    /// * `account` - The account information to register
    /// * `args` - The zero-knowledge proof and transaction data
    /// * `ext_data` - External data for deposits/withdrawals and fee handling
    /// * `token_address` - The ERC20 token contract address (must be whitelisted)
    ///
    /// # Process
    /// 1. Registers the account (equivalent to calling `register`)
    /// 2. Executes the transaction (equivalent to calling `transact`) with the specified token
    ///
    /// # Use Case
    /// - Optimizes gas usage for new users
    /// - Reduces the number of required transactions
    /// - Supports immediate multitoken transactions upon registration
    fn register_and_transact(
        ref self: TContractState,
        account: Account,
        args: Proof,
        ext_data: ExtData,
        token_address: ContractAddress,
    );

    /// Rescues tokens from the contract in emergency situations (owner-only function).
    ///
    /// This administrative function allows the contract owner to recover tokens
    /// that may be stuck in the contract due to various issues.
    ///
    /// # Arguments
    /// * `recipient` - The address to receive the rescued tokens
    /// * `token_address` - The ERC20 token contract address to rescue
    /// * `amount` - The amount of tokens to rescue
    ///
    /// # Access Control
    /// - Only the contract owner can call this function
    /// - Used for emergency token recovery situations
    ///
    /// # Events
    /// Emits a `TokenRescued` event with the rescue details.
    fn rescue_token(
        ref self: TContractState,
        recipient: ContractAddress,
        token_address: ContractAddress,
        amount: u256,
    );

    /// Adds a new token to the whitelist of supported tokens (owner-only function).
    ///
    /// This administrative function allows the contract owner to add new ERC20 tokens
    /// that can be used in privacy-preserving transactions.
    ///
    /// # Arguments
    /// * `token_address` - The ERC20 token contract address to add
    ///
    /// # Access Control
    /// - Only the contract owner can call this function
    /// - Token must not already be in the whitelist
    /// - Token address must be non-zero
    ///
    /// # Events
    /// Emits a `TokenAdded` event with the token address and index.
    fn add_token(ref self: TContractState, token_address: ContractAddress);

    /// Removes a token from the whitelist of supported tokens (owner-only function).
    ///
    /// This administrative function allows the contract owner to remove ERC20 tokens
    /// from the list of supported tokens for privacy-preserving transactions.
    ///
    /// # Arguments
    /// * `token_address` - The ERC20 token contract address to remove
    ///
    /// # Access Control
    /// - Only the contract owner can call this function
    /// - Token must currently be in the whitelist
    /// - Token address must be non-zero
    ///
    /// # Events
    /// Emits a `TokenRemoved` event with the token address and index.
    fn remove_token(ref self: TContractState, token_address: ContractAddress);

    /// Adds multiple tokens to the whitelist in a single transaction (owner-only function).
    ///
    /// This administrative function allows the contract owner to efficiently add multiple
    /// ERC20 tokens to the whitelist in a single transaction, reducing gas costs.
    ///
    /// # Arguments
    /// * `token_addresses` - Array of ERC20 token contract addresses to add
    ///
    /// # Access Control
    /// - Only the contract owner can call this function
    /// - All tokens must not already be in the whitelist
    /// - All token addresses must be non-zero
    ///
    /// # Benefits
    /// - Reduces transaction costs for adding multiple tokens
    /// - Maintains consistency with individual add_token validation
    /// - Simplifies bulk token management operations
    ///
    /// # Events
    /// Emits a `TokensBatchAdded` event with an array of (token_address, token_index) tuples.
    fn batch_add_tokens(ref self: TContractState, token_addresses: Array<ContractAddress>);

    /// Removes multiple tokens from the whitelist in a single transaction (owner-only function).
    ///
    /// This administrative function allows the contract owner to efficiently remove multiple
    /// ERC20 tokens from the whitelist in a single transaction, reducing gas costs.
    ///
    /// # Arguments
    /// * `token_addresses` - Array of ERC20 token contract addresses to remove
    ///
    /// # Access Control
    /// - Only the contract owner can call this function
    /// - All tokens must currently be in the whitelist
    /// - All token addresses must be non-zero
    ///
    /// # Benefits
    /// - Reduces transaction costs for removing multiple tokens
    /// - Maintains consistency with individual remove_token validation
    /// - Simplifies bulk token management operations
    ///
    /// # Events
    /// Emits a `TokensBatchRemoved` event with an array of (token_address, token_index) tuples.
    fn batch_remove_tokens(ref self: TContractState, token_addresses: Array<ContractAddress>);

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

    /// Checks if a token is whitelisted and allowed for transactions.
    ///
    /// This function verifies whether a specific ERC20 token is in the
    /// whitelist of supported tokens for privacy-preserving transactions.
    ///
    /// # Arguments
    /// * `token_address` - The ERC20 token contract address to check
    ///
    /// # Returns
    /// * `true` if the token is whitelisted, `false` otherwise
    ///
    /// # Usage
    /// - Used to validate tokens before transactions
    /// - Helps users verify token support
    fn is_token_allowed(self: @TContractState, token_address: ContractAddress) -> bool;

    /// Gets the token balance for a specific account.
    ///
    /// This function queries the ERC20 token contract to get the balance
    /// of a specific account for a given token.
    ///
    /// # Arguments
    /// * `token_address` - The ERC20 token contract address
    /// * `account` - The account address to query
    ///
    /// # Returns
    /// * The token balance of the account
    ///
    /// # Usage
    /// - Used to check balances before transactions
    /// - Helps users verify available funds
    fn get_token_balance(
        self: @TContractState, token_address: ContractAddress, account: ContractAddress,
    ) -> u256;

    /// Gets the total number of whitelisted tokens.
    ///
    /// This function returns the count of tokens currently in the whitelist.
    ///
    /// # Returns
    /// * The number of whitelisted tokens
    ///
    /// # Usage
    /// - Used to iterate through all supported tokens
    /// - Helps determine the size of the token whitelist
    fn get_token_count(self: @TContractState) -> u8;

    /// Gets a token address by its index in the whitelist.
    ///
    /// This function retrieves a token address from the whitelist using its index.
    ///
    /// # Arguments
    /// * `index` - The index of the token in the whitelist
    ///
    /// # Returns
    /// * The token contract address at the specified index
    ///
    /// # Usage
    /// - Used to iterate through all supported tokens
    /// - Enables enumeration of the token whitelist
    fn get_token_by_index(self: @TContractState, index: u8) -> ContractAddress;

    /// Gets all whitelisted token addresses.
    ///
    /// This function returns an array containing all token addresses
    /// currently in the whitelist.
    ///
    /// # Returns
    /// * An array of all whitelisted token contract addresses
    ///
    /// # Usage
    /// - Convenient way to get all supported tokens at once
    /// - Useful for UI applications and token selection
    fn get_all_tokens(self: @TContractState) -> Array<ContractAddress>;
}
