use std::collections::HashMap;

use bip39::Language;

use crate::error::{CoreError, CoreResult};
use crate::packet::SharePacket;

const CRC16_POLY: u16 = 0x1021;
const CRC16_INIT: u16 = 0xFFFF;

pub fn encode_packet(packet: &SharePacket) -> CoreResult<String> {
    let payload = packet.encode_binary()?;

    let mut framed = Vec::with_capacity(4 + payload.len() + 2);
    let payload_len = u32::try_from(payload.len())
        .map_err(|_| CoreError::Encoding("packet too large".to_string()))?;
    framed.extend_from_slice(&payload_len.to_be_bytes());
    framed.extend_from_slice(&payload);

    let crc = crc16_ccitt_false(&framed);
    framed.extend_from_slice(&crc.to_be_bytes());

    let words = bytes_to_words(&framed);
    Ok(words.join(" "))
}

pub fn decode_packet(s: &str) -> CoreResult<SharePacket> {
    let words: Vec<&str> = s.split_whitespace().collect();
    if words.is_empty() {
        return Err(CoreError::Encoding("no words provided".to_string()));
    }

    let bytes = words_to_bytes(&words)?;
    if bytes.len() < 4 + 2 {
        return Err(CoreError::Encoding(
            "mnemo-words payload too short".to_string(),
        ));
    }

    let len = u32::from_be_bytes(
        bytes[0..4]
            .try_into()
            .map_err(|_| CoreError::Encoding("mnemo-words length header missing".to_string()))?,
    ) as usize;

    let expected_total = 4usize
        .checked_add(len)
        .and_then(|v| v.checked_add(2))
        .ok_or_else(|| CoreError::Encoding("mnemo-words length overflow".to_string()))?;

    if bytes.len() < expected_total {
        return Err(CoreError::Encoding("mnemo-words truncated".to_string()));
    }

    let framed = &bytes[..expected_total];
    let data = &framed[..expected_total - 2];
    let crc_bytes: [u8; 2] = framed[expected_total - 2..]
        .try_into()
        .map_err(|_| CoreError::Encoding("mnemo-words missing crc".to_string()))?;
    let crc_expected = u16::from_be_bytes(crc_bytes);
    let crc_actual = crc16_ccitt_false(data);

    if crc_actual != crc_expected {
        return Err(CoreError::Encoding("mnemo-words crc mismatch".to_string()));
    }

    let payload = &data[4..];
    SharePacket::decode_binary(payload)
}

fn bytes_to_words(bytes: &[u8]) -> Vec<String> {
    let word_list = Language::English.word_list();

    let mut out = Vec::new();
    let mut acc: u32 = 0;
    let mut acc_bits: u8 = 0;

    for &b in bytes {
        acc = (acc << 8) | u32::from(b);
        acc_bits += 8;

        while acc_bits >= 11 {
            let shift = acc_bits - 11;
            let idx = ((acc >> shift) & 0x7ff) as usize;
            out.push(word_list[idx].to_string());

            acc &= (1u32 << shift) - 1;
            acc_bits = shift;
        }
    }

    if acc_bits != 0 {
        let idx = ((acc << (11 - acc_bits)) & 0x7ff) as usize;
        out.push(word_list[idx].to_string());
    }

    out
}

fn words_to_bytes(words: &[&str]) -> CoreResult<Vec<u8>> {
    let word_list = Language::English.word_list();
    let mut map = HashMap::with_capacity(word_list.len());
    for (i, w) in word_list.iter().enumerate() {
        map.insert(*w, i as u16);
    }

    let mut out = Vec::new();
    let mut acc: u32 = 0;
    let mut acc_bits: u8 = 0;

    for &w in words {
        let idx = match map.get(w) {
            Some(idx) => *idx,
            None => {
                if w.bytes().any(|b| b.is_ascii_uppercase()) {
                    let lowered = w.to_ascii_lowercase();
                    *map.get(lowered.as_str())
                        .ok_or_else(|| CoreError::Encoding(format!("unknown word: {w}")))?
                } else {
                    return Err(CoreError::Encoding(format!("unknown word: {w}")));
                }
            }
        };

        acc = (acc << 11) | u32::from(idx);
        acc_bits += 11;

        while acc_bits >= 8 {
            let shift = acc_bits - 8;
            let byte = ((acc >> shift) & 0xff) as u8;
            out.push(byte);

            acc &= (1u32 << shift) - 1;
            acc_bits = shift;
        }
    }

    if acc_bits != 0 {
        // Remaining bits are padding; capture them as one extra byte so the
        // length header can be parsed, then enforce strict zero padding later.
        let byte = ((acc << (8 - acc_bits)) & 0xff) as u8;
        out.push(byte);
    }

    Ok(out)
}

fn crc16_ccitt_false(bytes: &[u8]) -> u16 {
    let mut crc = CRC16_INIT;
    for &b in bytes {
        crc ^= u16::from(b) << 8;
        for _ in 0..8 {
            if (crc & 0x8000) != 0 {
                crc = (crc << 1) ^ CRC16_POLY;
            } else {
                crc <<= 1;
            }
        }
    }
    crc
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sss::SetId;

    #[test]
    fn round_trip_packet() {
        let pkt = SharePacket {
            set_id: SetId([1u8; 16]),
            k: 3,
            n: 5,
            x: 2,
            payload: vec![9, 8, 7, 6, 5, 4, 3],
            crypto_params: None,
        };

        let s = encode_packet(&pkt).unwrap();
        let decoded = decode_packet(&s).unwrap();
        assert_eq!(decoded, pkt);
    }

    #[test]
    fn decode_accepts_mixed_case_words() {
        let pkt = SharePacket {
            set_id: SetId([1u8; 16]),
            k: 3,
            n: 5,
            x: 2,
            payload: vec![9, 8, 7, 6, 5, 4, 3],
            crypto_params: None,
        };

        let s = encode_packet(&pkt).unwrap();
        let mixed: Vec<String> = s
            .split_whitespace()
            .enumerate()
            .map(|(i, w)| {
                if i % 2 == 0 {
                    w.to_ascii_uppercase()
                } else {
                    w.to_string()
                }
            })
            .collect();

        let decoded = decode_packet(&mixed.join(" ")).unwrap();
        assert_eq!(decoded, pkt);
    }

    #[test]
    fn crc_mismatch_detected() {
        let pkt = SharePacket {
            set_id: SetId([2u8; 16]),
            k: 2,
            n: 3,
            x: 1,
            payload: vec![1, 2, 3, 4, 5],
            crypto_params: None,
        };

        let mut words: Vec<String> = encode_packet(&pkt)
            .unwrap()
            .split_whitespace()
            .map(str::to_string)
            .collect();

        // Flip a word to a different valid word.
        let word_list = Language::English.word_list();
        let idx = word_list.iter().position(|w| w == &words[0]).unwrap();
        words[0] = word_list[(idx + 1) % word_list.len()].to_string();

        let corrupted = words.join(" ");
        let err = decode_packet(&corrupted).unwrap_err();
        assert!(matches!(err, CoreError::Encoding(_)));
    }
}
