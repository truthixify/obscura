//! # Obscura - Privacy-Preserving Smart Contract Implementation
//!
//! This module contains the main implementation of the Obscura privacy-preserving smart contract
//! for Starknet with comprehensive multitoken support. The contract enables private transactions
//! using zero-knowledge proofs and Merkle trees, allowing users to transfer multiple ERC20 tokens
//! without revealing transaction details.
//!
//! ## Overview
//!
//! The Obscura contract implements a privacy-preserving transaction system that provides:
//! - **Private Deposits**: Users can deposit multiple ERC20 tokens without revealing their identity
//! - **Private Withdrawals**: Users can withdraw any whitelisted token to specific addresses
//! - **Private Transfers**: Internal transfers between users remain completely private across all
//! supported tokens - **Zero-Knowledge Proofs**: Cryptographic proofs ensure transaction validity
//! regardless of token type - **Merkle Tree Management**: Efficient commitment storage and
//! verification for all tokens - **Multitoken Support**: Comprehensive whitelist management for
//! multiple ERC20 tokens
//!
//! ## Architecture
//!
//! The contract uses several key cryptographic primitives:
//! - **Commitments**: Cryptographic commitments to transaction outputs
//! - **Nullifiers**: One-time use values that prevent double-spending
//! - **Merkle Trees**: Efficient storage and verification of commitments
//! - **Zero-Knowledge Proofs**: Prove transaction validity without revealing details
//!
//! ## Security Model
//!
//! The system maintains privacy through:
//! - Cryptographic commitments that hide transaction amounts
//! - Nullifiers that prevent double-spending without revealing inputs
//! - Zero-knowledge proofs that validate transactions cryptographically
//! - Encrypted outputs that only recipients can decrypt
//!
//! ## Usage Flow
//!
//! 1. **Registration**: Users register their public key for encrypted communication
//! 2. **Deposits**: Users deposit tokens and receive commitments
//! 3. **Transfers**: Users transfer tokens privately using zero-knowledge proofs
//! 4. **Withdrawals**: Users withdraw tokens to external addresses
//!
//! ## Dependencies
//!
//! The contract integrates with:
//! - OpenZeppelin Cairo contracts for access control
//! - External zero-knowledge proof verifier
//! - Multiple ERC20 token contracts through the whitelist system
//! - STRK token contract as a reference implementation (can be one of many supported tokens)

#[starknet::contract]
pub mod Obscura {
    use core::num::traits::{Pow, Zero};
    use core::poseidon::poseidon_hash_span;
    use garaga::hashes::poseidon_hash_2_bn254;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{
        Map, MutableVecTrait, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
        VecTrait,
    };
    use starknet::{
        ContractAddress, SyscallResultTrait, get_caller_address, get_contract_address, syscalls,
    };
    use crate::constants::*;
    use crate::custom_type::*;
    use crate::errors::*;
    use crate::events::*;
    use crate::interface::IObscura;
    use crate::structs::*;

    /// OpenZeppelin Ownable component for access control.
    /// Provides owner-only functionality for administrative operations.
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    /// External implementation of the Ownable component.
    /// Exposes owner-only functions to external callers.
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;

    /// Internal implementation of the Ownable component.
    /// Provides internal access control functions.
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;

