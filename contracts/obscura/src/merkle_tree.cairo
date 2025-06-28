use core::array::{ArrayTrait, SpanTrait};
use core::num::traits::Pow;
use garaga::hashes::poseidon_hash_2_bn254;
use starknet::storage::{
    Map, MutableVecTrait, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    Vec, VecTrait,
};

/// The number of past roots stored for history verification.
const ROOT_HISTORY_SIZE: usize = 30;

/// A struct representing a Merkle Tree with history for storing commitments.
// #[derive(Debug, Drop, Default, PartialEq, Serde)]
#[starknet::storage_node]
pub struct MerkleTreeWithHistory {
    /// The depth of the Merkle tree (number of levels).
    levels: u32,
    /// Stores intermediate hashes of subtree roots at each level.
    filled_subtrees: Vec<u256>,
    /// Stores the historical Merkle roots.
    roots: Vec<u256>,
    /// Tracks the index of the current Merkle root.
    current_root_index: u64,
    /// Tracks the next available index for inserting a new leaf.
    next_index: u32,
    /// Precomputed zero hashes for empty nodes at each level.
    pub zeros: Vec<u256>,
}

// Helper function to compute the Poseidon hash of two u256 inputs.
fn hash_left_and_right(left: u256, right: u256) -> u256 {
    poseidon_hash_2_bn254(left.into(), right.into()).try_into().unwrap()
}

pub trait MerkleTreeWithHistoryTrait {
    fn build_zeros(levels: u32) -> Array<u256>;
    fn new(levels: u32) -> MerkleTreeWithHistory;
    fn insert(ref self: MerkleTreeWithHistory, leaf: u256) -> u32;
    fn is_known_root(self: @MerkleTreeWithHistory, root: u256) -> bool;
    fn get_last_root(self: @MerkleTreeWithHistory) -> u256;
}

// Implementation of the MerkleTreeWithHistory logic.
impl MerkleTreeWithHistoryImpl of MerkleTreeWithHistoryTrait {
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
            let current_zero = hash_left_and_right(prev_zero, prev_zero);
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
    fn new(levels: u32) -> MerkleTreeWithHistory {
        assert(levels > 0 && levels < 32, 'Invalid tree depth');

        let zeros = Self::build_zeros(levels);
        let root_zero = *zeros.at(levels.into());

        let mut filled_subtrees: Array<u256> = ArrayTrait::new();

        for _ in 0..levels {
            filled_subtrees.append(root_zero);
        }

        let mut roots: Array<u256> = ArrayTrait::new();
        roots.append(root_zero);

        MerkleTreeWithHistory {
            levels, filled_subtrees, roots, current_root_index: 0, next_index: 0, zeros,
        }
    }

    /// Inserts a new leaf into the Merkle tree.
    ///
    /// # Arguments
    /// * `leaf` - The new commitment to be inserted.
    ///
    /// # Returns
    /// * The index where the new leaf was inserted.
    fn insert(ref self: MerkleTreeWithHistory, leaf: u256) -> u32 {
        assert(self.next_index < 2_u32.pow(self.levels), 'Merkle tree is full');

        let mut current_index = self.next_index;
        let mut current_level_hash: u256 = leaf;
        let mut filled_subtrees = ArrayTrait::new();

        for i in 0..self.levels {
            let zero_hash = self.zeros.at(i.into());

            if current_index % 2 == 0 {
                // Store the hash at this level before hashing up
                filled_subtrees.append(current_level_hash);

                // Hash with the zero value for the sibling
                current_level_hash = hash_left_and_right(current_level_hash, zero_hash);
            } else {
                filled_subtrees.append(*self.filled_subtrees.at(i));

                // Hash with the stored sibling hash
                let sibling_hash = *self.filled_subtrees.at(i.into());
                current_level_hash = hash_left_and_right(sibling_hash, current_level_hash);
            }

            current_index /= 2;
        }

        self.filled_subtrees = filled_subtrees;

        // Manage root history
        if self.roots.len() >= ROOT_HISTORY_SIZE {
            // Remove the oldest root (at the front)
            let _ = self.roots.pop_front();
        }

        // Append the new root
        self.roots.append(current_level_hash);
        self.current_root_index = (self.roots.len() - 1).into();
        self.next_index += 1;

        self.next_index - 1
    }

    /// Checks if a given root exists in the historical roots.
    ///
    /// # Arguments
    /// * `root` - The root hash to check.
    ///
    /// # Returns
    /// * `true` if the root is known, otherwise `false`.
    fn is_known_root(self: @MerkleTreeWithHistory, root: u256) -> bool {
        let mut i = 0;
        let roots_span = self.roots.span();
        while i != roots_span.len() {
            if *roots_span.at(i) == root {
                return true;
            }
            i += 1;
        }
        false
    }

    /// Retrieves the most recent Merkle root.
    ///
    /// # Returns
    /// * The last inserted root hash.
    fn get_last_root(self: @MerkleTreeWithHistory) -> u256 {
        // Assumes roots is not empty, which is guaranteed by `new`.
        *self.roots.at((*self.current_root_index).try_into().unwrap())
    }
}
