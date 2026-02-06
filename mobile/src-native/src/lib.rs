use zeroize::Zeroize;

use std::ffi::{CStr, CString};
use std::os::raw::c_char;

use base64::Engine;

#[derive(Debug, thiserror::Error)]
pub enum SafepartsError {
    #[error("{message}")]
    Error { message: String },
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

pub fn supported_encodings() -> Vec<String> {
    vec![
        "base64url".to_string(),
        "base58check".to_string(),
        "mnemo-words".to_string(),
        "mnemo-bip39".to_string(),
    ]
}

pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn split_secret(
    secret_b64: String,
    k: u8,
    n: u8,
    encoding: String,
    passphrase: Option<String>,
) -> Result<Vec<String>, SafepartsError> {
    let secret = base64::engine::general_purpose::STANDARD
        .decode(secret_b64.as_bytes())
        .map_err(|_| SafepartsError::Error {
            message: "invalid base64 secret".to_string(),
        })?;

    split_secret_bytes(secret, k, n, encoding, passphrase)
        .map_err(|message| SafepartsError::Error { message })
}

fn split_secret_bytes(
    secret: Vec<u8>,
    k: u8,
    n: u8,
    encoding: String,
    passphrase: Option<String>,
) -> Result<Vec<String>, String> {
    let mut secret = secret;

    let mut passphrase = passphrase;
    let passphrase_bytes = passphrase.as_deref().map(str::as_bytes);

    let packets = safeparts_core::split_secret(secret.as_slice(), k, n, passphrase_bytes)
        .map_err(map_core_error)?;

    secret.zeroize();
    if let Some(passphrase) = passphrase.as_mut() {
        passphrase.zeroize();
    }

    let mut out = Vec::with_capacity(packets.len());
    for packet in packets {
        out.push(encode_packet(&packet, &encoding)?);
    }

    Ok(out)
}

pub fn combine_shares(
    shares: Vec<String>,
    encoding: String,
    passphrase: Option<String>,
) -> Result<String, SafepartsError> {
    let secret = combine_shares_bytes(shares, encoding, passphrase)
        .map_err(|message| SafepartsError::Error { message })?;
    Ok(base64::engine::general_purpose::STANDARD.encode(&secret))
}

fn combine_shares_bytes(
    shares: Vec<String>,
    encoding: String,
    passphrase: Option<String>,
) -> Result<Vec<u8>, String> {
    let mut passphrase = passphrase;
    let passphrase_bytes = passphrase.as_deref().map(str::as_bytes);

    let mut packets = Vec::with_capacity(shares.len());
    for s in &shares {
        packets.push(decode_packet(s, &encoding)?);
    }

    let secret =
        safeparts_core::combine_shares(&packets, passphrase_bytes).map_err(map_core_error)?;

    if let Some(passphrase) = passphrase.as_mut() {
        passphrase.zeroize();
    }

    Ok(secret)
}

#[derive(serde::Serialize)]
#[serde(tag = "ok", rename_all = "lowercase")]
enum FfiResponse<T>
where
    T: serde::Serialize,
{
    #[serde(rename = "true")]
    Ok { value: T },
    #[serde(rename = "false")]
    Err { error: String },
}

fn ffi_string(s: String) -> *mut c_char {
    match CString::new(s) {
        Ok(c) => c.into_raw(),
        Err(_) => CString::new("{\"ok\":false,\"error\":\"invalid string\"}")
            .unwrap()
            .into_raw(),
    }
}

unsafe fn opt_string(ptr: *const c_char) -> Option<String> {
    if ptr.is_null() {
        return None;
    }

    let s = unsafe { CStr::from_ptr(ptr) }.to_string_lossy().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn safeparts_string_free(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(CString::from_raw(ptr));
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn safeparts_supported_encodings_json() -> *mut c_char {
    let encodings = supported_encodings();

    let out = serde_json::to_string(&FfiResponse::Ok { value: encodings })
        .unwrap_or_else(|_| "{\"ok\":false,\"error\":\"json encode failed\"}".to_string());
    ffi_string(out)
}

#[unsafe(no_mangle)]
pub extern "C" fn safeparts_split_secret_json(
    secret_b64: *const c_char,
    k: u8,
    n: u8,
    encoding: *const c_char,
    passphrase: *const c_char,
) -> *mut c_char {
    let out = unsafe {
        let encoding = match opt_string(encoding) {
            Some(v) => v,
            None => {
                return ffi_string(
                    serde_json::to_string(&FfiResponse::<Vec<String>>::Err {
                        error: "encoding is required".to_string(),
                    })
                    .unwrap(),
                );
            }
        };

        let secret_b64 = match opt_string(secret_b64) {
            Some(v) => v,
            None => {
                return ffi_string(
                    serde_json::to_string(&FfiResponse::<Vec<String>>::Err {
                        error: "secretB64 is required".to_string(),
                    })
                    .unwrap(),
                );
            }
        };

        let passphrase = opt_string(passphrase);

        let secret = match base64::engine::general_purpose::STANDARD.decode(secret_b64.as_bytes()) {
            Ok(v) => v,
            Err(_) => {
                return ffi_string(
                    serde_json::to_string(&FfiResponse::<Vec<String>>::Err {
                        error: "invalid base64 secret".to_string(),
                    })
                    .unwrap(),
                );
            }
        };

        match split_secret_bytes(secret, k, n, encoding, passphrase) {
            Ok(shares) => serde_json::to_string(&FfiResponse::Ok { value: shares })
                .unwrap_or_else(|_| "{\"ok\":false,\"error\":\"json encode failed\"}".to_string()),
            Err(e) => serde_json::to_string(&FfiResponse::<Vec<String>>::Err { error: e })
                .unwrap_or_else(|_| "{\"ok\":false,\"error\":\"json encode failed\"}".to_string()),
        }
    };

    ffi_string(out)
}

#[unsafe(no_mangle)]
pub extern "C" fn safeparts_combine_shares_json(
    shares_json: *const c_char,
    encoding: *const c_char,
    passphrase: *const c_char,
) -> *mut c_char {
    #[derive(serde::Serialize)]
    struct SecretOut {
        secret_b64: String,
    }

    let out = unsafe {
        let encoding = match opt_string(encoding) {
            Some(v) => v,
            None => {
                return ffi_string(
                    serde_json::to_string(&FfiResponse::<SecretOut>::Err {
                        error: "encoding is required".to_string(),
                    })
                    .unwrap(),
                );
            }
        };

        let shares_json = match opt_string(shares_json) {
            Some(v) => v,
            None => {
                return ffi_string(
                    serde_json::to_string(&FfiResponse::<SecretOut>::Err {
                        error: "sharesJson is required".to_string(),
                    })
                    .unwrap(),
                );
            }
        };

        let passphrase = opt_string(passphrase);

        let shares: Vec<String> = match serde_json::from_str::<Vec<String>>(&shares_json) {
            Ok(v) => v,
            Err(_) => {
                return ffi_string(
                    serde_json::to_string(&FfiResponse::<SecretOut>::Err {
                        error: "invalid shares json".to_string(),
                    })
                    .unwrap(),
                );
            }
        };

        match combine_shares_bytes(shares, encoding, passphrase) {
            Ok(secret) => {
                let secret_b64 = base64::engine::general_purpose::STANDARD.encode(&secret);
                serde_json::to_string(&FfiResponse::Ok {
                    value: SecretOut { secret_b64 },
                })
                .unwrap_or_else(|_| "{\"ok\":false,\"error\":\"json encode failed\"}".to_string())
            }
            Err(e) => serde_json::to_string(&FfiResponse::<SecretOut>::Err { error: e })
                .unwrap_or_else(|_| "{\"ok\":false,\"error\":\"json encode failed\"}".to_string()),
        }
    };

    ffi_string(out)
}

fn map_core_error(err: safeparts_core::CoreError) -> String {
    use safeparts_core::CoreError;

    match err {
        CoreError::NotEnoughShares { k, m } => format!("need {k} shares, got {m}"),
        CoreError::PassphraseRequired => "passphrase required".to_string(),
        CoreError::IntegrityCheckFailed => "integrity check failed".to_string(),
        CoreError::CryptoParamsMismatch => "shares use different encryption parameters".to_string(),
        CoreError::InconsistentMetadata => "shares are from different sets".to_string(),
        CoreError::DuplicateX { x } => format!("duplicate share index: {x}"),
        CoreError::InvalidKAndN { k, n } => format!("invalid threshold parameters: k={k} n={n}"),
        CoreError::InvalidX => "invalid share index".to_string(),
        other => other.to_string(),
    }
}

uniffi::include_scaffolding!("safeparts_mobile_bridge");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_all_encodings() {
        let secret = b"hello safeparts".to_vec();

        for enc in ["base64url", "base58check", "mnemo-words", "mnemo-bip39"] {
            let shares = split_secret_bytes(secret.clone(), 2, 3, enc.to_string(), None).unwrap();
            let recovered = combine_shares_bytes(shares, enc.to_string(), None).unwrap();
            assert_eq!(recovered, secret, "round trip failed for {enc}");
        }
    }

    #[test]
    fn encrypted_requires_passphrase() {
        let secret = b"top secret".to_vec();
        let shares = split_secret_bytes(
            secret.clone(),
            2,
            3,
            "base64url".to_string(),
            Some("pw".to_string()),
        )
        .unwrap();

        let err = combine_shares_bytes(shares.clone(), "base64url".to_string(), None).unwrap_err();
        assert!(err.to_lowercase().contains("passphrase"));

        let err = combine_shares_bytes(
            shares.clone(),
            "base64url".to_string(),
            Some("wrong".to_string()),
        )
        .unwrap_err();
        assert!(err.to_lowercase().contains("decrypt") || err.to_lowercase().contains("failed"));

        let recovered =
            combine_shares_bytes(shares, "base64url".to_string(), Some("pw".to_string())).unwrap();
        assert_eq!(recovered, secret);
    }
}