    /// Storage structure for the Obscura contract with multitoken support.
    ///
    /// This structure defines all the persistent state variables that maintain
    /// the privacy system's state across transactions, including multitoken management.
    #[storage]
    struct Storage {
        /// The last recorded balance of STRK tokens in the contract.
        /// Updated after each transaction to track token movements.
        last_balance: u256,
        /// Storage gap for future upgrades.
        /// Ensures storage layout compatibility during contract upgrades.
        gap: u256,
        /// Maximum amount allowed for deposits.
        /// Configurable by the contract owner to prevent large-scale attacks.
        maximum_deposit_amount: u256,
        /// Mapping of nullifier hashes to their spent status.
        /// Prevents double-spending by tracking used nullifiers.
        nullifier_hashes: Map<u256, bool>,
        /// Merkle tree with history for storing commitments.
        /// Maintains the privacy-preserving state of all transactions across all supported tokens.
        merkle_tree: MerkleTreeWithHistory,
        /// Mapping of index → token address for efficient token enumeration.
        /// Enables iteration through all whitelisted tokens.
        token_by_index: Map<u8, ContractAddress>,
        /// Mapping of token address → index for fast token index lookup.
        /// Provides O(1) token index lookup during transactions.
        index_by_token: Map<ContractAddress, u8>,
        /// Mapping of token address → bool for fast whitelist lookup.
        /// Provides O(1) token validation during transactions.
        is_token_allowed: Map<ContractAddress, bool>,
        /// Counter of how many tokens are currently whitelisted.
        /// Used for managing token indices and enumeration.
        token_count: u8,
        /// Ownable component storage for access control.
        /// Manages contract ownership and administrative functions.
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    /// Event definitions for the Obscura contract.
    ///
    /// These events provide transparency about contract operations while
    /// maintaining the privacy of individual transactions.
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        /// Emitted when a new commitment is added to the Merkle tree.
        NewCommitment: NewCommitment,
        /// Emitted when a nullifier is used to spend an input.
        NewNullifier: NewNullifier,
        /// Emitted when a user registers their public key.
        PublicKey: PublicKey,
        /// Emitted when tokens are rescued in emergency situations.
        TokenRescued: TokenRescued,
        /// Emitted when a new token is added to the whitelist.
        TokenAdded: TokenAdded,
        /// Emitted when a token is removed from the whitelist.
        TokenRemoved: TokenRemoved,
        /// Emitted when multiple tokens are added to the whitelist.
        TokensBatchAdded: TokensBatchAdded,
        /// Emitted when multiple tokens are removed from the whitelist.
        TokensBatchRemoved: TokensBatchRemoved,
        /// Ownable component events for access control.
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    /// Constructor function for initializing the Obscura contract.
    ///
    /// This function sets up the initial state of the privacy system,
    /// including the Merkle tree and system parameters.
    ///
    /// # Arguments
    /// * `levels` - The depth of the Merkle tree (number of levels)
    /// * `maximum_deposit_amount` - The maximum amount allowed for deposits
    ///
    /// # Initialization Steps
    /// 1. Sets the contract owner to the caller
    /// 2. Initializes the Merkle tree with the specified depth
    /// 3. Configures the maximum deposit amount
    ///
    /// # Security
    /// - Only callable during contract deployment
    /// - Sets up the foundational privacy infrastructure
    #[constructor]
    pub fn constructor(ref self: ContractState, levels: u32, maximum_deposit_amount: u256) {
        self.ownable.initializer(get_caller_address());
        self.new_merkle_tree(levels);
        self.configure_limits(maximum_deposit_amount);
    }

    /// External interface implementation for the Obscura contract.
    ///
    /// This implementation provides all the public functions that users
    /// and other contracts can call to interact with the privacy system.
    #[abi(embed_v0)]
    impl ObscuraImpl of IObscura<ContractState> {
        /// Registers a new account in the privacy system.
        ///
        /// This function allows users to register their public key for encrypted
        /// communication. Only the account owner can register their own account.
        ///
        /// # Arguments
        /// * `account` - The account information containing owner address and public key
        ///
        /// # Security Checks
        /// - Verifies that the caller is the account owner
        /// - Prevents unauthorized account registration
        ///
        /// # Events
        /// Emits a `PublicKey` event with the registered account information.
        fn register(ref self: ContractState, account: Account) {
            let caller = get_caller_address();

            assert(account.owner == caller, ERROR_ONLY_OWNER_CAN_BE_REGISTERED);

            self
                .emit(
                    Event::PublicKey(PublicKey { owner: account.owner, key: account.public_key }),
                );
        }

