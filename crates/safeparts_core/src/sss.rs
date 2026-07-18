use crate::error::{CoreError, CoreResult};
use crate::gf256::Gf256;
use rand::RngCore;
use rand::rngs::OsRng;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SetId(pub [u8; 16]);

impl SetId {
    pub fn random() -> Self {
        let mut bytes = [0u8; 16];
        OsRng.fill_bytes(&mut bytes);
        Self(bytes)
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RawShare {
    pub set_id: SetId,
    pub k: u8,
    pub n: u8,
    pub x: u8,
    pub y: Vec<u8>,
}

pub fn split(secret: &[u8], k: u8, n: u8, set_id: SetId) -> CoreResult<Vec<RawShare>> {
    if k == 0 || n == 0 || k > n {
        return Err(CoreError::InvalidKAndN { k, n });
    }
    let secret_len = secret.len();

    // Prepare output shares with x=1..=n
    let mut shares: Vec<RawShare> = (1..=n)
        .map(|x| RawShare {
            set_id,
            k,
            n,
            x,
            y: vec![0u8; secret_len],
        })
        .collect();

    let mut coeffs = vec![0u8; k.saturating_sub(1) as usize];

    for (idx, &byte) in secret.iter().enumerate() {
        // Random coefficients a1..a_{k-1}
        if !coeffs.is_empty() {
            OsRng.fill_bytes(&mut coeffs);
        }

        for share in &mut shares {
            let x = Gf256(share.x);
            let mut y = Gf256(byte);
            let mut x_pow = Gf256(1);

            for &coef in &coeffs {
                x_pow = x_pow * x;
                y = y + (Gf256(coef) * x_pow);
            }

            share.y[idx] = y.0;
        }
    }

    Ok(shares)
}

pub fn combine(shares: &[RawShare]) -> CoreResult<Vec<u8>> {
    if shares.is_empty() {
        return Err(CoreError::NotEnoughShares { k: 1, m: 0 });
    }

    let k = shares[0].k;
    let set_id = shares[0].set_id;
    let n = shares[0].n;
    let y_len = shares[0].y.len();

    if shares.len() < k as usize {
        return Err(CoreError::NotEnoughShares { k, m: shares.len() });
    }

    let mut seen = [false; 256];
    for s in shares {
        if s.set_id != set_id || s.k != k || s.n != n || s.y.len() != y_len {
            return Err(CoreError::InconsistentMetadata);
        }
        if s.x == 0 {
            return Err(CoreError::InvalidX);
        }
        if seen[s.x as usize] {
            return Err(CoreError::DuplicateX { x: s.x });
        }
        seen[s.x as usize] = true;
    }

    let x_values: Vec<Gf256> = shares.iter().map(|share| Gf256(share.x)).collect();
    let weights = interpolation_weights_at_zero(&x_values)?;
    let mut secret = vec![0u8; y_len];

    for (byte_index, secret_byte) in secret.iter_mut().enumerate() {
        let value = shares
            .iter()
            .zip(&weights)
            .fold(Gf256(0), |value, (share, weight)| {
                value + Gf256(share.y[byte_index]) * *weight
            });
        *secret_byte = value.0;
    }

    Ok(secret)
}

fn interpolation_weights_at_zero(x_values: &[Gf256]) -> CoreResult<Vec<Gf256>> {
    x_values
        .iter()
        .enumerate()
        .map(|(share_index, &x)| {
            let (numerator, denominator) = x_values
                .iter()
                .enumerate()
                .filter(|(index, _)| *index != share_index)
                .fold(
                    (Gf256(1), Gf256(1)),
                    |(numerator, denominator), (_, &other_x)| {
                        (numerator * other_x, denominator * (x - other_x))
                    },
                );

            numerator.checked_div(denominator)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_3_of_5() {
        let secret = b"hello world";
        let set_id = SetId::random();
        let shares = split(secret, 3, 5, set_id).unwrap();

        let recovered = combine(&shares[0..3]).unwrap();
        assert_eq!(recovered, secret);

        let recovered2 =
            combine(&[shares[1].clone(), shares[3].clone(), shares[4].clone()]).unwrap();
        assert_eq!(recovered2, secret);
    }

    #[test]
    fn insufficient_shares_fails() {
        let secret = b"abc";
        let set_id = SetId::random();
        let shares = split(secret, 3, 5, set_id).unwrap();
        let err = combine(&shares[0..2]).unwrap_err();
        assert!(matches!(err, CoreError::NotEnoughShares { .. }));
    }
}
