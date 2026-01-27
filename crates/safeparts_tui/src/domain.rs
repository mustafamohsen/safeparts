use anyhow::{Context, Result, anyhow, bail};
use safeparts_core::packet::SharePacket;
use safeparts_core::{ascii, mnemo_bip39, mnemo_words};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Encoding {
    Auto,
    Base64,
    Base58,
    MnemoWords,
    MnemoBip39,
}

impl Encoding {
    pub const ALL: &'static [Encoding] = &[
        Encoding::Auto,
        Encoding::Base64,
        Encoding::Base58,
        Encoding::MnemoWords,
        Encoding::MnemoBip39,
    ];

    pub const SPLIT: &'static [Encoding] = &[
        Encoding::Base64,
        Encoding::Base58,
        Encoding::MnemoWords,
        Encoding::MnemoBip39,
    ];

    pub fn label(self) -> &'static str {
        match self {
            Encoding::Auto => "auto",
            Encoding::Base64 => "base64",
            Encoding::Base58 => "base58",
            Encoding::MnemoWords => "mnemo-words",
            Encoding::MnemoBip39 => "mnemo-bip39",
        }
    }
}

pub fn split_secret(
    secret: &[u8],
    k: u8,
    n: u8,
    encoding: Encoding,
    passphrase: Option<&[u8]>,
) -> Result<(Vec<SharePacket>, Vec<String>)> {
    let packets = safeparts_core::split_secret(secret, k, n, passphrase)
        .map_err(|e| anyhow!(e))
        .with_context(|| format!("split failed (k={k}, n={n})"))?;

    let shares = packets
        .iter()
        .map(|p| encode_packet(p, encoding))
        .collect::<Result<Vec<_>>>()?;

    Ok((packets, shares))
}

pub fn combine_shares(
    input: &str,
    encoding: Encoding,
    passphrase: Option<&[u8]>,
) -> Result<(Vec<SharePacket>, Vec<u8>, Encoding)> {
    let packets = parse_share_packets(input, encoding)?;
    let used_encoding = if encoding == Encoding::Auto {
        detect_encoding(input)?.unwrap_or(Encoding::Auto)
    } else {
        encoding
    };

    let secret = safeparts_core::combine_shares(&packets, passphrase)
        .map_err(|e| anyhow!(e))
        .context("combine failed")?;

    Ok((packets, secret, used_encoding))
}

pub fn encode_packet(packet: &SharePacket, encoding: Encoding) -> Result<String> {
    match encoding {
        Encoding::Auto => bail!("auto encoding is not valid for output"),
        Encoding::Base64 => {
            ascii::encode_packet(packet, ascii::Encoding::Base64url).map_err(|e| anyhow!(e))
        }
        Encoding::Base58 => {
            ascii::encode_packet(packet, ascii::Encoding::Base58check).map_err(|e| anyhow!(e))
        }
        Encoding::MnemoWords => mnemo_words::encode_packet(packet).map_err(|e| anyhow!(e)),
        Encoding::MnemoBip39 => mnemo_bip39::encode_packet(packet).map_err(|e| anyhow!(e)),
    }
}

pub fn parse_share_packets(input: &str, encoding: Encoding) -> Result<Vec<SharePacket>> {
    let input = input.trim();
    if input.is_empty() {
        bail!("no shares provided");
    }

    let enc = if encoding == Encoding::Auto {
        detect_encoding(input)?.unwrap_or(Encoding::Auto)
    } else {
        encoding
    };

    if enc == Encoding::Auto {
        bail!("could not detect share encoding; select encoding");
    }

    decode_share_packets_known(input, enc)
}

pub fn detect_encoding(input: &str) -> Result<Option<Encoding>> {
    let blocks = split_blocks(input);

    let looks_bip39 = blocks.iter().any(|b| b.contains('/'));
    if looks_bip39 {
        return Ok(Some(Encoding::MnemoBip39));
    }

    let looks_words = blocks.iter().any(|b| b.split_whitespace().count() > 1);
    if looks_words {
        return Ok(Some(Encoding::MnemoWords));
    }

    if decode_share_packets_known(input, Encoding::Base64).is_ok() {
        return Ok(Some(Encoding::Base64));
    }

    if decode_share_packets_known(input, Encoding::Base58).is_ok() {
        return Ok(Some(Encoding::Base58));
    }

    Ok(None)
}

fn decode_share_packets_known(input: &str, encoding: Encoding) -> Result<Vec<SharePacket>> {
    match encoding {
        Encoding::Auto => bail!("auto"),
        Encoding::MnemoWords => split_blocks(input)
            .into_iter()
            .map(|b| mnemo_words::decode_packet(&b).map_err(|e| anyhow!(e)))
            .collect::<Result<Vec<_>>>(),
        Encoding::MnemoBip39 => split_blocks(input)
            .into_iter()
            .map(|b| mnemo_bip39::decode_packet(&b).map_err(|e| anyhow!(e)))
            .collect::<Result<Vec<_>>>(),
        Encoding::Base64 => input
            .split_whitespace()
            .map(|t| ascii::decode_packet(t, ascii::Encoding::Base64url).map_err(|e| anyhow!(e)))
            .collect::<Result<Vec<_>>>(),
        Encoding::Base58 => input
            .split_whitespace()
            .map(|t| ascii::decode_packet(t, ascii::Encoding::Base58check).map_err(|e| anyhow!(e)))
            .collect::<Result<Vec<_>>>(),
    }
}

fn split_blocks(input: &str) -> Vec<String> {
    // Blank-line separated blocks; each block is one share.
    // For mnemo-bip39, a share may contain many phrases separated by '/'.
    // For mnemo-words, a share is a single sentence; users may paste with wrapping.
    let normalized = input.replace("\r\n", "\n");

    normalized
        .split("\n\n")
        .map(|b| {
            b.lines()
                .map(str::trim)
                .filter(|l| !l.is_empty())
                .collect::<Vec<_>>()
                .join(" ")
        })
        .map(|b| b.trim().to_string())
        .filter(|b| !b.is_empty())
        .collect()
}

pub fn set_id_hex(packets: &[SharePacket]) -> Option<String> {
    let first = packets.first()?;
    let mut s = String::with_capacity(32);
    for b in first.set_id.0 {
        s.push_str(&format!("{b:02x}"));
    }
    Some(s)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn split_blocks_normalizes_windows_newlines() {
        let input = "one\r\n\r\ntwo\r\n";
        let blocks = split_blocks(input);
        assert_eq!(blocks, vec!["one".to_string(), "two".to_string()]);
    }

    #[test]
    fn detect_encoding_prefers_bip39_when_slashes_present() {
        let input = "word word / word word";
        assert_eq!(detect_encoding(input).unwrap(), Some(Encoding::MnemoBip39));
    }
}
