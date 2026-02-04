use std::ffi::OsStr;
use std::fs;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};

use anyhow::{Context, Result, anyhow, bail};
use clap::{Parser, Subcommand};
use safeparts_core::packet::SharePacket;
use safeparts_core::{ascii, mnemo_bip39, mnemo_words};

#[derive(Debug, Parser)]
#[command(name = "safeparts")]
#[command(about = "Split/combine secrets into threshold shares", long_about = None)]
#[command(disable_help_subcommand = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    /// Split a secret into N shares.
    Split {
        /// Threshold shares required to recover.
        #[arg(short = 'k', long = "threshold")]
        k: u8,

        /// Total shares to create.
        #[arg(short = 'n', long = "shares")]
        n: u8,

        /// Output encoding for shares.
        #[arg(short = 'e', long, value_enum, default_value_t = CliEncoding::Base64)]
        encoding: CliEncoding,

        /// Encrypt secret before splitting.
        #[arg(short = 'p', long, conflicts_with = "passphrase_file")]
        passphrase: Option<String>,

        /// Read passphrase from file.
        #[arg(short = 'P', long, value_name = "FILE", conflicts_with = "passphrase")]
        passphrase_file: Option<PathBuf>,

        /// Read secret from file (use '-' for stdin).
        #[arg(short = 'i', long = "in", value_name = "FILE")]
        r#in: Option<PathBuf>,

        /// Write shares to file (use '-' for stdout).
        #[arg(short = 'o', long, value_name = "FILE")]
        out: Option<PathBuf>,
    },

    /// Combine shares to recover the original secret.
    Combine {
        /// Share encoding (if omitted, auto-detect).
        #[arg(short = 'e', long, value_enum, alias = "from")]
        encoding: Option<CliEncoding>,

        /// Decrypt recovered secret.
        #[arg(short = 'p', long, conflicts_with = "passphrase_file")]
        passphrase: Option<String>,

        /// Read passphrase from file.
        #[arg(short = 'P', long, value_name = "FILE", conflicts_with = "passphrase")]
        passphrase_file: Option<PathBuf>,

        /// Read shares from file (use '-' for stdin).
        #[arg(short = 'i', long = "in", value_name = "FILE")]
        r#in: Option<PathBuf>,

        /// Write recovered secret to file (use '-' for stdout).
        #[arg(short = 'o', long, value_name = "FILE")]
        out: Option<PathBuf>,
    },

    /// Launch the interactive terminal UI.
    Tui,
}

#[derive(Clone, Copy, Debug, clap::ValueEnum)]
enum CliEncoding {
    #[value(name = "base64", alias = "base64url")]
    Base64,

    #[value(name = "base58", alias = "base58check")]
    Base58,

    #[value(name = "mnemo-words")]
    MnemoWords,