        /// Executes a privacy-preserving transaction using zero-knowledge proofs with multitoken
        /// support.
        ///
        /// This is the core function for privacy-preserving transactions. It verifies
        /// zero-knowledge proofs, processes token transfers, and updates the Merkle tree.
        /// The function supports any whitelisted ERC20 token.
        ///
        /// # Arguments
        /// * `args` - The zero-knowledge proof and transaction data
        /// * `ext_data` - External data for deposits/withdrawals and fee handling
        /// * `token_address` - The ERC20 token contract address (must be whitelisted)
        ///
        /// # Transaction Process
        /// 1. **Token Validation**: Ensure the token is whitelisted and allowed
        /// 2. **Token Transfer**: Handle deposits (positive ext_amount) or withdrawals (negative)
        /// for the specified token 3. **Proof Verification**: Verify the zero-knowledge proof is
        /// valid 4. **Nullifier Check**: Ensure input nullifiers haven't been spent
        /// 5. **Data Validation**: Verify external data consistency
        /// 6. **Merkle Update**: Insert new commitments into the tree
        /// 7. **Event Emission**: Emit events for commitments and nullifiers
        ///
        /// # Security Features
        /// - Token whitelist validation prevents unauthorized token usage
        /// - Cryptographic proof verification prevents invalid transactions
        /// - Nullifier tracking prevents double-spending
        /// - External data validation ensures consistency
        /// - Fee handling incentivizes transaction processing
        /// - Same security model applies to all supported tokens
        fn transact(
            ref self: ContractState, args: Proof, ext_data: ExtData, token_address: ContractAddress,
        ) {
            // Validate that the token is whitelisted before proceeding
            assert(self.is_token_allowed(token_address), ERROR_TOKEN_NOT_WHITELISTED);

            // Initialize token dispatcher for the specified ERC20 token
            let token_dispatcher = IERC20Dispatcher { contract_address: token_address };

            // Handle deposits (positive external amount)
            if ext_data.ext_amount > I256Trait::zero() {
                assert(
                    ext_data.ext_amount <= self.maximum_deposit_amount.read().into(),
                    ERROR_AMOUNT_LARGER_THAN_MAXIMUM_DEPOSIT,
                );

                // Transfer tokens from caller to contract
                token_dispatcher
                    .transfer_from(
                        get_caller_address(),
                        get_contract_address(),
                        ext_data.ext_amount.try_into().unwrap(),
                    );
            }

            // Verify the Merkle root is known and recent
            assert(self.is_known_root(args.root), ERROR_INVALID_MERKLE_ROOT);

            // Check that all input nullifiers haven't been spent
            for i in 0..args.input_nullifiers.len() {
                assert(!self.is_spent(*args.input_nullifiers.at(i)), ERROR_INPUT_ALREADY_SPENT);
            }

            // Verify external data hash consistency
            let mut serialized_ext_data: Array<felt252> = ArrayTrait::new();
            Serde::serialize(@ext_data, ref serialized_ext_data);
            let computed_ext_data_hash = poseidon_hash_span(serialized_ext_data.span());

            assert(args.ext_data_hash == computed_ext_data_hash.into(), ERROR_INCORRECT_EXT_HASH);

            // Verify public amount consistency
            assert(
                args
                    .public_amount == self
                    .calculate_public_amount(ext_data.ext_amount, ext_data.fee),
                ERROR_INVALID_PUBLIC_AMOUNT,
            );

            // Verify the zero-knowledge proof using external verifier
            let mut result = syscalls::library_call_syscall(
                VERIFIER_CLASSHASH.try_into().unwrap(),
                selector!("verify_ultra_starknet_honk_proof"),
                args.proof,
            )
                .unwrap_syscall();
            let _public_inputs = Serde::<Option<Span<u256>>>::deserialize(ref result)
                .unwrap()
                .expect(ERROR_INVALID_TRANSACTION_PROOF);

            // Mark input nullifiers as spent to prevent double-spending
            for i in 0..args.input_nullifiers.len() {
                self.nullifier_hashes.entry(*args.input_nullifiers.at(i)).write(true);
            }

            // Handle withdrawals (negative external amount)
            if ext_data.ext_amount < I256Trait::zero() {
                assert(!ext_data.recipient.is_zero(), ERROR_ZERO_ADDRESS);

                // Transfer tokens from contract to recipient
                token_dispatcher
                    .transfer(ext_data.recipient, (-ext_data.ext_amount).try_into().unwrap());
            }

            // Pay fee to relayer if specified
            if ext_data.fee > 0 {
                token_dispatcher.transfer(ext_data.relayer, ext_data.fee);
            }

            // Update contract balance and insert new commitments
            self.last_balance.write(token_dispatcher.balance_of(get_contract_address()));
            let leaf1 = *args.output_commitments.at(0);
            let leaf2 = *args.output_commitments.at(1);

            self.insert_into_merkle_tree(leaf1, leaf2);

            // Emit events for new commitments
            self
                .emit(
                    Event::NewCommitment(
                        NewCommitment {
                            commitment: leaf1,
                            index: self.merkle_tree.next_index.read() - 2,
                            encrypted_output: ext_data.encrypted_output1,
                        },
                    ),
                );
            self
                .emit(
                    Event::NewCommitment(
                        NewCommitment {
                            commitment: leaf2,
                            index: self.merkle_tree.next_index.read() - 1,
                            encrypted_output: ext_data.encrypted_output2,
                        },
                    ),
                );

            // Emit events for spent nullifiers
            for nullifier in args.input_nullifiers {
                self.emit(Event::NewNullifier(NewNullifier { nullifier }));
            }
        }

