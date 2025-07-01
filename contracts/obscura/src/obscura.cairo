//! # Obscura - Privacy-Preserving Smart Contract Implementation
//!
//! This module contains the main implementation of the Obscura privacy-preserving smart contract
//! for Starknet. The contract enables private transactions using zero-knowledge proofs and
//! Merkle trees, allowing users to transfer tokens without revealing transaction details.
//!
//! ## Overview
//!
//! The Obscura contract implements a privacy-preserving transaction system that provides:
//! - **Private Deposits**: Users can deposit tokens without revealing their identity
//! - **Private Withdrawals**: Users can withdraw tokens to specific addresses
//! - **Private Transfers**: Internal transfers between users remain completely private
//! - **Zero-Knowledge Proofs**: Cryptographic proofs ensure transaction validity
//! - **Merkle Tree Management**: Efficient commitment storage and verification
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
//! - STRK token contract for token transfers

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

    /// Storage structure for the Obscura contract.
    ///
    /// This structure defines all the persistent state variables that maintain
    /// the privacy system's state across transactions.
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
        /// Maintains the privacy-preserving state of all transactions.
        merkle_tree: MerkleTreeWithHistory,
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

            assert(account.owner == caller, ONLY_OWNER_CAN_BE_REGISTERED);

            self
                .emit(
                    Event::PublicKey(PublicKey { owner: account.owner, key: account.public_key }),
                );
        }

        /// Executes a privacy-preserving transaction using zero-knowledge proofs.
        ///
        /// This is the core function for privacy-preserving transactions. It verifies
        /// zero-knowledge proofs, processes token transfers, and updates the Merkle tree.
        ///
        /// # Arguments
        /// * `args` - The zero-knowledge proof and transaction data
        /// * `ext_data` - External data for deposits/withdrawals and fee handling
        ///
        /// # Transaction Process
        /// 1. **Token Transfer**: Handle deposits (positive ext_amount) or withdrawals (negative)
        /// 2. **Proof Verification**: Verify the zero-knowledge proof is valid
        /// 3. **Nullifier Check**: Ensure input nullifiers haven't been spent
        /// 4. **Data Validation**: Verify external data consistency
        /// 5. **Merkle Update**: Insert new commitments into the tree
        /// 6. **Event Emission**: Emit events for commitments and nullifiers
        ///
        /// # Security Features
        /// - Cryptographic proof verification prevents invalid transactions
        /// - Nullifier tracking prevents double-spending
        /// - External data validation ensures consistency
        /// - Fee handling incentivizes transaction processing
        fn transact(ref self: ContractState, args: Proof, ext_data: ExtData) {
            // Initialize STRK token dispatcher for token transfers
            let strk_token_contract_address: ContractAddress = FELT_STRK_CONTRACT
                .try_into()
                .unwrap();
            let strk_dispatcher = IERC20Dispatcher {
                contract_address: strk_token_contract_address,
            };

            // Handle deposits (positive external amount)
            if ext_data.ext_amount > I256Trait::zero() {
                assert(
                    ext_data.ext_amount <= self.maximum_deposit_amount.read().into(),
                    AMOUNT_LARGER_THAN_MAXIMUM_DEPOSIT,
                );

                // Transfer tokens from caller to contract
                strk_dispatcher
                    .transfer_from(
                        get_caller_address(),
                        get_contract_address(),
                        ext_data.ext_amount.try_into().unwrap(),
                    );
            }

            // Verify the Merkle root is known and recent
            assert(self.is_known_root(args.root), INVALID_MERKLE_ROOT);

            // Check that all input nullifiers haven't been spent
            for i in 0..args.input_nullifiers.len() {
                assert(!self.is_spent(*args.input_nullifiers.at(i)), INPUT_ALREADY_SPENT);
            }

            // Verify external data hash consistency
            let mut serialized_ext_data: Array<felt252> = ArrayTrait::new();
            Serde::serialize(@ext_data, ref serialized_ext_data);
            let computed_ext_data_hash = poseidon_hash_span(serialized_ext_data.span());

            assert(args.ext_data_hash == computed_ext_data_hash.into(), INCORRECT_EXT_HASH);

            // Verify public amount consistency
            assert(
                args
                    .public_amount == self
                    .calculate_public_amount(ext_data.ext_amount, ext_data.fee),
                INVALID_PUBLIC_AMOUNT,
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
                .expect(INVALID_TRANSACTION_PROOF);

            // Mark input nullifiers as spent to prevent double-spending
            for i in 0..args.input_nullifiers.len() {
                self.nullifier_hashes.entry(*args.input_nullifiers.at(i)).write(true);
            }

            // Handle withdrawals (negative external amount)
            if ext_data.ext_amount < I256Trait::zero() {
                assert(!ext_data.recipient.is_zero(), ZERO_ADDRESS);

                // Transfer tokens from contract to recipient
                strk_dispatcher
                    .transfer(ext_data.recipient, (-ext_data.ext_amount).try_into().unwrap());
            }

            // Pay fee to relayer if specified
            if ext_data.fee > 0 {
                strk_dispatcher.transfer(ext_data.relayer, ext_data.fee);
            }

            // Update contract balance and insert new commitments
            self.last_balance.write(strk_dispatcher.balance_of(get_contract_address()));
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

        /// Combines account registration and transaction execution in a single call.
        ///
        /// This convenience function allows new users to register and immediately
        /// perform their first privacy-preserving transaction, optimizing gas usage.
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
        /// # Benefits
        /// - Reduces gas costs for new users
        /// - Simplifies the onboarding process
        /// - Maintains the same security guarantees
        fn register_and_transact(
            ref self: ContractState, account: Account, args: Proof, ext_data: ExtData,
        ) {
            self.register(account);
            self.transact(args, ext_data);
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
            assert(fee < MAX_FEE, INVALID_FEE);
            assert(
                ext_amount > -(MAX_EXT_AMOUNT.into()) && ext_amount < MAX_EXT_AMOUNT.into(),
                INVALID_EXT_AMOUNT,
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
            assert(levels > 0 && levels < 32, INVALID_TREE_DEPTH);

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

            assert(next_index != 2_u32.pow(levels), MERKLE_TREE_IS_FULL);

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
