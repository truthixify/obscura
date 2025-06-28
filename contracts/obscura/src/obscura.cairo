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

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // External impl
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;

    // Internal impl
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        last_balance: u256,
        gap: u256,
        maximum_deposit_amount: u256,
        nullifier_hashes: Map<u256, bool>,
        merkle_tree: MerkleTreeWithHistory,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        NewCommitment: NewCommitment,
        NewNullifier: NewNullifier,
        PublicKey: PublicKey,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[constructor]
    pub fn constructor(ref self: ContractState, levels: u32, maximum_deposit_amount: u256) {
        self.ownable.initializer(get_caller_address());
        self.new_merkle_tree(levels);
        self.configure_limits(maximum_deposit_amount);
    }

    #[abi(embed_v0)]
    impl ObscuraImpl of IObscura<ContractState> {
        fn register(ref self: ContractState, account: Account) {
            let caller = get_caller_address();

            assert(account.owner == caller, ONLY_OWNER_CAN_BE_REGISTERED);

            self
                .emit(
                    Event::PublicKey(PublicKey { owner: account.owner, key: account.public_key }),
                );
        }

        fn transact(ref self: ContractState, args: Proof, ext_data: ExtData) {
            let strk_token_contract_address: ContractAddress = FELT_STRK_CONTRACT
                .try_into()
                .unwrap();
            let strk_dispatcher = IERC20Dispatcher {
                contract_address: strk_token_contract_address,
            };

            if ext_data.ext_amount > I256Trait::zero() {
                assert(
                    ext_data.ext_amount <= self.maximum_deposit_amount.read().into(),
                    AMOUNT_LARGER_THAN_MAXIMUM_DEPOSIT,
                );

                strk_dispatcher
                    .transfer_from(
                        get_caller_address(),
                        get_contract_address(),
                        ext_data.ext_amount.try_into().unwrap(),
                    );
            }

            assert(self.is_known_root(args.root), INVALID_MERKLE_ROOT);

            for i in 0..args.input_nullifiers.len() {
                assert(!self.is_spent(*args.input_nullifiers.at(i)), INPUT_ALREADY_SPENT);
            }

            let mut serialized_ext_data: Array<felt252> = ArrayTrait::new();
            Serde::serialize(@ext_data, ref serialized_ext_data);
            let computed_ext_data_hash = poseidon_hash_span(serialized_ext_data.span());

            assert(args.ext_data_hash == computed_ext_data_hash.into(), INCORRECT_EXT_HASH);
            assert(
                args
                    .public_amount == self
                    .calculate_public_amount(ext_data.ext_amount, ext_data.fee),
                INVALID_PUBLIC_AMOUNT,
            );

            // Verify proof
            let mut result = syscalls::library_call_syscall(
                VERIFIER_CLASSHASH.try_into().unwrap(),
                selector!("verify_ultra_starknet_honk_proof"),
                args.proof,
            )
                .unwrap_syscall();
            let _public_inputs = Serde::<Option<Span<u256>>>::deserialize(ref result)
                .unwrap()
                .expect(INVALID_TRANSACTION_PROOF);

            for i in 0..args.input_nullifiers.len() {
                self.nullifier_hashes.entry(*args.input_nullifiers.at(i)).write(true);
            }

            if ext_data.ext_amount < I256Trait::zero() {
                assert(!ext_data.recipient.is_zero(), ZERO_ADDRESS);

                strk_dispatcher
                    .transfer(ext_data.recipient, (-ext_data.ext_amount).try_into().unwrap());
            }

            if ext_data.fee > 0 {
                strk_dispatcher.transfer(ext_data.relayer, ext_data.fee);
            }

            self.last_balance.write(strk_dispatcher.balance_of(get_contract_address()));
            let leaf1 = *args.output_commitments.at(0);
            let leaf2 = *args.output_commitments.at(1);

            self.insert_into_merkle_tree(leaf1, leaf2);

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

            for nullifier in args.input_nullifiers {
                self.emit(Event::NewNullifier(NewNullifier { nullifier }));
            }
        }

        fn register_and_transact(
            ref self: ContractState, account: Account, args: Proof, ext_data: ExtData,
        ) {
            self.register(account);
            self.transact(args, ext_data);
        }

        fn configure_limits(ref self: ContractState, maximum_deposit_amount: u256) {
            self.ownable.assert_only_owner();

            self.maximum_deposit_amount.write(maximum_deposit_amount);
        }

        fn calculate_public_amount(ref self: ContractState, ext_amount: I256, fee: u256) -> u256 {
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

        fn is_spent(self: @ContractState, nullifier_hash: u256) -> bool {
            self.nullifier_hashes.entry(nullifier_hash).read()
        }

        fn field_size(self: @ContractState) -> u256 {
            FIELD_SIZE
        }

        fn max_ext_amount(self: @ContractState) -> u256 {
            MAX_EXT_AMOUNT
        }

        fn min_ext_amount(self: @ContractState) -> u256 {
            MIN_EXT_AMOUNT
        }

        fn max_fee(self: @ContractState) -> u256 {
            MAX_FEE
        }

        fn roots(self: @ContractState) -> Array<u256> {
            let roots = self.merkle_tree.roots;
            let mut r = ArrayTrait::new();

            for i in 0..roots.len() {
                r.append(roots.at(i).read());
            }

            r
        }
    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        // Helper function to compute the Poseidon hash of two u256 inputs.
        fn hash_left_and_right(left: u256, right: u256) -> u256 {
            poseidon_hash_2_bn254(left.into(), right.into()).try_into().unwrap()
        }

        /// Generates zero hashes for empty tree levels.
        ///
        /// # Arguments
        /// * `levels` - The depth of the Merkle tree.
        ///
        /// # Returns
        /// * A Arraytor containing the zero hashes for each level.
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
        /// # Arguments
        /// * `levels` - The depth of the Merkle tree.
        ///
        /// # Returns
        /// * A new instance of `MerkleTreeWithHistory`.
        fn new_merkle_tree(ref self: ContractState, levels: u32) {
            assert(levels > 0 && levels < 32, INVALID_TREE_DEPTH);

            let zeros = Self::build_zeros(levels);
            let root_zero = *zeros.at(levels.into());

            for zero in zeros {
                self.merkle_tree.zeros.push(zero);
                self.merkle_tree.filled_subtrees.push(zero);
            }

            for _ in 0..ROOT_HISTORY_SIZE {
                self.merkle_tree.roots.push(root_zero);
            }

            self.merkle_tree.levels.write(levels);
            self.merkle_tree.next_index.write(0);
            self.merkle_tree.current_root_index.write(0);
        }

        /// Inserts a new leaf into the Merkle tree.
        ///
        /// # Arguments
        /// * `leaf` - The new commitment to be inserted.
        ///
        /// # Returns
        /// * The index where the new leaf was inserted.
        fn insert_into_merkle_tree(ref self: ContractState, leaf1: u256, leaf2: u256) {
            let levels = self.merkle_tree.levels.read();
            let next_index = self.merkle_tree.next_index.read();

            assert(next_index != 2_u32.pow(levels), MERKLE_TREE_IS_FULL);

            let mut current_index = next_index / 2;
            let mut current_level_hash: u256 = Self::hash_left_and_right(leaf1, leaf2);
            let mut left: u256 = 0;
            let mut right: u256 = 0;

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

            let new_root_index = (self.merkle_tree.current_root_index.read()
                + 1) % ROOT_HISTORY_SIZE;
            self.merkle_tree.current_root_index.write(new_root_index);
            self.merkle_tree.roots.at(new_root_index.into()).write(current_level_hash);
            self.merkle_tree.next_index.write(self.merkle_tree.next_index.read() + 2);
        }

        /// Checks if a given root exists in the historical roots.
        ///
        /// # Arguments
        /// * `root` - The root hash to check.
        ///
        /// # Returns
        /// * `true` if the root is known, otherwise `false`.
        fn is_known_root(self: @ContractState, root: u256) -> bool {
            if root == 0 {
                return false;
            }

            let mut i: u32 = self.merkle_tree.current_root_index.read();

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
        /// # Returns
        /// * The last inserted root hash.
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