    #[value(name = "mnemo-bip39")]
    MnemoBip39,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Split {
            k,
            n,
            encoding,
            passphrase,
            passphrase_file,
            r#in,
            out,
        } => {
            let input = read_input(r#in)?;
            let passphrase = read_passphrase(passphrase, passphrase_file)?;

            let packets = safeparts_core::split_secret(&input, k, n, passphrase.as_deref())
                .with_context(|| format!("split failed (k={k}, n={n})"))?;

            let encoded: Vec<String> = packets
                .iter()
                .map(|p| encode_packet_cli(p, encoding))
                .collect::<Result<Vec<_>>>()?;

            let output = encoded.join("\n") + "\n";
            write_output_text(out, &output)?;
        }

        Commands::Combine {
            encoding,
            passphrase,
            passphrase_file,
            r#in,
            out,
        } => {
            let input = read_input(r#in)?;
            let input_str = String::from_utf8(input).context("shares input must be UTF-8")?;
            let passphrase = read_passphrase(passphrase, passphrase_file)?;

            let packets = parse_share_packets(&input_str, encoding)?;

            let secret = safeparts_core::combine_shares(&packets, passphrase.as_deref())
                .map_err(|e| anyhow!(e))
                .context("combine failed")?;

            write_output_bytes(out, &secret)?;
        }

        Commands::Tui => {
            launch_tui()?;
        }
    }

    Ok(())
}

fn launch_tui() -> Result<()> {
    let exe_suffix = std::env::consts::EXE_SUFFIX;
    let current = std::env::current_exe().context("resolve current executable")?;

    let candidate = current.with_file_name(format!("safeparts-tui{exe_suffix}"));

    let mut cmd = if candidate.exists() {
        std::process::Command::new(candidate)
    } else {
        std::process::Command::new(format!("safeparts-tui{exe_suffix}"))
    };

    let status = cmd.status().context("launch safeparts-tui")?;
    if !status.success() {
        bail!("safeparts-tui exited with status {status}");
    }

    Ok(())
}

fn encode_packet_cli(packet: &SharePacket, encoding: CliEncoding) -> Result<String> {
    match encoding {
        CliEncoding::Base58 => {
            ascii::encode_packet(packet, ascii::Encoding::Base58check).map_err(|e| anyhow!(e))
        }
        CliEncoding::Base64 => {
            ascii::encode_packet(packet, ascii::Encoding::Base64url).map_err(|e| anyhow!(e))
        }
        CliEncoding::MnemoWords => mnemo_words::encode_packet(packet).map_err(|e| anyhow!(e)),
        CliEncoding::MnemoBip39 => mnemo_bip39::encode_packet(packet).map_err(|e| anyhow!(e)),
    }
}

fn parse_share_packets(input: &str, encoding: Option<CliEncoding>) -> Result<Vec<SharePacket>> {
    let nonempty_lines: Vec<&str> = input
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();

    if nonempty_lines.is_empty() {
        bail!("no shares provided");
    }

    match encoding {
        Some(enc) => decode_share_packets_known(&nonempty_lines, input, enc),
        None => decode_share_packets_auto(&nonempty_lines, input),
    }
}

fn decode_share_packets_known(
    nonempty_lines: &[&str],
    full_input: &str,
    encoding: CliEncoding,
) -> Result<Vec<SharePacket>> {
    match encoding {
        CliEncoding::MnemoWords => nonempty_lines
            .iter()
            .map(|line| mnemo_words::decode_packet(line).map_err(|e| anyhow!(e)))
            .collect::<Result<Vec<_>>>(),
        CliEncoding::MnemoBip39 => nonempty_lines
            .iter()
            .map(|line| mnemo_bip39::decode_packet(line).map_err(|e| anyhow!(e)))
            .collect::<Result<Vec<_>>>(),
        CliEncoding::Base64 => {
            let tokens: Vec<&str> = full_input.split_whitespace().collect();
            tokens
                .into_iter()
                .map(|t| {
                    ascii::decode_packet(t, ascii::Encoding::Base64url).map_err(|e| anyhow!(e))
                })
                .collect::<Result<Vec<_>>>()
        }
        CliEncoding::Base58 => {
            let tokens: Vec<&str> = full_input.split_whitespace().collect();
            tokens
                .into_iter()
                .map(|t| {
                    ascii::decode_packet(t, ascii::Encoding::Base58check).map_err(|e| anyhow!(e))
                })
                .collect::<Result<Vec<_>>>()
        }
    }
}

fn decode_share_packets_auto(
    nonempty_lines: &[&str],
    full_input: &str,
) -> Result<Vec<SharePacket>> {
    let looks_mnemonic = nonempty_lines
        .iter()
        .any(|l| l.contains('/') || l.split_whitespace().count() > 1);

    if looks_mnemonic {
        let looks_bip39 = nonempty_lines.iter().any(|l| l.contains('/'));
        return if looks_bip39 {
            decode_share_packets_known(nonempty_lines, full_input, CliEncoding::MnemoBip39)
        } else {
            decode_share_packets_known(nonempty_lines, full_input, CliEncoding::MnemoWords)
        };
    }

    let base64_attempt =
        decode_share_packets_known(nonempty_lines, full_input, CliEncoding::Base64);
    if base64_attempt.is_ok() {
        return base64_attempt;
    }

    let base58_attempt =
        decode_share_packets_known(nonempty_lines, full_input, CliEncoding::Base58);
    if base58_attempt.is_ok() {
        return base58_attempt;
    }

    bail!("could not detect share encoding; try --encoding");
}

fn is_dash_path(p: &Path) -> bool {
    p.as_os_str() == OsStr::new("-")
}

fn read_input(path: Option<PathBuf>) -> Result<Vec<u8>> {
    match path {
        Some(p) if !is_dash_path(p.as_path()) => {
            fs::read(&p).with_context(|| format!("read input {}", p.display()))
        }
        _ => {
            let mut buf = Vec::new();
            io::stdin().read_to_end(&mut buf).context("read stdin")?;
            Ok(buf)
        }
    }
}

fn write_output_text(path: Option<PathBuf>, s: &str) -> Result<()> {
    match path {
        Some(p) if !is_dash_path(p.as_path()) => {
            fs::write(&p, s).with_context(|| format!("write output {}", p.display()))
        }
        _ => {
            io::stdout()
                .write_all(s.as_bytes())
                .context("write stdout")?;
            Ok(())
        }
    }
}

fn write_output_bytes(path: Option<PathBuf>, bytes: &[u8]) -> Result<()> {
    match path {
        Some(p) if !is_dash_path(p.as_path()) => {
            fs::write(&p, bytes).with_context(|| format!("write output {}", p.display()))
        }
        _ => {
            io::stdout().write_all(bytes).context("write stdout")?;
            Ok(())
        }
    }
}

fn read_passphrase(
    passphrase: Option<String>,
    passphrase_file: Option<PathBuf>,
) -> Result<Option<Vec<u8>>> {
    match (passphrase, passphrase_file) {
        (Some(p), None) => Ok(Some(p.into_bytes())),
        (None, Some(path)) => {
            let mut bytes =
                fs::read(&path).with_context(|| format!("read passphrase {}", path.display()))?;
            while matches!(bytes.last(), Some(b'\n' | b'\r')) {
                bytes.pop();
            }
            Ok(Some(bytes))
        }
        (None, None) => Ok(None),
        (Some(_), Some(_)) => Err(anyhow!("use either --passphrase or --passphrase-file")),
    }
}
