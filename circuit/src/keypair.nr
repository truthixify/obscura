use std::hash::poseidon::bn254::hash_2;

pub fn keypair(private_key: Field) -> Field {
    let public_key = hash_2([private_key, private_key]);

    public_key
}

pub fn signature(private_key: Field, commitment: Field, merkle_path: Field) -> Field {
    let signature = hash_2(
        [hash_2([private_key, private_key]), hash_2([commitment, merkle_path])],
    );

    signature
}
