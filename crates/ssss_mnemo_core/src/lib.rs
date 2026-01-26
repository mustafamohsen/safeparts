pub mod ascii;
pub mod crypto;
pub mod error;
pub mod gf256;
pub mod mnemo_bip39;
pub mod mnemo_words;
pub mod packet;
pub mod sss;

pub use crate::error::{CoreError, CoreResult};

pub const INTEGRITY_TAG_LEN: usize = 32;

pub fn tag_and_split(secret: &[u8], k: u8, n: u8) -> CoreResult<Vec<packet::SharePacket>> {
    split_secret(secret, k, n, None)
}

pub fn combine_and_verify(packets: &[packet::SharePacket]) -> CoreResult<Vec<u8>> {
    combine_shares(packets, None)
}

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