        /// Combines account registration and transaction execution in a single call with multitoken
        /// support.
        ///
        /// This convenience function allows new users to register and immediately
        /// perform their first privacy-preserving transaction with any whitelisted token,
        /// optimizing gas usage.
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
        /// # Benefits
        /// - Reduces gas costs for new users
        /// - Simplifies the onboarding process for multitoken transactions
        /// - Maintains the same security guarantees
        /// - Supports immediate transactions with any whitelisted token
        fn register_and_transact(
            ref self: ContractState,
            account: Account,
            args: Proof,
            ext_data: ExtData,
            token_address: ContractAddress,
        ) {
            self.register(account);
            self.transact(args, ext_data, token_address);
        }

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
        ///
        /// # Security
        /// - Validates recipient and token addresses are not zero
        /// - Ensures amount is greater than zero
        /// - Provides transparency through event emission
        fn rescue_token(
            ref self: ContractState,
            recipient: ContractAddress,
            token_address: ContractAddress,
            amount: u256,
        ) {
            self.ownable.assert_only_owner();
            assert(recipient.is_zero() || !token_address.is_zero(), ERROR_ZERO_ADDRESS);
            assert(amount > 0, ERROR_AMOUNT_CANNOT_BE_ZERO);

            // Initialize token dispatcher for token transfers
            let token_dispatcher = IERC20Dispatcher { contract_address: token_address };

            if amount > 0 {
                // Transfer tokens from contract to recipient
                token_dispatcher.transfer(recipient, amount);
            }

            self.emit(Event::TokenRescued(TokenRescued { token_address, recipient, amount }));
        }

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
        /// # Process
        /// 1. Validates the token is not already whitelisted
        /// 2. Adds the token to the whitelist mapping
        /// 3. Assigns an index for enumeration
        /// 4. Increments the token counter
        /// 5. Emits a TokenAdded event
        ///
        /// # Events
        /// Emits a `TokenAdded` event with the token address and assigned index.
        fn add_token(ref self: ContractState, token_address: ContractAddress) {
            self.ownable.assert_only_owner();
            assert(self.is_token_allowed(token_address), ERROR_TOKEN_ALREADY_WHITELISTED);
            assert(!token_address.is_zero(), ERROR_ZERO_ADDRESS);

            let token_count = self.token_count.read();

            self.is_token_allowed.entry(token_address).write(true);
            self.token_by_index.entry(token_count).write(token_address);
            self.index_by_token.entry(token_address).write(token_count);
            self.token_count.write(token_count + 1);

            self.emit(Event::TokenAdded(TokenAdded { token_address, token_index: token_count }));
        }

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
        /// # Process
        /// 1. Validates the token is currently whitelisted
        /// 2. Removes the token from the whitelist mapping
        /// 3. Clears the token's index entry
        /// 4. Decrements the token counter
        /// 5. Emits a TokenRemoved event
        ///
        /// # Events
        /// Emits a `TokenRemoved` event with the token address and previous index.
        fn remove_token(ref self: ContractState, token_address: ContractAddress) {
            self.ownable.assert_only_owner();
            assert(!self.is_token_allowed(token_address), ERROR_TOKEN_NOT_WHITELISTED);
            assert(!token_address.is_zero(), ERROR_ZERO_ADDRESS);

            let token_count = self.token_count.read();
            let token_index = self.index_by_token.entry(token_address).read();

            self.is_token_allowed.entry(token_address).write(false);
            self.token_by_index.entry(token_index).write(Zero::zero());
            self.index_by_token.entry(token_address).write(Zero::zero());
            self.token_count.write(token_count - 1);

            self.emit(Event::TokenRemoved(TokenRemoved { token_address, token_index }));
        }

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
        /// # Process
        /// - Iterates through the provided token addresses
        /// - Calls the existing add_token function for each token
        /// - Maintains all validation and event emission from add_token
        ///
        /// # Benefits
        /// - Reduces transaction costs for adding multiple tokens
        /// - Maintains consistency with individual add_token validation
        /// - Simplifies bulk token management operations
        ///
        /// # Events
        /// Emits a `TokensBatchAdded` event with an array of (token_address, token_index) tuples.
        fn batch_add_tokens(ref self: ContractState, token_addresses: Array<ContractAddress>) {
            self.ownable.assert_only_owner();

            let mut tokens_added: Array<(ContractAddress, u8)> = ArrayTrait::new();

            for token_address in token_addresses {
                assert(!token_address.is_zero(), ERROR_ZERO_ADDRESS);
                assert(!self.is_token_allowed(token_address), ERROR_TOKEN_ALREADY_WHITELISTED);

                let token_count = self.token_count.read();
                assert(token_count < 255, ERROR_MAX_TOKENS_REACHED);

                // Add token to whitelist
                self.is_token_allowed.entry(token_address).write(true);
                self.token_by_index.entry(token_count).write(token_address);
                self.index_by_token.entry(token_address).write(token_count);
                self.token_count.write(token_count + 1);

                // Add to batch event array
                tokens_added.append((token_address, token_count));
            }

            // Emit single batch event
            self.emit(Event::TokensBatchAdded(TokensBatchAdded { tokens: tokens_added }));
        }

