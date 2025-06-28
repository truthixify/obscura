use core::traits::{Add, Into, Neg, PartialOrd, Sub, TryInto};

#[derive(Debug, Drop, Clone, Copy, PartialEq, Serde)]
pub struct I256 {
    pub value: u256,
    pub is_negative: bool,
}

pub trait I256Trait {
    fn zero() -> I256 {
        I256 { value: 0, is_negative: false }
    }
}

impl I256Impl of I256Trait {}

impl I256Add of Add<I256> {
    fn add(lhs: I256, rhs: I256) -> I256 {
        match (lhs.is_negative, rhs.is_negative) {
            (true, true) => I256 { value: lhs.value + rhs.value, is_negative: true },
            (
                false, true,
            ) => {
                if lhs.value >= rhs.value {
                    return I256 { value: lhs.value - rhs.value, is_negative: false };
                } else {
                    return I256 { value: rhs.value - lhs.value, is_negative: true };
                }
            },
            (
                true, false,
            ) => {
                if rhs.value >= lhs.value {
                    return I256 { value: rhs.value - lhs.value, is_negative: false };
                } else {
                    return I256 { value: lhs.value - rhs.value, is_negative: true };
                }
            },
            (false, false) => I256 { value: lhs.value + rhs.value, is_negative: false },
        }
    }
}

impl I256Sub of Sub<I256> {
    fn sub(lhs: I256, rhs: I256) -> I256 {
        match (lhs.is_negative, rhs.is_negative) {
            (
                true, true,
            ) => {
                if rhs.value >= lhs.value {
                    return I256 { value: rhs.value - lhs.value, is_negative: false };
                } else {
                    return I256 { value: lhs.value - rhs.value, is_negative: true };
                }
            },
            (false, true) => I256 { value: lhs.value + rhs.value, is_negative: false },
            (true, false) => I256 { value: lhs.value + rhs.value, is_negative: true },
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

impl I256Neg of Neg<I256> {
    fn neg(a: I256) -> I256 {
        if a.value == 0 {
            I256 { value: a.value, is_negative: false }
        } else {
            I256 { value: a.value, is_negative: !a.is_negative }
        }
    }
}

impl I256PartialOrd of PartialOrd<I256> {
    fn lt(lhs: I256, rhs: I256) -> bool {
        match (lhs.is_negative, rhs.is_negative) {
            (true, true) => lhs.value > rhs.value,
            (false, true) => false,
            (true, false) => true,
            (false, false) => lhs.value < rhs.value,
        }
    }

    fn gt(lhs: I256, rhs: I256) -> bool {
        match (lhs.is_negative, rhs.is_negative) {
            (true, true) => lhs.value < rhs.value,
            (false, true) => true,
            (true, false) => false,
            (false, false) => lhs.value > rhs.value,
        }
    }

    fn le(lhs: I256, rhs: I256) -> bool {
        match (lhs.is_negative, rhs.is_negative) {
            (true, true) => lhs.value >= rhs.value,
            (false, true) => false,
            (true, false) => true,
            (false, false) => lhs.value <= rhs.value,
        }
    }

    fn ge(lhs: I256, rhs: I256) -> bool {
        match (lhs.is_negative, rhs.is_negative) {
            (true, true) => lhs.value <= rhs.value,
            (false, true) => true,
            (true, false) => false,
            (false, false) => lhs.value >= rhs.value,
        }
    }
}

impl I256Into of Into<u256, I256> {
    fn into(self: u256) -> I256 {
        I256 { value: self, is_negative: false }
    }
}

impl I256TryInto of TryInto<I256, u256> {
    fn try_into(self: I256) -> Option<u256> {
        match !self.is_negative {
            true => Some(self.value),
            false => None,
        }
    }
}
