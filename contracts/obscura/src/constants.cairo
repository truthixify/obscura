//! # Constants Module
//!
//! This module defines system-wide constants used throughout the Obscura privacy-preserving
//! contract.
//! These constants establish the mathematical foundations and operational limits of the system.

use core::num::traits::Pow;

/// The finite field size used in the cryptographic operations.
/// This is the prime field size for the BN254 curve used in zero-knowledge proofs.
///
/// # Mathematical Properties
/// - Prime number: 21888242871839275222246405745257275088548364400416034343698204186575808495617
/// - Used for modular arithmetic in zero-knowledge proof verification
/// - Ensures cryptographic security of the commitment scheme
pub const FIELD_SIZE: u256 =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;

/// Maximum allowed external amount for deposits and withdrawals.
/// This limit prevents overflow attacks and ensures system stability.
///
/// # Value
/// - 2^248 (approximately 4.5 × 10^74)
/// - Provides sufficient range for practical transaction amounts
/// - Prevents arithmetic overflow in calculations
pub const MAX_EXT_AMOUNT: u256 = 2_u256.pow(248);

/// Maximum allowed fee amount for transactions.
/// This limit prevents excessive fee extraction and ensures fair pricing.
///
/// # Value
/// - 2^248 (same as MAX_EXT_AMOUNT)
/// - Allows for high-value transactions with reasonable fees
/// - Prevents economic attacks through excessive fees
pub const MAX_FEE: u256 = 2_u256.pow(248);

/// Minimum allowed external amount for deposits and withdrawals.
/// This ensures transactions have meaningful economic value.
///
/// # Value
/// - 5 × 10^17 (0.5 tokens in wei units)
/// - Prevents dust attacks and spam transactions
/// - Ensures gas costs are justified by transaction value
pub const MIN_EXT_AMOUNT: u256 = 5 * 10_u256.pow(17);

/// The class hash of the zero-knowledge proof verifier contract.
/// This contract is responsible for verifying the cryptographic proofs
/// that validate private transactions.
///
/// # Usage
/// - Used in library calls to verify transaction proofs
/// - Ensures only valid cryptographic proofs are accepted
/// - Critical for maintaining the privacy and security of the system
pub const VERIFIER_CLASSHASH: felt252 =
    0x03100defca27214e5f78f25e48a5b05e45899c6834cb4d34f48384c18e14dff7;

/// The number of past Merkle roots stored for history verification.
/// This allows the system to verify that transactions are based on
/// recent, valid state while maintaining privacy.
///
/// # Value
/// - 100 historical roots
/// - Balances privacy (not too many roots) with security (not too few)
/// - Allows for reasonable transaction finality periods
pub const ROOT_HISTORY_SIZE: u32 = 100;

/// The contract address of the STRK token on Starknet mainnet.
/// This is the native token used for deposits, withdrawals, and fee payments.
///
/// # Address
/// - Mainnet STRK token contract
/// - Used for all token transfers in the privacy system
/// - Ensures compatibility with Starknet's native token ecosystem
pub const FELT_STRK_CONTRACT: felt252 =
    0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d;
