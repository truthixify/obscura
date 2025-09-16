//! # Obscura - Privacy-Preserving Smart Contract
//!
//! This module contains the main implementation of the Obscura privacy-preserving smart contract.
//! Obscura enables private transactions on Starknet using zero-knowledge proofs and Merkle trees
//! with support for multiple ERC20 tokens.
//!
//! ## Overview
//!
//! The Obscura contract implements a privacy-preserving transaction system that allows users to:
//! - Deposit and withdraw multiple ERC20 tokens privately
//! - Transfer tokens between accounts without revealing transaction details
//! - Use zero-knowledge proofs to prove transaction validity
//! - Maintain privacy through commitment schemes and nullifiers
//! - Manage a whitelist of supported tokens through administrative functions
//!
//! ## Architecture
//!
//! The contract is organized into several modules:
//! - `constants`: System-wide constants and configuration values
//! - `custom_type`: Custom data types including signed integers
//! - `errors`: Error messages and constants (including multitoken errors)
//! - `events`: Event definitions for contract interactions (including token management events)
//! - `interface`: External interface definitions (including multitoken functions)
//! - `obscura`: Main contract implementation with multitoken support
//! - `structs`: Data structure definitions
//!
//! ## Multitoken Features
//!
//! The contract supports multiple ERC20 tokens through:
//! - Token whitelist management (add/remove tokens)
//! - Per-token transaction processing
//! - Token rescue functionality for emergency situations
//! - Comprehensive token query functions

pub mod constants;
pub mod custom_type;
pub mod errors;
pub mod events;
pub mod interface;
pub mod obscura;
pub mod structs;
