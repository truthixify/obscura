use std::hash::poseidon::bn254::hash_2;

pub fn hasher(leaves: [Field; 2]) -> Field {
    hash_2(leaves)
}
