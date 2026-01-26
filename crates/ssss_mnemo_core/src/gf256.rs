use std::ops::{Add, Mul, Sub};

use crate::error::{CoreError, CoreResult};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Gf256(pub u8);

impl Gf256 {
    pub fn inv(self) -> CoreResult<Self> {
        if self.0 == 0 {
            return Err(CoreError::DivisionByZero);
        }

        Ok(Self(gf_pow(self.0, 254)))
    }

    pub fn checked_div(self, rhs: Self) -> CoreResult<Self> {
        Ok(self * rhs.inv()?)
    }
}

#[allow(clippy::suspicious_arithmetic_impl)]
impl Add for Gf256 {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Self(self.0 ^ rhs.0)
    }
}

#[allow(clippy::suspicious_arithmetic_impl)]
impl Sub for Gf256 {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        self + rhs
    }
}

impl Mul for Gf256 {
    type Output = Self;

    fn mul(self, rhs: Self) -> Self::Output {
        Self(gf_mul(self.0, rhs.0))
    }
}

#[inline]
fn gf_mul(mut a: u8, mut b: u8) -> u8 {
    // GF(256) with modulus x^8 + x^4 + x^3 + x + 1 (0x11b).
    let mut p: u8 = 0;
    for _ in 0..8 {
        if (b & 1) != 0 {
            p ^= a;
        }
        let hi = a & 0x80;
        a <<= 1;
        if hi != 0 {
            a ^= 0x1b;
        }
        b >>= 1;
    }
    p
}

#[inline]
fn gf_pow(mut a: u8, mut exp: u16) -> u8 {
    let mut result: u8 = 1;
    while exp > 0 {
        if (exp & 1) != 0 {
            result = gf_mul(result, a);
        }
        a = gf_mul(a, a);
        exp >>= 1;
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mul_matches_aes_vectors() {
        assert_eq!((Gf256(0x57) * Gf256(0x13)).0, 0xfe);
    }

    #[test]
    fn inverse_property() {
        for a in 1u8..=255 {
            let x = Gf256(a);
            let inv = x.inv().unwrap();
            assert_eq!((x * inv).0, 1);
        }
    }

    #[test]
    fn division_roundtrip() {
        for a in 1u8..=255 {
            for b in 1u8..=255 {
                let x = Gf256(a);
                let y = Gf256(b);
                let z = x.checked_div(y).unwrap();
                assert_eq!(z * y, x);
            }
        }
    }
}
