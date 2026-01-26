use core::convert::TryInto;

use crate::crypto::CryptoParams;
use crate::error::{CoreError, CoreResult};
use crate::sss::{RawShare, SetId};

const MAGIC: [u8; 4] = *b"SMN1";
const VERSION_V1: u8 = 1;
const VERSION_V2: u8 = 2;

const FLAG_ENCRYPTED: u8 = 0b0000_0001;

const BASE_HEADER_LEN: usize = 4 + 1 + 1 + 1 + 1 + 1 + 16;
const PAYLOAD_LEN_FIELD_LEN: usize = 4;

const CRYPTO_PARAMS_LEN: usize = 16 + 12 + 4 + 4 + 4;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SharePacket {
    pub set_id: SetId,
    pub k: u8,
    pub n: u8,
    pub x: u8,
    pub payload: Vec<u8>,
    pub crypto_params: Option<CryptoParams>,
}

impl SharePacket {
    pub fn from_raw_share(share: RawShare) -> Self {
        Self {
            set_id: share.set_id,
            k: share.k,
            n: share.n,
            x: share.x,
            payload: share.y,
            crypto_params: None,
        }
    }

    pub fn with_crypto_params(mut self, params: Option<CryptoParams>) -> Self {
        self.crypto_params = params;
        self
    }