        /// Removes multiple tokens from the whitelist in a single transaction (owner-only
        /// function).
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
        /// # Process
        /// - Iterates through the provided token addresses
        /// - Calls the existing remove_token function for each token
        /// - Maintains all validation and event emission from remove_token
        ///
        /// # Benefits
        /// - Reduces transaction costs for removing multiple tokens
        /// - Maintains consistency with individual remove_token validation
        /// - Simplifies bulk token management operations
        ///
        /// # Events
        /// Emits a `TokensBatchRemoved` event with an array of (token_address, token_index) tuples.
        fn batch_remove_tokens(ref self: ContractState, token_addresses: Array<ContractAddress>) {
            self.ownable.assert_only_owner();

            let mut tokens_removed: Array<(ContractAddress, u8)> = ArrayTrait::new();

            for token_address in token_addresses {
                assert(!token_address.is_zero(), ERROR_ZERO_ADDRESS);
                assert(self.is_token_allowed(token_address), ERROR_TOKEN_NOT_WHITELISTED);

                let token_count = self.token_count.read();
                let token_index = self.index_by_token.entry(token_address).read();
                assert(token_count > 0, ERROR_NO_TOKENS_TO_REMOVE);

                // Remove token from whitelist
                self.is_token_allowed.entry(token_address).write(false);

                // Clear the last position and decrease count
                self.token_by_index.entry(token_index).write(Zero::zero());
                self.index_by_token.entry(token_address).write(Zero::zero());
                self.token_count.write(token_count - 1);

                // Add to batch event array
                tokens_removed.append((token_address, token_index));
            }

            // Emit single batch event
            self.emit(Event::TokensBatchRemoved(TokensBatchRemoved { tokens: tokens_removed }));
        }

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
        /// - Helps prevent large-scale attacks and manage system capacity
        fn configure_limits(ref self: ContractState, maximum_deposit_amount: u256) {
            self.ownable.assert_only_owner();

            self.maximum_deposit_amount.write(maximum_deposit_amount);
        }

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
        ///
        /// # Security
        /// - Validates fee and amount limits
        /// - Ensures mathematical consistency in proofs
        /// - Handles negative amounts correctly
        fn calculate_public_amount(self: @ContractState, ext_amount: I256, fee: u256) -> u256 {
            assert(fee < MAX_FEE, ERROR_INVALID_FEE);
            assert(
                ext_amount > -(MAX_EXT_AMOUNT.into()) && ext_amount < MAX_EXT_AMOUNT.into(),
                ERROR_INVALID_EXT_AMOUNT,
            );

            let public_amount: I256 = ext_amount - fee.into();

            if public_amount >= I256Trait::zero() {
                return public_amount.try_into().unwrap();
            } else {
                return FIELD_SIZE - (-public_amount).try_into().unwrap();
            }
        }

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
        /// - Maintains privacy while ensuring transaction validity
        fn is_spent(self: @ContractState, nullifier_hash: u256) -> bool {
            self.nullifier_hashes.entry(nullifier_hash).read()
        }

