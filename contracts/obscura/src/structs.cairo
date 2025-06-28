use starknet::ContractAddress;
use starknet::storage::Vec;
use crate::custom_type::I256;

/// A struct representing a Merkle Tree with history for storing commitments.
// #[derive(Debug, Drop, Default, PartialEq, Serde)]
#[starknet::storage_node]
pub struct MerkleTreeWithHistory {
    /// The depth of the Merkle tree (number of levels).
    pub levels: u32,
    /// Stores intermediate hashes of subtree roots at each level.
    pub filled_subtrees: Vec<u256>,
    /// Stores the historical Merkle roots.
    pub roots: Vec<u256>,
    /// Tracks the index of the current Merkle root.
    pub current_root_index: u32,
    /// Tracks the next available index for inserting a new leaf.
    pub next_index: u32,
    /// Precomputed zero hashes for empty nodes at each level.
    pub zeros: Vec<u256>,
}

#[derive(Debug, Drop, PartialEq, Serde)]
pub struct ExtData {
    pub recipient: ContractAddress,
    pub ext_amount: I256,
    pub relayer: ContractAddress,
    pub fee: u256,
    pub encrypted_output1: ByteArray,
    pub encrypted_output2: ByteArray,
}

#[derive(Debug, Drop, PartialEq, Serde)]
pub struct Proof {
    pub proof: Span<felt252>,
    pub root: u256,
    pub input_nullifiers: Array<u256>,
    pub output_commitments: Array<u256>,
    pub public_amount: u256,
    pub ext_data_hash: u256,
}

#[derive(Debug, Drop, PartialEq, Serde)]
pub struct Account {
    pub owner: ContractAddress,
    pub public_key: ByteArray,
}