    pub fn is_encrypted(&self) -> bool {
        self.crypto_params.is_some()
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

    pub fn encode_binary(&self) -> CoreResult<Vec<u8>> {
        let flags = if let Some(params) = self.crypto_params {
            // Validate params are sane.
            if params.mem_cost_kib == 0 || params.time_cost == 0 || params.parallelism == 0 {
                return Err(CoreError::InvalidPacket(
                    "invalid crypto params".to_string(),
                ));
            }
            FLAG_ENCRYPTED
        } else {
            0
        };

        let payload_len_u32 = u32::try_from(self.payload.len())
            .map_err(|_| CoreError::InvalidPacket("payload too large".to_string()))?;

        let mut out = Vec::with_capacity(
            BASE_HEADER_LEN + CRYPTO_PARAMS_LEN + PAYLOAD_LEN_FIELD_LEN + self.payload.len(),
        );
        out.extend_from_slice(&MAGIC);
        out.push(VERSION_V2);
        out.push(flags);
        out.push(self.k);
        out.push(self.n);
        out.push(self.x);
        out.extend_from_slice(&self.set_id.0);

        if let Some(params) = self.crypto_params {
            out.extend_from_slice(&params.salt);
            out.extend_from_slice(&params.nonce);
            out.extend_from_slice(&params.mem_cost_kib.to_be_bytes());
            out.extend_from_slice(&params.time_cost.to_be_bytes());
            out.extend_from_slice(&params.parallelism.to_be_bytes());
        }

        out.extend_from_slice(&payload_len_u32.to_be_bytes());
        out.extend_from_slice(&self.payload);
        Ok(out)
    }

    pub fn decode_binary(bytes: &[u8]) -> CoreResult<Self> {
        let total_len = binary_total_len(bytes)?;
        if bytes.len() != total_len {
            return Err(CoreError::InvalidPacket("length mismatch".to_string()));
        }

        let version = bytes[4];
        let flags = bytes[5];
        let k = bytes[6];
        let n = bytes[7];
        let x = bytes[8];

        let mut set_id = [0u8; 16];
        set_id.copy_from_slice(&bytes[9..25]);

        let (crypto_params, payload_len_offset) = match version {
            VERSION_V1 => (None, 25),
            VERSION_V2 => {
                let mut offset = BASE_HEADER_LEN;
                let params =
                    if (flags & FLAG_ENCRYPTED) != 0 {
                        if bytes.len() < offset + CRYPTO_PARAMS_LEN {
                            return Err(CoreError::InvalidPacket(
                                "truncated crypto params".to_string(),
                            ));
                        }
                        let mut salt = [0u8; 16];
                        salt.copy_from_slice(&bytes[offset..offset + 16]);
                        offset += 16;

                        let mut nonce = [0u8; 12];
                        nonce.copy_from_slice(&bytes[offset..offset + 12]);
                        offset += 12;

                        let mem_cost_kib =
                            u32::from_be_bytes(bytes[offset..offset + 4].try_into().map_err(
                                |_| CoreError::InvalidPacket("bad mem_cost".to_string()),
                            )?);
                        offset += 4;

                        let time_cost =
                            u32::from_be_bytes(bytes[offset..offset + 4].try_into().map_err(
                                |_| CoreError::InvalidPacket("bad time_cost".to_string()),
                            )?);
                        offset += 4;

                        let parallelism =
                            u32::from_be_bytes(bytes[offset..offset + 4].try_into().map_err(
                                |_| CoreError::InvalidPacket("bad parallelism".to_string()),
                            )?);
                        offset += 4;

                        Some(CryptoParams {
                            salt,
                            nonce,
                            mem_cost_kib,
                            time_cost,
                            parallelism,
                        })
                    } else {
                        None
                    };

                (params, offset)
            }
            _ => return Err(CoreError::InvalidPacket("unsupported version".to_string())),
        };

        let payload_len_bytes: [u8; 4] = bytes[payload_len_offset..payload_len_offset + 4]
            .try_into()
            .map_err(|_| CoreError::InvalidPacket("bad length field".to_string()))?;
        let payload_len = u32::from_be_bytes(payload_len_bytes) as usize;
        let payload_start = payload_len_offset + 4;
        let payload_end = payload_start + payload_len;

        Ok(Self {
            set_id: SetId(set_id),
            k,
            n,
            x,
            payload: bytes[payload_start..payload_end].to_vec(),
            crypto_params,
        })
    }
}

pub fn binary_total_len(bytes: &[u8]) -> CoreResult<usize> {
    let min_len = BASE_HEADER_LEN + PAYLOAD_LEN_FIELD_LEN;
    if bytes.len() < min_len {
        return Err(CoreError::InvalidPacket("too short".to_string()));
    }

    if bytes[0..4] != MAGIC {
        return Err(CoreError::InvalidPacket("bad magic".to_string()));
    }

    let version = bytes[4];

    let payload_len_offset = match version {
        VERSION_V1 => 25,
        VERSION_V2 => {
            let flags = bytes[5];
            let mut offset = BASE_HEADER_LEN;
            if (flags & FLAG_ENCRYPTED) != 0 {
                offset = offset
                    .checked_add(CRYPTO_PARAMS_LEN)
                    .ok_or_else(|| CoreError::InvalidPacket("offset overflow".to_string()))?;
            }
            offset
        }
        _ => return Err(CoreError::InvalidPacket("unsupported version".to_string())),
    };

    if bytes.len() < payload_len_offset + PAYLOAD_LEN_FIELD_LEN {
        return Err(CoreError::InvalidPacket("too short".to_string()));
    }

    let payload_len_bytes: [u8; 4] = bytes[payload_len_offset..payload_len_offset + 4]
        .try_into()
        .map_err(|_| CoreError::InvalidPacket("bad length field".to_string()))?;
    let payload_len = u32::from_be_bytes(payload_len_bytes) as usize;

    payload_len_offset
        .checked_add(PAYLOAD_LEN_FIELD_LEN)
        .and_then(|v| v.checked_add(payload_len))
        .ok_or_else(|| CoreError::InvalidPacket("length overflow".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn binary_round_trip_v2_unencrypted() {
        let pkt = SharePacket {
            set_id: SetId([7u8; 16]),
            k: 3,
            n: 5,
            x: 1,
            payload: vec![1, 2, 3, 4],
            crypto_params: None,
        };

        let enc = pkt.encode_binary().unwrap();
        let dec = SharePacket::decode_binary(&enc).unwrap();
        assert_eq!(dec, pkt);
    }

    #[test]
    fn binary_round_trip_v2_encrypted() {
        let pkt = SharePacket {
            set_id: SetId([8u8; 16]),
            k: 2,
            n: 3,
            x: 2,
            payload: vec![9, 9, 9, 9, 9],
            crypto_params: Some(CryptoParams {
                salt: [1u8; 16],
                nonce: [2u8; 12],
                mem_cost_kib: 1024,
                time_cost: 1,
                parallelism: 1,
            }),
        };

        let enc = pkt.encode_binary().unwrap();
        let dec = SharePacket::decode_binary(&enc).unwrap();
        assert_eq!(dec, pkt);
    }
}
