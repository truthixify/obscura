use starknet::ContractAddress;

#[derive(Drop, starknet::Event)]
pub struct NewCommitment {
    pub commitment: u256,
    pub index: u32,
    pub encrypted_output: ByteArray,
}

#[derive(Drop, starknet::Event)]
pub struct NewNullifier {
    pub nullifier: u256,
}

#[derive(Drop, starknet::Event)]
pub struct PublicKey {
    #[key]
    pub owner: ContractAddress,
    pub key: ByteArray,
}
