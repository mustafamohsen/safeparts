use safeparts_core::{
    CoreError,
    encoding::{self, Encoding},
    packet::SharePacket,
};
use std::{collections::HashSet, ops::Deref};
use zeroize::{Zeroize, Zeroizing};

struct SensitivePackets(Vec<SharePacket>);

impl SensitivePackets {
    fn zeroize_payloads(&mut self) {
        for packet in &mut self.0 {
            packet.payload.zeroize();
        }
    }
}

impl Deref for SensitivePackets {
    type Target = [SharePacket];

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Drop for SensitivePackets {
    fn drop(&mut self) {
        self.zeroize_payloads();
    }
}

#[derive(Clone, Copy, Debug, uniffi::Enum)]
pub enum ShareEncoding {
    Auto,
    Base64url,
    Base58check,
    MnemoWords,
    MnemoBip39,
}

#[derive(Debug, uniffi::Error)]
pub enum BridgeError {
    InvalidParameters,
    InvalidEncoding,
    EmptyInput,
    MalformedShares,
    InsufficientShares,
    DuplicateShares,
    MixedShares,
    PassphraseRequired,
    IncorrectPassphrase,
    IntegrityFailure,
    Internal,
}
impl std::fmt::Display for BridgeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            Self::InvalidParameters => "Invalid threshold or share count.",
            Self::InvalidEncoding => "Choose a concrete encoding for splitting.",
            Self::EmptyInput => "No recovery shares were provided.",
            Self::MalformedShares => "The recovery share input is malformed.",
            Self::InsufficientShares => "More recovery shares are required.",
            Self::DuplicateShares => "Duplicate recovery shares were provided.",
            Self::MixedShares => "Recovery shares do not belong to the same set.",
            Self::PassphraseRequired => "A passphrase is required.",
            Self::IncorrectPassphrase => "The passphrase is incorrect.",
            Self::IntegrityFailure => "Recovery share integrity verification failed.",
            Self::Internal => "Safeparts could not complete the operation.",
        })
    }
}

#[derive(Clone, Debug, uniffi::Record)]
pub struct EncodedShare {
    pub text: String,
    pub index: u8,
    pub share_count: u8,
    pub set_id: String,
}
#[derive(Clone, Debug, uniffi::Record)]
pub struct Inspection {
    pub detected_encoding: ShareEncoding,
    pub threshold: u8,
    pub share_count: u8,
    pub provided_count: u32,
    pub encrypted: bool,
    pub indexes: Vec<u8>,
    pub consistent: bool,
    pub ready: bool,
}
#[derive(Clone, Debug, uniffi::Record)]
pub struct Recovery {
    pub bytes: Vec<u8>,
    pub detected_encoding: ShareEncoding,
    pub threshold: u8,
    pub share_count: u8,
    pub encrypted: bool,
    pub indexes: Vec<u8>,
    pub set_id: String,
}

