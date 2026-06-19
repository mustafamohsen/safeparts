use std::collections::BTreeSet;

use safeparts_core::CoreError;
use safeparts_core::encoding::{self, Encoding};
use serde::Serialize;
use zeroize::Zeroizing;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EncodingInfo {
    id: &'static str,
    label: &'static str,
    description: &'static str,
    supports_split: bool,
    supports_combine: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SplitResponse {
    shares: Vec<String>,
    threshold: u8,
    share_count: u8,
    encoding: String,
    passphrase_protected: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CombineResponse {
    secret: Vec<u8>,
    byte_count: usize,
    is_utf8: bool,
    text: Option<String>,
    encoding: String,
    share_count: usize,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareInspection {
    threshold: u8,
    share_count: u8,
    provided_shares: usize,
    encoding: String,
    passphrase_protected: bool,
    ready_to_combine: bool,
    consistent: bool,
    set_id: String,
    share_indexes: Vec<u8>,
}

#[cfg_attr(not(test), tauri::command)]
fn supported_encodings_command() -> Vec<EncodingInfo> {
    vec![
        EncodingInfo {
            id: "auto",
            label: "Auto",
            description: "Detect the share encoding from pasted or loaded recovery shares.",
            supports_split: false,
            supports_combine: true,
        },
        EncodingInfo {
            id: "base64url",
            label: "Base64url",
            description: "Compact URL-safe text for files, tickets, and password managers.",
            supports_split: true,
            supports_combine: true,
        },
        EncodingInfo {
            id: "base58check",
            label: "Base58check",
            description: "Compact text with a checksum and no visually ambiguous characters.",
            supports_split: true,
            supports_combine: true,
        },
        EncodingInfo {
            id: "mnemo-words",
            label: "Mnemonic words",
            description: "Safeparts word groups with a CRC for paper and manual transcription.",
            supports_split: true,
            supports_combine: true,
        },
        EncodingInfo {
            id: "mnemo-bip39",
            label: "BIP-39 words",
            description: "BIP-39-valid phrases for recovery shares; not wallet seed material.",
            supports_split: true,
            supports_combine: true,
        },
    ]
}

#[cfg_attr(not(test), tauri::command)]
fn split_secret_command(
    secret: Vec<u8>,
    threshold: u8,
    share_count: u8,
    encoding: String,
    passphrase: Option<String>,
) -> Result<SplitResponse, String> {
    let encoding = parse_encoding(&encoding)?;
    if encoding.is_auto() {
        return Err("choose a concrete share encoding before splitting".to_string());
    }

    let secret = Zeroizing::new(secret);
    let passphrase = passphrase.map(|value| Zeroizing::new(value.into_bytes()));
    let passphrase_bytes = passphrase.as_ref().map(|value| value.as_slice());
    let packets =
        safeparts_core::split_secret(secret.as_slice(), threshold, share_count, passphrase_bytes)
            .map_err(|err| err.to_string())?;

    let shares = packets
        .iter()
        .map(|packet| encoding::encode_packet(packet, encoding).map_err(|err| err.to_string()))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(SplitResponse {
        shares,
        threshold,
        share_count,
        encoding: encoding.label().to_string(),
        passphrase_protected: passphrase.is_some(),
    })
}

#[cfg_attr(not(test), tauri::command)]
fn combine_shares_command(
    input: String,
    encoding: String,
    passphrase: Option<String>,
) -> Result<CombineResponse, String> {
    let parsed = parse_input(&input, &encoding)?;
    let passphrase = passphrase.map(|value| Zeroizing::new(value.into_bytes()));
    let passphrase_bytes = passphrase.as_ref().map(|value| value.as_slice());
    let secret = safeparts_core::combine_shares(&parsed.packets, passphrase_bytes)
        .map_err(|err| err.to_string())?;
    let byte_count = secret.len();
    let text = String::from_utf8(secret.clone()).ok();

    Ok(CombineResponse {
        secret,
        byte_count,
        is_utf8: text.is_some(),
        text,
        encoding: parsed.encoding.label().to_string(),
        share_count: parsed.packets.len(),
    })
}

#[cfg_attr(not(test), tauri::command)]
fn inspect_shares_command(input: String, encoding: String) -> Result<ShareInspection, String> {
    let parsed = parse_input(&input, &encoding)?;
    let first = parsed
        .packets
        .first()
        .ok_or_else(|| "no recovery shares provided".to_string())?;
    let consistent_metadata = parsed.packets.iter().all(|packet| {
        packet.set_id == first.set_id
            && packet.k == first.k
            && packet.n == first.n
            && packet.crypto_params == first.crypto_params
    });
    let share_indexes = parsed
        .packets
        .iter()
        .map(|packet| packet.x)
        .collect::<Vec<_>>();
    let unique_share_indexes = share_indexes.iter().copied().collect::<BTreeSet<_>>();
    let has_unique_indexes = unique_share_indexes.len() == share_indexes.len();
    let consistent = consistent_metadata && has_unique_indexes;

    Ok(ShareInspection {
        threshold: first.k,
        share_count: first.n,
        provided_shares: parsed.packets.len(),
        encoding: parsed.encoding.label().to_string(),
        passphrase_protected: first.crypto_params.is_some(),
        ready_to_combine: consistent && unique_share_indexes.len() >= usize::from(first.k),
        consistent,
        set_id: hex_bytes(&first.set_id.0),
        share_indexes,
    })
}

fn parse_input(input: &str, encoding: &str) -> Result<encoding::ParsedSharePackets, String> {
    let encoding = parse_encoding(encoding)?;
    encoding::parse_share_packets_wrapped_mnemonics(input, encoding)
        .map_err(sanitize_share_parse_error)
}

fn sanitize_share_parse_error(err: CoreError) -> String {
    match err {
        CoreError::EmptyShareInput => "paste or load recovery shares before continuing".to_string(),
        CoreError::CouldNotDetectEncoding => {
            "could not detect the share encoding; choose the encoding and try again".to_string()
        }
        CoreError::Encoding(_) | CoreError::InvalidPacket(_) => {
            "recovery shares could not be decoded with the selected encoding".to_string()
        }
        other => other.to_string(),
    }
}

fn parse_encoding(name: &str) -> Result<Encoding, String> {
    Encoding::parse_name(name).map_err(|err| err.to_string())
}

fn hex_bytes(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push_str(&format!("{byte:02x}"));
    }
    out
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[cfg(not(test))]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            supported_encodings_command,
            split_secret_command,
            combine_shares_command,
            inspect_shares_command,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Safeparts desktop app");
}

#[cfg(test)]
pub fn run() {}

#[cfg(test)]
mod tests {
    use super::*;

    const ENCODINGS: &[&str] = &["base64url", "base58check", "mnemo-words", "mnemo-bip39"];

    fn join_share_input(shares: &[String], encoding: &str) -> String {
        if encoding.starts_with("mnemo-") {
            shares.join("\n\n")
        } else {
            shares.join("\n")
        }
    }

    #[test]
    fn supported_encodings_cover_split_and_auto_combine() {
        let encodings = supported_encodings_command();

        assert_eq!(encodings.len(), 5);
        assert!(encodings.iter().any(|encoding| {
            encoding.id == "auto" && !encoding.supports_split && encoding.supports_combine
        }));
        for encoding in ENCODINGS {
            assert!(encodings.iter().any(|info| {
                info.id == *encoding && info.supports_split && info.supports_combine
            }));
        }
    }

    #[test]
    fn round_trips_every_concrete_encoding() {
        for encoding in ENCODINGS {
            let split = split_secret_command(
                b"desktop round trip secret".to_vec(),
                2,
                3,
                (*encoding).to_string(),
                None,
            )
            .unwrap();
            let input = join_share_input(&split.shares[..2], encoding);

            let combined = combine_shares_command(input, (*encoding).to_string(), None).unwrap();

            assert_eq!(combined.secret, b"desktop round trip secret");
            assert_eq!(combined.encoding, *encoding);
            assert!(combined.is_utf8);
        }
    }

    #[test]
    fn auto_encoding_combines_round_trip() {
        let split = split_secret_command(
            b"auto encoding desktop secret".to_vec(),
            2,
            3,
            "base58check".to_string(),
            None,
        )
        .unwrap();

        let combined =
            combine_shares_command(split.shares[..2].join("\n"), "auto".to_string(), None).unwrap();

        assert_eq!(combined.secret, b"auto encoding desktop secret");
        assert_eq!(combined.encoding, "base58check");
    }

    #[test]
    fn passphrase_protected_shares_combine_with_passphrase() {
        let split = split_secret_command(
            b"passphrase protected desktop secret".to_vec(),
            2,
            3,
            "base64url".to_string(),
            Some("correct horse battery staple".to_string()),
        )
        .unwrap();

        let combined = combine_shares_command(
            split.shares[..2].join("\n"),
            "base64url".to_string(),
            Some("correct horse battery staple".to_string()),
        )
        .unwrap();

        assert_eq!(combined.secret, b"passphrase protected desktop secret");
    }

    #[test]
    fn wrong_passphrase_returns_error() {
        let split = split_secret_command(
            b"passphrase negative desktop secret".to_vec(),
            2,
            3,
            "base64url".to_string(),
            Some("right passphrase".to_string()),
        )
        .unwrap();

        let err = combine_shares_command(
            split.shares[..2].join("\n"),
            "base64url".to_string(),
            Some("wrong passphrase".to_string()),
        )
        .unwrap_err();

        assert!(!err.is_empty());
    }

    #[test]
    fn too_few_shares_returns_error() {
        let split = split_secret_command(
            b"too few shares desktop secret".to_vec(),
            2,
            3,
            "base64url".to_string(),
            None,
        )
        .unwrap();

        let err = combine_shares_command(split.shares[0].clone(), "base64url".to_string(), None)
            .unwrap_err();

        assert!(err.contains("not enough shares") || err.contains("need"));
    }

    #[test]
    fn inspect_reports_share_metadata() {
        let split = split_secret_command(
            b"inspect desktop secret".to_vec(),
            2,
            3,
            "base64url".to_string(),
            None,
        )
        .unwrap();

        let inspection =
            inspect_shares_command(split.shares[..2].join("\n"), "auto".to_string()).unwrap();

        assert_eq!(inspection.threshold, 2);
        assert_eq!(inspection.share_count, 3);
        assert_eq!(inspection.provided_shares, 2);
        assert_eq!(inspection.encoding, "base64url");
        assert!(inspection.ready_to_combine);
        assert!(inspection.consistent);
    }

    #[test]
    fn inspect_reports_duplicate_share_indexes_as_not_ready() {
        let split = split_secret_command(
            b"duplicate share metadata secret".to_vec(),
            2,
            3,
            "base64url".to_string(),
            None,
        )
        .unwrap();
        let duplicate_input = [split.shares[0].as_str(), split.shares[0].as_str()].join("\n");

        let inspection = inspect_shares_command(duplicate_input, "auto".to_string()).unwrap();

        assert_eq!(inspection.provided_shares, 2);
        assert!(!inspection.ready_to_combine);
        assert!(!inspection.consistent);
    }

    #[test]
    fn parse_errors_do_not_echo_share_input() {
        let sensitive_share_fragment = "SUPER-SECRET-SHARE-WORD";
        let err = inspect_shares_command(
            sensitive_share_fragment.to_string(),
            "mnemo-words".to_string(),
        )
        .unwrap_err();

        assert!(!err.contains(sensitive_share_fragment));
        assert_eq!(
            err,
            "recovery shares could not be decoded with the selected encoding"
        );
    }
}
