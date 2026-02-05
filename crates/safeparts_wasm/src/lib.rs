use wasm_bindgen::prelude::*;

use js_sys::{Array, Object, Reflect, Uint8Array};

#[wasm_bindgen]
pub fn share_threshold(share: &str, encoding: &str) -> Result<u8, JsValue> {
    let packet = decode_packet(share, encoding).map_err(|e| JsValue::from_str(&e))?;
    Ok(packet.k)
}

#[wasm_bindgen]
pub fn split_secret(
    secret: &[u8],
    k: u8,
    n: u8,
    encoding: &str,
    passphrase: Option<String>,
) -> Result<Array, JsValue> {
    let passphrase_bytes = passphrase.as_deref().map(str::as_bytes);

    let packets = safeparts_core::split_secret(secret, k, n, passphrase_bytes)
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

    let secret = safeparts_core::combine_shares(&packets, passphrase_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(Uint8Array::from(secret.as_slice()))
}

#[wasm_bindgen]
pub fn inspect_share(share: &str, encoding: &str) -> Result<JsValue, JsValue> {
    let packet = decode_packet(share, encoding).map_err(|e| JsValue::from_str(&e))?;

    let obj = Object::new();
    Reflect::set(
        &obj,
        &JsValue::from_str("k"),
        &JsValue::from_f64(packet.k as f64),
    )?;
    Reflect::set(
        &obj,
        &JsValue::from_str("n"),
        &JsValue::from_f64(packet.n as f64),
    )?;
    Reflect::set(
        &obj,
        &JsValue::from_str("x"),
        &JsValue::from_f64(packet.x as f64),
    )?;
    Reflect::set(
        &obj,
        &JsValue::from_str("encrypted"),
        &JsValue::from_bool(packet.crypto_params.is_some()),
    )?;

    Ok(obj.into())
}

fn encode_packet(
    packet: &safeparts_core::packet::SharePacket,
    encoding: &str,
) -> Result<String, String> {
    match encoding {
        "base58check" => safeparts_core::ascii::encode_packet(
            packet,
            safeparts_core::ascii::Encoding::Base58check,
        )
        .map_err(|e| e.to_string()),
        "base64url" => {
            safeparts_core::ascii::encode_packet(packet, safeparts_core::ascii::Encoding::Base64url)
                .map_err(|e| e.to_string())
        }
        "mnemo-words" => {
            safeparts_core::mnemo_words::encode_packet(packet).map_err(|e| e.to_string())
        }
        "mnemo-bip39" => {
            safeparts_core::mnemo_bip39::encode_packet(packet).map_err(|e| e.to_string())
        }
        _ => Err(format!("unknown encoding: {encoding}")),
    }
}

fn decode_packet(s: &str, encoding: &str) -> Result<safeparts_core::packet::SharePacket, String> {
    match encoding {
        "base58check" => {
            safeparts_core::ascii::decode_packet(s, safeparts_core::ascii::Encoding::Base58check)
                .map_err(|e| e.to_string())
        }
        "base64url" => {
            safeparts_core::ascii::decode_packet(s, safeparts_core::ascii::Encoding::Base64url)
                .map_err(|e| e.to_string())
        }
        "mnemo-words" => safeparts_core::mnemo_words::decode_packet(s).map_err(|e| e.to_string()),
        "mnemo-bip39" => safeparts_core::mnemo_bip39::decode_packet(s).map_err(|e| e.to_string()),
        _ => Err(format!("unknown encoding: {encoding}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unknown_encoding_is_error() {
        let pkt = safeparts_core::packet::SharePacket {
            set_id: safeparts_core::sss::SetId([0u8; 16]),
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
