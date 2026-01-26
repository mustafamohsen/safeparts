pub mod ascii;
pub mod error;
pub mod gf256;
pub mod mnemo_words;
pub mod packet;
pub mod sss;

pub use crate::error::{CoreError, CoreResult};

pub const INTEGRITY_TAG_LEN: usize = 32;

pub fn tag_and_split(secret: &[u8], k: u8, n: u8) -> CoreResult<Vec<packet::SharePacket>> {
    let mut tagged = Vec::with_capacity(secret.len() + INTEGRITY_TAG_LEN);
    tagged.extend_from_slice(secret);
    tagged.extend_from_slice(blake3::hash(secret).as_bytes());

    let set_id = sss::SetId::random();
    let shares = sss::split(&tagged, k, n, set_id)?;

    Ok(shares
        .into_iter()
        .map(packet::SharePacket::from_raw_share)
        .collect())
}

pub fn combine_and_verify(packets: &[packet::SharePacket]) -> CoreResult<Vec<u8>> {
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

    let (secret, tag) = combined.split_at(combined.len() - INTEGRITY_TAG_LEN);
    let expected = blake3::hash(secret);
    if expected.as_bytes() != tag {
        return Err(CoreError::IntegrityCheckFailed);
    }

    Ok(secret.to_vec())
}
