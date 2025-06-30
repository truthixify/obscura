//! # I256 - Signed 256-bit Integer Implementation
//!
//! This module provides a custom implementation of a signed 256-bit integer type
//! for the Obscura privacy-preserving system. Since Cairo doesn't have native
//! signed integers, this implementation provides the necessary functionality
//! for handling negative amounts in deposits and withdrawals.
//!
//! ## Implementation Details
//!
//! The I256 type is implemented as a struct containing:
//! - `value`: An unsigned 256-bit integer representing the absolute value
//! - `is_negative`: A boolean flag indicating the sign
//!
//! ## Mathematical Operations
//!
//! The implementation provides standard arithmetic operations:
//! - Addition and subtraction with proper sign handling
//! - Negation for sign changes
//! - Comparison operations (less than, greater than, etc.)
//! - Conversion to and from u256
//!
//! ## Usage in Obscura
//!
//! I256 is primarily used for:
//! - Representing external amounts (positive for deposits, negative for withdrawals)
//! - Fee calculations and public amount computations
//! - Maintaining mathematical consistency in zero-knowledge proofs

use core::traits::{Add, Into, Neg, PartialOrd, Sub, TryInto};

/// A signed 256-bit integer implementation for handling negative amounts.
///
/// This struct represents a signed integer by storing the absolute value
/// and a sign flag, enabling arithmetic operations with negative numbers.
///
/// # Fields
/// - `value`: The absolute value as an unsigned 256-bit integer
/// - `is_negative`: Boolean flag indicating if the value is negative
///
/// # Examples
/// ```
/// // Positive number: 100
/// let positive = I256 { value: 100, is_negative: false };
///
/// // Negative number: -100
/// let negative = I256 { value: 100, is_negative: true };
///
/// // Zero (always positive)
/// let zero = I256 { value: 0, is_negative: false };
/// ```
#[derive(Debug, Drop, Clone, Copy, PartialEq, Serde)]
pub struct I256 {
    /// The absolute value of the integer.
    /// This field stores the magnitude regardless of sign.
    pub value: u256,
    /// Flag indicating whether the value is negative.
    /// When true, the actual value is -value; when false, it's +value.
    pub is_negative: bool,
}

/// Trait providing common operations for I256 values.
///
/// This trait defines basic operations like creating a zero value
/// and can be extended with additional utility functions.
pub trait I256Trait {
    /// Creates a new I256 representing zero.
    ///
    /// # Returns
    /// * An I256 with value 0 and is_negative = false
    ///
    /// # Note
    /// Zero is always represented as positive to maintain consistency.
    fn zero() -> I256 {
        I256 { value: 0, is_negative: false }
    }
}

impl I256Impl of I256Trait {}

/// Implementation of addition for I256 values.
///
/// This implementation handles all combinations of positive and negative
/// operands, ensuring correct arithmetic behavior.
impl I256Add of Add<I256> {
    /// Adds two I256 values with proper sign handling.
    ///
    /// # Arguments
    /// * `lhs` - Left-hand side operand
    /// * `rhs` - Right-hand side operand
    ///
    /// # Returns
    /// * The sum of the two operands
    ///
    /// # Examples
    /// ```
    /// // Positive + Positive = Positive
    /// (5) + (3) = 8
    ///
    /// // Positive + Negative = depends on magnitudes
    /// (5) + (-3) = 2
    /// (3) + (-5) = -2
    ///
    /// // Negative + Negative = Negative
    /// (-5) + (-3) = -8
    /// ```
    fn add(lhs: I256, rhs: I256) -> I256 {
        match (lhs.is_negative, rhs.is_negative) {
            // Both negative: add absolute values, result is negative
            (true, true) => I256 { value: lhs.value + rhs.value, is_negative: true },
            // Positive + Negative: subtract smaller from larger, sign follows larger
            (
                false, true,
            ) => {
                if lhs.value >= rhs.value {
                    return I256 { value: lhs.value - rhs.value, is_negative: false };
                } else {
                    return I256 { value: rhs.value - lhs.value, is_negative: true };
                }
            },
            // Negative + Positive: subtract smaller from larger, sign follows larger
            (
                true, false,
            ) => {
                if rhs.value >= lhs.value {
                    return I256 { value: rhs.value - lhs.value, is_negative: false };
                } else {
                    return I256 { value: lhs.value - rhs.value, is_negative: true };
                }
            },
            // Both positive: add absolute values, result is positive
            (false, false) => I256 { value: lhs.value + rhs.value, is_negative: false },
        }
    }
}