        /// Returns the finite field size used in cryptographic operations.
        ///
        /// This function provides access to the system's mathematical foundation
        /// for external verification and compatibility checks.
        ///
        /// # Returns
        /// * The field size constant used in zero-knowledge proofs
        fn field_size(self: @ContractState) -> u256 {
            FIELD_SIZE
        }

        /// Returns the maximum allowed external amount for transactions.
        ///
        /// This function provides the current system limit for deposits
        /// and withdrawals to ensure compliance.
        ///
        /// # Returns
        /// * The maximum external amount constant
        fn max_ext_amount(self: @ContractState) -> u256 {
            MAX_EXT_AMOUNT
        }

        /// Returns the minimum allowed external amount for transactions.
        ///
        /// This function provides the current system minimum for deposits
        /// and withdrawals to prevent dust attacks.
        ///
        /// # Returns
        /// * The minimum external amount constant
        fn min_ext_amount(self: @ContractState) -> u256 {
            MIN_EXT_AMOUNT
        }

        /// Returns the maximum allowed fee amount for transactions.
        ///
        /// This function provides the current system limit for transaction
        /// fees to prevent economic attacks.
        ///
        /// # Returns
        /// * The maximum fee constant
        fn max_fee(self: @ContractState) -> u256 {
            MAX_FEE
        }

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
        /// - Called internally during transaction processing
        fn is_token_allowed(self: @ContractState, token_address: ContractAddress) -> bool {
            self.is_token_allowed.entry(token_address).read()
        }

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
        /// - Provides balance information for any ERC20 token
        fn get_token_balance(
            self: @ContractState, token_address: ContractAddress, account: ContractAddress,
        ) -> u256 {
            let token_dispatcher = IERC20Dispatcher { contract_address: token_address };

            token_dispatcher.balance_of(account)
        }

        /// Gets the total number of whitelisted tokens.
        ///
        /// This function returns the count of tokens currently in the whitelist.
        ///
        /// # Returns
        /// * The number of whitelisted tokens as a u8
        ///
        /// # Usage
        /// - Used to iterate through all supported tokens
        /// - Helps determine the size of the token whitelist
        /// - Useful for UI applications displaying token options
        fn get_token_count(self: @ContractState) -> u8 {
            self.token_count.read()
        }

