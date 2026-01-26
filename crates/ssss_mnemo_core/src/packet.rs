use core::convert::TryInto;

use crate::error::{CoreError, CoreResult};
use crate::sss::{RawShare, SetId};

const MAGIC: [u8; 4] = *b"SMN1";
const VERSION: u8 = 1;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SharePacket {
    pub set_id: SetId,
    pub k: u8,
    pub n: u8,
    pub x: u8,
    pub payload: Vec<u8>,
}

impl SharePacket {
    pub fn from_raw_share(share: RawShare) -> Self {
        Self {
            set_id: share.set_id,
            k: share.k,
            n: share.n,
            x: share.x,
            payload: share.y,
        }
    }

    pub fn to_raw_share(&self) -> CoreResult<RawShare> {
        Ok(RawShare {
            set_id: self.set_id,
            k: self.k,
            n: self.n,
            x: self.x,
            y: self.payload.clone(),
        })
    }

    pub fn encode_binary(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(4 + 1 + 1 + 1 + 1 + 1 + 16 + 4 + self.payload.len());
        out.extend_from_slice(&MAGIC);
        out.push(VERSION);
        out.push(0); // flags (reserved)
        out.push(self.k);
        out.push(self.n);
        out.push(self.x);
        out.extend_from_slice(&self.set_id.0);
        out.extend_from_slice(&(self.payload.len() as u32).to_be_bytes());
        out.extend_from_slice(&self.payload);
        out
    }

    pub fn decode_binary(bytes: &[u8]) -> CoreResult<Self> {
        let min_len = 4 + 1 + 1 + 1 + 1 + 1 + 16 + 4;
        if bytes.len() < min_len {
            return Err(CoreError::InvalidPacket("too short".to_string()));
        }

        if bytes[0..4] != MAGIC {
            return Err(CoreError::InvalidPacket("bad magic".to_string()));
        }

        if bytes[4] != VERSION {
            return Err(CoreError::InvalidPacket("unsupported version".to_string()));
        }

        let _flags = bytes[5];
        let k = bytes[6];
        let n = bytes[7];
        let x = bytes[8];

        let mut set_id = [0u8; 16];
        set_id.copy_from_slice(&bytes[9..25]);

        let payload_len_bytes: [u8; 4] = bytes[25..29]
            .try_into()
            .map_err(|_| CoreError::InvalidPacket("bad length field".to_string()))?;
        let payload_len = u32::from_be_bytes(payload_len_bytes) as usize;
        let payload_start = 29;
        let payload_end = payload_start + payload_len;

        if bytes.len() != payload_end {
            return Err(CoreError::InvalidPacket("length mismatch".to_string()));
        }

        Ok(Self {
            set_id: SetId(set_id),
            k,
            n,
            x,
            payload: bytes[payload_start..payload_end].to_vec(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn binary_round_trip() {
        let pkt = SharePacket {
            set_id: SetId([7u8; 16]),
            k: 3,
            n: 5,
            x: 1,
            payload: vec![1, 2, 3, 4],
        };

        let enc = pkt.encode_binary();
        let dec = SharePacket::decode_binary(&enc).unwrap();
        assert_eq!(dec, pkt);
    }
}