fn core_encoding(value: ShareEncoding) -> Encoding {
    match value {
        ShareEncoding::Auto => Encoding::Auto,
        ShareEncoding::Base64url => Encoding::Base64url,
        ShareEncoding::Base58check => Encoding::Base58check,
        ShareEncoding::MnemoWords => Encoding::MnemoWords,
        ShareEncoding::MnemoBip39 => Encoding::MnemoBip39,
    }
}
fn bridge_encoding(value: Encoding) -> ShareEncoding {
    match value {
        Encoding::Auto => ShareEncoding::Auto,
        Encoding::Base64url => ShareEncoding::Base64url,
        Encoding::Base58check => ShareEncoding::Base58check,
        Encoding::MnemoWords => ShareEncoding::MnemoWords,
        Encoding::MnemoBip39 => ShareEncoding::MnemoBip39,
        _ => ShareEncoding::Auto,
    }
}
fn map_error(error: CoreError) -> BridgeError {
    match error {
        CoreError::InvalidKAndN { .. } => BridgeError::InvalidParameters,
        CoreError::EmptyShareInput => BridgeError::EmptyInput,
        CoreError::NotEnoughShares { .. } => BridgeError::InsufficientShares,
        CoreError::DuplicateX { .. } => BridgeError::DuplicateShares,
        CoreError::InconsistentMetadata | CoreError::CryptoParamsMismatch => {
            BridgeError::MixedShares
        }
        CoreError::PassphraseRequired => BridgeError::PassphraseRequired,
        CoreError::DecryptFailed => BridgeError::IncorrectPassphrase,
        CoreError::IntegrityCheckFailed => BridgeError::IntegrityFailure,
        CoreError::AutoEncodingForOutput => BridgeError::InvalidEncoding,
        CoreError::InvalidPacket(_)
        | CoreError::Encoding(_)
        | CoreError::CouldNotDetectEncoding
        | CoreError::UnknownEncoding(_) => BridgeError::MalformedShares,
        _ => BridgeError::Internal,
    }
}
fn parse(
    input: String,
    selected: ShareEncoding,
) -> Result<(SensitivePackets, Encoding), BridgeError> {
    let guarded = Zeroizing::new(input);
    let parsed = encoding::parse_share_packets_wrapped_mnemonics(&guarded, core_encoding(selected))
        .map_err(map_error)?;
    Ok((SensitivePackets(parsed.packets), parsed.encoding))
}
fn set_id(packet: &SharePacket) -> String {
    packet.set_id.0.iter().map(|b| format!("{b:02x}")).collect()
}
fn consistent(packets: &[SharePacket]) -> bool {
    packets.first().is_some_and(|first| {
        packets.iter().all(|p| {
            p.set_id == first.set_id
                && p.k == first.k
                && p.n == first.n
                && p.crypto_params == first.crypto_params
        })
    })
}

#[uniffi::export]
pub fn split_secret(
    secret: Vec<u8>,
    threshold: u8,
    share_count: u8,
    selected: ShareEncoding,
    passphrase: Option<String>,
) -> Result<Vec<EncodedShare>, BridgeError> {
    if matches!(selected, ShareEncoding::Auto) {
        return Err(BridgeError::InvalidEncoding);
    }
    let secret = Zeroizing::new(secret);
    let passphrase = passphrase.map(Zeroizing::new);
    let packets = SensitivePackets(
        safeparts_core::split_secret(
            &secret,
            threshold,
            share_count,
            passphrase.as_deref().map(|value| value.as_bytes()),
        )
        .map_err(map_error)?,
    );
    packets
        .iter()
        .map(|p| {
            Ok(EncodedShare {
                text: encoding::encode_packet(p, core_encoding(selected)).map_err(map_error)?,
                index: p.x,
                share_count: p.n,
                set_id: set_id(p),
            })
        })
        .collect()
}

#[uniffi::export]
pub fn inspect_share_input(
    input: String,
    selected: ShareEncoding,
) -> Result<Inspection, BridgeError> {
    let (packets, detected) = parse(input, selected)?;
    let first = packets.first().ok_or(BridgeError::EmptyInput)?;
    let consistent = consistent(&packets);
    let unique = packets.iter().map(|p| p.x).collect::<HashSet<_>>().len() == packets.len();
    let mut indexes: Vec<_> = packets.iter().map(|p| p.x).collect();
    indexes.sort_unstable();
    Ok(Inspection {
        detected_encoding: bridge_encoding(detected),
        threshold: first.k,
        share_count: first.n,
        provided_count: packets.len() as u32,
        encrypted: first.crypto_params.is_some(),
        indexes,
        consistent,
        ready: consistent && unique && packets.len() >= first.k as usize,
    })
}

#[uniffi::export]
pub fn combine_share_input(
    input: String,
    selected: ShareEncoding,
    passphrase: Option<String>,
) -> Result<Recovery, BridgeError> {
    let (packets, detected) = parse(input, selected)?;
    let first = packets.first().ok_or(BridgeError::EmptyInput)?;
    let metadata = (
        first.k,
        first.n,
        first.crypto_params.is_some(),
        set_id(first),
    );
    let mut indexes: Vec<_> = packets.iter().map(|p| p.x).collect();
    indexes.sort_unstable();
    let passphrase = passphrase.map(Zeroizing::new);
    let bytes = safeparts_core::combine_shares(
        &packets,
        passphrase.as_deref().map(|value| value.as_bytes()),
    )
    .map_err(map_error)?;
    Ok(Recovery {
        bytes,
        detected_encoding: bridge_encoding(detected),
        threshold: metadata.0,
        share_count: metadata.1,
        encrypted: metadata.2,
        indexes,
        set_id: metadata.3,
    })
}
uniffi::setup_scaffolding!();