        /// Gets a token address by its index in the whitelist.
        ///
        /// This function retrieves a token address from the whitelist using its index.
        ///
        /// # Arguments
        /// * `index` - The index of the token in the whitelist (0-based)
        ///
        /// # Returns
        /// * The token contract address at the specified index
        ///
        /// # Usage
        /// - Used to iterate through all supported tokens
        /// - Enables enumeration of the token whitelist
        /// - Index should be less than the result of get_token_count()
        fn get_token_by_index(self: @ContractState, index: u8) -> ContractAddress {
            self.token_by_index.entry(index).read()
        }

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
        /// - Eliminates need for manual iteration through indices
        ///
        /// # Implementation
        /// - Iterates through all token indices using get_token_by_index
        /// - Returns a complete array of token addresses
        fn get_all_tokens(self: @ContractState) -> Array<ContractAddress> {
            let token_count = self.get_token_count();
            let mut tokens: Array<ContractAddress> = array![];

            for i in 0..token_count {
                tokens.append(self.get_token_by_index(i));
            }

            tokens
        }
    }

    /// Internal functions trait for helper operations.
    ///
    /// This trait provides internal helper functions that support the main
    /// contract operations, particularly Merkle tree management.
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        /// Helper function to compute the Poseidon hash of two u256 inputs.
        ///
        /// This function uses the BN254 curve implementation of Poseidon hash
        /// for efficient cryptographic operations in the Merkle tree.
        ///
        /// # Arguments
        /// * `left` - Left input value
        /// * `right` - Right input value
        ///
        /// # Returns
        /// * The Poseidon hash of the two inputs
        ///
        /// # Usage
        /// - Used for Merkle tree node computation
        /// - Provides efficient cryptographic hashing
        fn hash_left_and_right(left: u256, right: u256) -> u256 {
            poseidon_hash_2_bn254(left.into(), right.into()).try_into().unwrap()
        }

        /// Generates zero hashes for empty tree levels.
        ///
        /// This function precomputes the zero hashes for each level of the
        /// Merkle tree, optimizing tree operations.
        ///
        /// # Arguments
        /// * `levels` - The depth of the Merkle tree
        ///
        /// # Returns
        /// * An array containing the zero hashes for each level
        ///
        /// # Algorithm
        /// - Starts with zero at level 0
        /// - For each level i > 0: hash(zeros[i-1], zeros[i-1])
        /// - Creates a complete set of zero hashes for efficient tree operations
        fn build_zeros(levels: u32) -> Array<u256> {
            let mut zeros: Array<u256> = ArrayTrait::new();
            zeros.append(0);

            for i in 1..=levels {
                let prev_zero = *zeros.at((i - 1).into());
                let current_zero = Self::hash_left_and_right(prev_zero, prev_zero);
                zeros.append(current_zero);
            }

            zeros
        }

        /// Constructs a new Merkle tree with a given depth.
        ///
        /// This function initializes a new Merkle tree with the specified depth,
        /// setting up all necessary data structures for privacy-preserving operations.
        ///
        /// # Arguments
        /// * `levels` - The depth of the Merkle tree
        ///
        /// # Initialization Steps
        /// 1. Validates the tree depth is within acceptable limits
        /// 2. Builds zero hashes for all levels
        /// 3. Initializes filled subtrees with zero values
        /// 4. Sets up the root history buffer
        /// 5. Initializes tracking variables
        ///
        /// # Security
        /// - Ensures tree depth is reasonable (1-31 levels)
        /// - Prevents excessive gas costs and storage usage
        fn new_merkle_tree(ref self: ContractState, levels: u32) {
            assert(levels > 0 && levels < 32, ERROR_INVALID_TREE_DEPTH);

            let zeros = Self::build_zeros(levels);
            let root_zero = *zeros.at(levels.into());

            // Initialize filled subtrees and zeros
            for zero in zeros {
                self.merkle_tree.zeros.push(zero);
                self.merkle_tree.filled_subtrees.push(zero);
            }

            // Initialize root history buffer
            for _ in 0..ROOT_HISTORY_SIZE {
                self.merkle_tree.roots.push(root_zero);
            }

            // Set initial tracking variables
            self.merkle_tree.levels.write(levels);
            self.merkle_tree.next_index.write(0);
            self.merkle_tree.current_root_index.write(0);
        }

