//! Core split, combine, packet, and encoding APIs for Safeparts.
//!
//! Most callers should use [`split_secret`] and [`combine_shares`], then encode
//! the returned [`packet::SharePacket`] values with [`encoding::encode_packet`].
//! The crate works on bytes, so callers can split UTF-8 text, binary keys, or
//! exported credential files without a separate conversion layer.
//!
//! # Example
//!
//! ```
//! use safeparts_core::{combine_shares, split_secret, CoreResult};
//!
//! fn main() -> CoreResult<()> {
//!     let shares = split_secret(b"example secret", 2, 3, None)?;
//!     let recovered = combine_shares(&shares[..2], None)?;
//!
//!     assert_eq!(recovered, b"example secret");
//!     Ok(())
//! }
//! ```

pub mod ascii;
pub mod crypto;
pub mod encoding;
pub mod error;
pub mod gf256;
pub mod mnemo_bip39;
pub mod mnemo_words;
pub mod packet;
pub mod sss;

pub use crate::error::{CoreError, CoreResult};

pub const INTEGRITY_TAG_LEN: usize = 32;

/// Split plaintext bytes into `n` share packets with a threshold of `k`.
///
/// This is a compatibility wrapper around [`split_secret`] without passphrase
/// protection. New code should usually call [`split_secret`] directly so the
/// passphrase policy is visible at the call site.
pub fn tag_and_split(secret: &[u8], k: u8, n: u8) -> CoreResult<Vec<packet::SharePacket>> {
    split_secret(secret, k, n, None)
}

/// Combine share packets created without passphrase protection.
///
/// This is a compatibility wrapper around [`combine_shares`]. New code should
/// usually call [`combine_shares`] directly so passphrase handling is explicit.
pub fn combine_and_verify(packets: &[packet::SharePacket]) -> CoreResult<Vec<u8>> {
    combine_shares(packets, None)
}

/// Split secret bytes into self-describing share packets.
///
/// `k` is the number of shares required for recovery. `n` is the total number
/// of shares to create. The valid range is `1 <= k <= n <= 255`.
///
/// When `passphrase` is `Some`, Safeparts encrypts the secret before splitting
/// it. Recovery then requires both at least `k` shares and the same passphrase.
/// The returned packets carry the non-secret crypto parameters needed for
/// decryption, but never the passphrase.
///
/// # Example
///
/// ```
/// use safeparts_core::{combine_shares, split_secret, CoreResult};
///
/// fn main() -> CoreResult<()> {
///     let shares = split_secret(b"example secret", 2, 3, None)?;
///     let recovered = combine_shares(&shares[..2], None)?;
///
///     assert_eq!(recovered, b"example secret");
///     Ok(())
/// }
/// ```
pub fn split_secret(
    secret: &[u8],
    k: u8,
    n: u8,
    passphrase: Option<&[u8]>,
) -> CoreResult<Vec<packet::SharePacket>> {
    let (mut data_to_split, crypto_params) = if let Some(passphrase) = passphrase {
        let (ciphertext, params) = crypto::encrypt(secret, passphrase)?;
        (ciphertext, Some(params))
    } else {
        (secret.to_vec(), None)
    };

    let tag = blake3::hash(&data_to_split);
    data_to_split.extend_from_slice(tag.as_bytes());

    let set_id = sss::SetId::random();
    let shares = sss::split(&data_to_split, k, n, set_id)?;

    Ok(shares
        .into_iter()
        .map(|share| packet::SharePacket::from_raw_share(share).with_crypto_params(crypto_params))
        .collect())
}

/// Recover the original secret bytes from share packets.
///
/// The input must contain at least `k` packets from the same split set. Extra
/// packets are allowed, but duplicate share coordinates or mixed metadata cause
/// typed errors.
///
/// Pass `Some(passphrase)` when the shares were created with passphrase
/// protection. Passing `None` for encrypted shares returns
/// [`CoreError::PassphraseRequired`].
///
/// # Example
///
/// ```
/// use safeparts_core::{combine_shares, split_secret, CoreResult};
///
/// fn main() -> CoreResult<()> {
///     let passphrase = b"example passphrase";
///     let shares = split_secret(b"example secret", 2, 3, Some(passphrase))?;
///     let recovered = combine_shares(&shares[..2], Some(passphrase))?;
///
///     assert_eq!(recovered, b"example secret");
///     Ok(())
/// }
/// ```
pub fn combine_shares(
    packets: &[packet::SharePacket],
    passphrase: Option<&[u8]>,
) -> CoreResult<Vec<u8>> {
    if packets.is_empty() {
        return Err(CoreError::NotEnoughShares { k: 1, m: 0 });
    }

    let crypto_params = packets[0].crypto_params;
    for p in packets {
        if p.crypto_params != crypto_params {
            return Err(CoreError::CryptoParamsMismatch);
        }
    }

    let shares: Vec<sss::RawShare> = packets
        .iter()
        .map(packet::SharePacket::to_raw_share)
        .collect::<CoreResult<_>>()?;

    let combined = sss::combine(&shares)?;
    if combined.len() < INTEGRITY_TAG_LEN {
        return Err(CoreError::InvalidCombinedLength {
            len: combined.len(),
        });
    }

    let (data, tag) = combined.split_at(combined.len() - INTEGRITY_TAG_LEN);
    let expected = blake3::hash(data);
    if expected.as_bytes() != tag {
        return Err(CoreError::IntegrityCheckFailed);
    }

    match crypto_params {
        None => Ok(data.to_vec()),
        Some(params) => {
            let passphrase = passphrase.ok_or(CoreError::PassphraseRequired)?;
            crypto::decrypt(data, passphrase, params)
        }
    }
}
