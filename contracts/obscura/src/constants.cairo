use core::num::traits::Pow;

pub const FIELD_SIZE: u256 =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;

pub const MAX_EXT_AMOUNT: u256 = 2_u256.pow(248);

pub const MAX_FEE: u256 = 2_u256.pow(248);

pub const MIN_EXT_AMOUNT: u256 = 5 * 10_u256.pow(17);

pub const VERIFIER_CLASSHASH: felt252 =
    0x03100defca27214e5f78f25e48a5b05e45899c6834cb4d34f48384c18e14dff7;

/// The number of past roots stored for history verification.
pub const ROOT_HISTORY_SIZE: u32 = 100;

/// STRK token address on Starknet
pub const FELT_STRK_CONTRACT: felt252 =
    0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d;