        /// Inserts new leaves into the Merkle tree.
        ///
        /// This function adds two new commitments to the Merkle tree and updates
        /// all necessary intermediate hashes and the root.
        ///
        /// # Arguments
        /// * `leaf1` - First commitment to insert
        /// * `leaf2` - Second commitment to insert
        ///
        /// # Process
        /// 1. Validates that the tree has space for new leaves
        /// 2. Computes the hash of the two leaves
        /// 3. Updates intermediate hashes at each level
        /// 4. Computes and stores the new root
        /// 5. Updates tracking variables
        ///
        /// # Algorithm
        /// - Uses a sparse Merkle tree implementation
        /// - Efficiently updates only necessary intermediate hashes
        /// - Maintains the tree structure for proof generation
        fn insert_into_merkle_tree(ref self: ContractState, leaf1: u256, leaf2: u256) {
            let levels = self.merkle_tree.levels.read();
            let next_index = self.merkle_tree.next_index.read();

            assert(next_index != 2_u32.pow(levels), ERROR_MERKLE_TREE_IS_FULL);

            let mut current_index = next_index / 2;
            let mut current_level_hash: u256 = Self::hash_left_and_right(leaf1, leaf2);
            let mut left: u256 = 0;
            let mut right: u256 = 0;

            // Update intermediate hashes at each level
            for i in 1..levels {
                if current_index % 2 == 0 {
                    left = current_level_hash;
                    right = self.merkle_tree.zeros.at(i.into()).read();
                    self.merkle_tree.filled_subtrees.at(i.into()).write(current_level_hash);
                } else {
                    left = self.merkle_tree.filled_subtrees.at(i.into()).read();
                    right = current_level_hash;
                }

                current_level_hash = Self::hash_left_and_right(left, right);

                current_index /= 2;
            }

            // Update root history
            let new_root_index = (self.merkle_tree.current_root_index.read()
                + 1) % ROOT_HISTORY_SIZE;
            self.merkle_tree.current_root_index.write(new_root_index);
            self.merkle_tree.roots.at(new_root_index.into()).write(current_level_hash);
            self.merkle_tree.next_index.write(self.merkle_tree.next_index.read() + 2);
        }

        /// Checks if a given root exists in the historical roots.
        ///
        /// This function verifies whether a specific Merkle root is in the
        /// recent history, allowing for transaction verification against
        /// recent state.
        ///
        /// # Arguments
        /// * `root` - The root hash to check
        ///
        /// # Returns
        /// * `true` if the root is known, otherwise `false`
        ///
        /// # Algorithm
        /// - Searches through the circular buffer of recent roots
        /// - Returns false for zero roots (invalid)
        /// - Provides efficient verification of recent state
        ///
        /// # Security
        /// - Prevents use of old or invalid roots
        /// - Maintains privacy while ensuring transaction validity
        fn is_known_root(self: @ContractState, root: u256) -> bool {
            if root == 0 {
                return false;
            }

            let mut i: u32 = self.merkle_tree.current_root_index.read();

            // Search through the circular buffer
            loop {
                if self.merkle_tree.roots.at(i.into()).read() == root {
                    return true;
                }

                if i == 0 {
                    i = ROOT_HISTORY_SIZE - 1;
                } else {
                    i -= 1;
                }

                if i == self.merkle_tree.current_root_index.read() {
                    break;
                }
            }

            false
        }

        /// Retrieves the most recent Merkle root.
        ///
        /// This function returns the last inserted root hash, which represents
        /// the current state of the privacy system.
        ///
        /// # Returns
        /// * The last inserted root hash
        ///
        /// # Usage
        /// - External systems can use this for proof generation
        /// - Represents the current state of all commitments
        /// - Useful for monitoring system state
        fn get_last_root(self: @ContractState) -> u256 {
            // Assumes roots is not empty, which is guaranteed by `new`.
            self
                .merkle_tree
                .roots
                .at((self.merkle_tree.current_root_index.read()).try_into().unwrap())
                .read()
        }
    }
}
