//! # Custom Types Module
//!
//! This module provides custom data types that extend Cairo's built-in types for
//! specific use cases in the Obscura privacy-preserving system.
//!
//! ## Available Types
//!
//! - **I256**: A signed 256-bit integer implementation for handling negative amounts
//! - **U1024**: A 1024-bit unsigned integer for cryptographic operations
//!
//! ## Usage
//!
//! These custom types are used throughout the Obscura system to handle:
//! - Negative amounts in deposits and withdrawals
//! - Large cryptographic values that exceed standard integer limits
//! - Mathematical operations requiring extended precision

pub mod i256;
pub mod u1024;

pub use i256::*;
pub use u1024::*;