#[cfg(test)]
mod tests {
    use super::*;
    fn joined(e: ShareEncoding, pass: Option<&str>) -> String {
        split_secret(vec![0, 255, 1, 2], 2, 3, e, pass.map(str::to_owned))
            .unwrap()
            .into_iter()
            .take(2)
            .map(|s| s.text)
            .collect::<Vec<_>>()
            .join("\n\n")
    }
    #[test]
    fn every_encoding_binary_round_trip_and_auto() {
        for e in [
            ShareEncoding::Base64url,
            ShareEncoding::Base58check,
            ShareEncoding::MnemoWords,
            ShareEncoding::MnemoBip39,
        ] {
            let input = joined(e, None);
            let result = combine_share_input(input, ShareEncoding::Auto, None).unwrap();
            assert_eq!(result.bytes, vec![0, 255, 1, 2]);
        }
    }
    #[test]
    fn passphrase_cases() {
        let input = joined(ShareEncoding::Base64url, Some("correct"));
        assert!(matches!(
            combine_share_input(input.clone(), ShareEncoding::Auto, None),
            Err(BridgeError::PassphraseRequired)
        ));
        assert!(matches!(
            combine_share_input(input.clone(), ShareEncoding::Auto, Some("wrong".into())),
            Err(BridgeError::IncorrectPassphrase)
        ));
        assert_eq!(
            combine_share_input(input, ShareEncoding::Auto, Some("correct".into()))
                .unwrap()
                .bytes,
            vec![0, 255, 1, 2]
        );
    }
    #[test]
    fn packet_payload_guard_zeroizes_owned_payloads() {
        let mut packets =
            SensitivePackets(safeparts_core::split_secret(&[1, 2, 3], 1, 1, None).unwrap());
        assert!(
            packets
                .iter()
                .any(|packet| packet.payload.iter().any(|byte| *byte != 0))
        );
        packets.zeroize_payloads();
        assert!(
            packets
                .iter()
                .all(|packet| packet.payload.iter().all(|byte| *byte == 0))
        );
    }

    #[test]
    fn inspect_and_negative_inputs_are_sanitized() {
        let shares = split_secret(vec![1], 2, 3, ShareEncoding::Base64url, None).unwrap();
        let one = shares[0].text.clone();
        let one_inspection = inspect_share_input(one.clone(), ShareEncoding::Auto).unwrap();
        assert_eq!(one_inspection.threshold, 2);
        assert_eq!(one_inspection.share_count, 3);
        assert_eq!(one_inspection.provided_count, 1);
        assert!(one_inspection.consistent);
        assert!(!one_inspection.ready);
        assert!(matches!(
            inspect_share_input(String::new(), ShareEncoding::Auto),
            Err(BridgeError::EmptyInput)
        ));
        assert!(matches!(
            combine_share_input(one.clone(), ShareEncoding::Auto, None),
            Err(BridgeError::InsufficientShares)
        ));
        let duplicate = format!("{one}\n{one}");
        assert!(matches!(
            combine_share_input(duplicate, ShareEncoding::Auto, None),
            Err(BridgeError::DuplicateShares)
        ));
        let other = split_secret(vec![2], 2, 3, ShareEncoding::Base64url, None).unwrap();
        let mixed = format!("{one}\n{}", other[0].text);
        let inspection = inspect_share_input(mixed.clone(), ShareEncoding::Auto).unwrap();
        assert!(!inspection.consistent && !inspection.ready);
        assert!(matches!(
            combine_share_input(mixed, ShareEncoding::Auto, None),
            Err(BridgeError::MixedShares)
        ));
        let sensitive = "SECRET-SHARE-TEXT";
        let err = inspect_share_input(sensitive.into(), ShareEncoding::Auto)
            .unwrap_err()
            .to_string();
        assert!(!err.contains(sensitive));
    }
}
