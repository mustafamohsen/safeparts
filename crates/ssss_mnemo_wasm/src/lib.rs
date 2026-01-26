use wasm_bindgen::prelude::*;

use js_sys::{Array, Uint8Array};

#[wasm_bindgen]
pub fn split_secret(
    secret: &[u8],
    k: u8,
    n: u8,
    encoding: &str,
    passphrase: Option<String>,
) -> Result<Array, JsValue> {
    let passphrase_bytes = passphrase.as_deref().map(str::as_bytes);

    let packets = ssss_mnemo_core::split_secret(secret, k, n, passphrase_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let out = Array::new();
    for packet in packets {
        let s = encode_packet(&packet, encoding).map_err(|e| JsValue::from_str(&e))?;
        out.push(&JsValue::from_str(&s));
    }

    Ok(out)
}

#[wasm_bindgen]
pub fn combine_shares(
    shares: Array,
    encoding: &str,
    passphrase: Option<String>,
) -> Result<Uint8Array, JsValue> {
    let passphrase_bytes = passphrase.as_deref().map(str::as_bytes);

    let mut packets = Vec::with_capacity(shares.length() as usize);
    for share in shares.iter() {
        let share_str = share
            .as_string()
            .ok_or_else(|| JsValue::from_str("share must be a string"))?;
        let packet = decode_packet(&share_str, encoding).map_err(|e| JsValue::from_str(&e))?;
        packets.push(packet);
    }

    let secret = ssss_mnemo_core::combine_shares(&packets, passphrase_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(Uint8Array::from(secret.as_slice()))
}

fn encode_packet(
    packet: &ssss_mnemo_core::packet::SharePacket,
    encoding: &str,
) -> Result<String, String> {
    match encoding {
        "base58check" => ssss_mnemo_core::ascii::encode_packet(
            packet,
            ssss_mnemo_core::ascii::Encoding::Base58check,
        )
        .map_err(|e| e.to_string()),
        "base64url" => ssss_mnemo_core::ascii::encode_packet(
            packet,
            ssss_mnemo_core::ascii::Encoding::Base64url,
        )
        .map_err(|e| e.to_string()),
        "mnemo-words" => {
            ssss_mnemo_core::mnemo_words::encode_packet(packet).map_err(|e| e.to_string())
        }
        "mnemo-bip39" => {
            ssss_mnemo_core::mnemo_bip39::encode_packet(packet).map_err(|e| e.to_string())
        }
        _ => Err(format!("unknown encoding: {encoding}")),
    }
}

fn decode_packet(s: &str, encoding: &str) -> Result<ssss_mnemo_core::packet::SharePacket, String> {
    match encoding {
        "base58check" => {
            ssss_mnemo_core::ascii::decode_packet(s, ssss_mnemo_core::ascii::Encoding::Base58check)
                .map_err(|e| e.to_string())
        }
        "base64url" => {
            ssss_mnemo_core::ascii::decode_packet(s, ssss_mnemo_core::ascii::Encoding::Base64url)
                .map_err(|e| e.to_string())
        }
        "mnemo-words" => ssss_mnemo_core::mnemo_words::decode_packet(s).map_err(|e| e.to_string()),
        "mnemo-bip39" => ssss_mnemo_core::mnemo_bip39::decode_packet(s).map_err(|e| e.to_string()),
        _ => Err(format!("unknown encoding: {encoding}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unknown_encoding_is_error() {
        let pkt = ssss_mnemo_core::packet::SharePacket {
            set_id: ssss_mnemo_core::sss::SetId([0u8; 16]),
            k: 2,
            n: 3,
            x: 1,
            payload: vec![1, 2, 3],
            crypto_params: None,
        };

        let err = encode_packet(&pkt, "nope").unwrap_err();
        assert!(err.contains("unknown encoding"));
    }
}