/// Implementation of subtraction for I256 values.
///
/// This implementation handles all combinations of positive and negative
/// operands, ensuring correct arithmetic behavior.
impl I256Sub of Sub<I256> {
    /// Subtracts two I256 values with proper sign handling.
    ///
    /// # Arguments
    /// * `lhs` - Left-hand side operand (minuend)
    /// * `rhs` - Right-hand side operand (subtrahend)
    ///
    /// # Returns
    /// * The difference of the two operands
    ///
    /// # Examples
    /// ```
    /// // Positive - Positive = depends on magnitudes
    /// (5) - (3) = 2
    /// (3) - (5) = -2
    ///
    /// // Positive - Negative = Positive (addition)
    /// (5) - (-3) = 8
    ///
    /// // Negative - Positive = Negative (addition)
    /// (-5) - (3) = -8
    ///
    /// // Negative - Negative = depends on magnitudes
    /// (-3) - (-5) = 2
    /// (-5) - (-3) = -2
    /// ```
    fn sub(lhs: I256, rhs: I256) -> I256 {
        match (lhs.is_negative, rhs.is_negative) {
            // Both negative: subtract absolute values, sign follows larger
            (
                true, true,
            ) => {
                if rhs.value >= lhs.value {
                    return I256 { value: rhs.value - lhs.value, is_negative: false };
                } else {
                    return I256 { value: lhs.value - rhs.value, is_negative: true };
                }
            },
            // Positive - Negative = Positive (addition)
            (false, true) => I256 { value: lhs.value + rhs.value, is_negative: false },
            // Negative - Positive = Negative (addition)
            (true, false) => I256 { value: lhs.value + rhs.value, is_negative: true },
            // Both positive: subtract absolute values, sign follows larger
            (
                false, false,
            ) => {
                if lhs.value >= rhs.value {
                    return I256 { value: lhs.value - rhs.value, is_negative: false };
                } else {
                    return I256 { value: rhs.value - lhs.value, is_negative: true };
                }
            },
        }
    }
}

/// Implementation of negation for I256 values.
///
/// This implementation changes the sign of the value while preserving
/// the absolute magnitude.
impl I256Neg of Neg<I256> {
    /// Negates an I256 value (changes its sign).
    ///
    /// # Arguments
    /// * `a` - The value to negate
    ///
    /// # Returns
    /// * The negated value
    ///
    /// # Note
    /// Zero remains zero after negation (always positive).
    ///
    /// # Examples
    /// ```
    /// -5 -> 5
    /// 5 -> -5
    /// 0 -> 0 (unchanged)
    /// ```
    fn neg(a: I256) -> I256 {
        if a.value == 0 {
            I256 { value: a.value, is_negative: false }
        } else {
            I256 { value: a.value, is_negative: !a.is_negative }
        }
    }
}

