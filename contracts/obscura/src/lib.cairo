//! # Obscura - Privacy-Preserving Smart Contract
//!
//! This module contains the main implementation of the Obscura privacy-preserving smart contract.
//! Obscura enables private transactions on Starknet using zero-knowledge proofs and Merkle trees.
//!
//! ## Overview
//!
//! The Obscura contract implements a privacy-preserving transaction system that allows users to:
//! - Deposit and withdraw tokens privately
//! - Transfer tokens between accounts without revealing transaction details
//! - Use zero-knowledge proofs to prove transaction validity
//! - Maintain privacy through commitment schemes and nullifiers
//!
//! ## Architecture
//!
//! The contract is organized into several modules:
//! - `constants`: System-wide constants and configuration values
//! - `custom_type`: Custom data types including signed integers
//! - `errors`: Error messages and constants
//! - `events`: Event definitions for contract interactions
//! - `interface`: External interface definitions
//! - `obscura`: Main contract implementation
//! - `structs`: Data structure definitions

pub mod constants;
pub mod custom_type;
pub mod errors;
pub mod events;
pub mod interface;
pub mod obscura;
pub mod structs;
