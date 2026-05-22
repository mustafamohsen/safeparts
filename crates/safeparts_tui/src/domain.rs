use anyhow::{Context, Result, anyhow};
use safeparts_core::encoding as core_encoding;
use safeparts_core::packet::SharePacket;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Encoding {
    Auto,
    Base64url,
    Base58check,
    MnemoWords,
    MnemoBip39,
}

impl Encoding {
    pub const ALL: &'static [Encoding] = &[
        Encoding::Auto,
        Encoding::Base64url,
        Encoding::Base58check,
        Encoding::MnemoWords,
        Encoding::MnemoBip39,
    ];

    pub const SPLIT: &'static [Encoding] = &[
        Encoding::Base64url,
        Encoding::Base58check,
        Encoding::MnemoWords,
        Encoding::MnemoBip39,
    ];

    pub fn label(self) -> &'static str {
        self.core().label()
    }

    fn core(self) -> core_encoding::Encoding {
        match self {
            Encoding::Auto => core_encoding::Encoding::Auto,
            Encoding::Base64url => core_encoding::Encoding::Base64url,
            Encoding::Base58check => core_encoding::Encoding::Base58check,
            Encoding::MnemoWords => core_encoding::Encoding::MnemoWords,
            Encoding::MnemoBip39 => core_encoding::Encoding::MnemoBip39,
        }
    }

    fn from_core(value: core_encoding::Encoding) -> Self {
        match value {
            core_encoding::Encoding::Auto => Encoding::Auto,
            core_encoding::Encoding::Base64url => Encoding::Base64url,
            core_encoding::Encoding::Base58check => Encoding::Base58check,
            core_encoding::Encoding::MnemoWords => Encoding::MnemoWords,
            core_encoding::Encoding::MnemoBip39 => Encoding::MnemoBip39,
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
        .map(|packet| core_encoding::encode_packet(packet, encoding.core()).map_err(|e| anyhow!(e)))
        .collect::<Result<Vec<_>>>()?;

    Ok((packets, shares))
}

pub fn combine_shares(
    input: &str,
    encoding: Encoding,
    passphrase: Option<&[u8]>,
) -> Result<(Vec<SharePacket>, Vec<u8>, Encoding)> {
    let parsed =
        core_encoding::parse_share_packets(input, encoding.core()).map_err(|e| anyhow!(e))?;
    let secret = safeparts_core::combine_shares(&parsed.packets, passphrase)
        .map_err(|e| anyhow!(e))
        .context("combine failed")?;

    Ok((parsed.packets, secret, Encoding::from_core(parsed.encoding)))
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
    fn labels_use_core_canonical_names() {
        assert_eq!(Encoding::Base64url.label(), "base64url");
        assert_eq!(Encoding::Base58check.label(), "base58check");
    }
}
