mod utils;
mod keypair;

use utils::hasher;
use keypair::{keypair, signature};
use trees::merkle::{MembershipProver, MerkleTree, MT_Creator};
use std::hash::poseidon::bn254::hash_2;

global N_INS: u32 = 2;
global N_OUTS: u32 = 2;
global LEVEL: u32 = 5;


fn main(
    root: pub Field, 
    public_amount: pub Field,
    ext_data_hash: pub Field,
    input_nullifiers: pub [Field; N_INS],
    in_amount: [Field; N_INS],
    in_private_key: [Field; N_INS],
    in_blinding: [Field; N_INS],
    in_path_indices: [Field; N_INS],
    in_path_elements: [[Field; LEVEL]; N_INS],
    output_commitment: pub [Field; N_OUTS],
    out_amount: [Field; N_OUTS],
    out_pubkey: [Field; N_OUTS],
    out_blinding: [Field; N_OUTS],
) {
    let mut sum_ins = 0;

    for tx in 0..N_INS {
        let public_key = keypair(in_private_key[tx]); 

        let commitment_hash = hash_2([hash_2([in_amount[tx], in_amount[tx]]), hash_2([public_key, in_blinding[tx]])]);

        let signature = signature(in_private_key[tx], commitment_hash, in_path_indices[tx]);

        let nullifier_hash = hash_2([hash_2([commitment_hash, commitment_hash]), hash_2([in_path_indices[tx], signature])]);
       
        assert(nullifier_hash == input_nullifiers[tx]);

        let merkle_tree = MerkleTree::from(root, hasher);
        
        if in_amount[tx] != 0 {
            merkle_tree.membership(commitment_hash, in_path_indices[tx], in_path_elements[tx]);
        }

        sum_ins += in_amount[tx];
    }

    let mut sum_outs = 0;

    for tx in 0..N_OUTS {
        let commitment_hash = hash_2([hash_2([out_amount[tx], out_amount[tx]]), hash_2([out_pubkey[tx], out_blinding[tx]])]);

        assert(commitment_hash == output_commitment[tx]);

        // TODO: check if amount fits into 248 bits to prevent overflow
        // unsafe {
        //     assert(number_of_bits(out_amount[tx] as u128) == 248);
        // }

        sum_outs += out_amount[tx];
    }

    for i in 0..(N_INS - 1) {
        for j in (i + 1)..N_INS {
            assert(input_nullifiers[i] != input_nullifiers[j]);
        }
    }

    assert(sum_ins + public_amount == sum_outs);
    assert(ext_data_hash == ext_data_hash);
}