/// Implementation of partial ordering for I256 values.
///
/// This implementation provides comparison operations (less than, greater than,
/// less than or equal, greater than or equal) with proper sign handling.
impl I256PartialOrd of PartialOrd<I256> {
    /// Checks if the left operand is less than the right operand.
    ///
    /// # Arguments
    /// * `lhs` - Left-hand side operand
    /// * `rhs` - Right-hand side operand
    ///
    /// # Returns
    /// * `true` if lhs < rhs, `false` otherwise
    fn lt(lhs: I256, rhs: I256) -> bool {
        match (lhs.is_negative, rhs.is_negative) {
            // Both negative: compare absolute values (larger absolute = smaller value)
            (true, true) => lhs.value > rhs.value,
            // Positive < Negative = false
            (false, true) => false,
            // Negative < Positive = true
            (true, false) => true,
            // Both positive: compare absolute values
            (false, false) => lhs.value < rhs.value,
        }
    }

    /// Checks if the left operand is greater than the right operand.
    ///
    /// # Arguments
    /// * `lhs` - Left-hand side operand
    /// * `rhs` - Right-hand side operand
    ///
    /// # Returns
    /// * `true` if lhs > rhs, `false` otherwise
    fn gt(lhs: I256, rhs: I256) -> bool {
        match (lhs.is_negative, rhs.is_negative) {
            // Both negative: compare absolute values (smaller absolute = larger value)
            (true, true) => lhs.value < rhs.value,
            // Positive > Negative = true
            (false, true) => true,
            // Negative > Positive = false
            (true, false) => false,
            // Both positive: compare absolute values
            (false, false) => lhs.value > rhs.value,
        }
    }

    /// Checks if the left operand is less than or equal to the right operand.
    ///
    /// # Arguments
    /// * `lhs` - Left-hand side operand
    /// * `rhs` - Right-hand side operand
    ///
    /// # Returns
    /// * `true` if lhs <= rhs, `false` otherwise
    fn le(lhs: I256, rhs: I256) -> bool {
        match (lhs.is_negative, rhs.is_negative) {
            // Both negative: compare absolute values
            (true, true) => lhs.value >= rhs.value,
            // Positive <= Negative = false
            (false, true) => false,
            // Negative <= Positive = true
            (true, false) => true,
            // Both positive: compare absolute values
            (false, false) => lhs.value <= rhs.value,
        }
    }

    /// Checks if the left operand is greater than or equal to the right operand.
    ///
    /// # Arguments
    /// * `lhs` - Left-hand side operand
    /// * `rhs` - Right-hand side operand
    ///
    /// # Returns
    /// * `true` if lhs >= rhs, `false` otherwise
    fn ge(lhs: I256, rhs: I256) -> bool {
        match (lhs.is_negative, rhs.is_negative) {
            // Both negative: compare absolute values
            (true, true) => lhs.value <= rhs.value,
            // Positive >= Negative = true
            (false, true) => true,
            // Negative >= Positive = false
            (true, false) => false,
            // Both positive: compare absolute values
            (false, false) => lhs.value >= rhs.value,
        }
    }
}

/// Implementation of conversion from u256 to I256.
///
/// This implementation allows converting unsigned integers to signed integers,
/// treating them as positive values.
impl I256Into of Into<u256, I256> {
    /// Converts a u256 to an I256, treating it as a positive value.
    ///
    /// # Arguments
    /// * `self` - The unsigned integer to convert
    ///
    /// # Returns
    /// * An I256 with the same value and is_negative = false
    fn into(self: u256) -> I256 {
        I256 { value: self, is_negative: false }
    }
}

/// Implementation of conversion from I256 to u256.
///
/// This implementation allows converting signed integers to unsigned integers,
/// but only for non-negative values.
impl I256TryInto of TryInto<I256, u256> {
    /// Attempts to convert an I256 to a u256.
    ///
    /// # Arguments
    /// * `self` - The signed integer to convert
    ///
    /// # Returns
    /// * `Some(value)` if the value is non-negative, `None` otherwise
    ///
    /// # Examples
    /// ```
    /// 5 -> Some(5)
    /// -5 -> None
    /// 0 -> Some(0)
    /// ```
    fn try_into(self: I256) -> Option<u256> {
        match !self.is_negative {
            true => Some(self.value),
            false => None,
        }
    }
}
