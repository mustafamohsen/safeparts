use std::fs;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};

use anyhow::{Context, Result, anyhow, bail};
use clap::{Parser, Subcommand};
use safeparts_core::encoding::{self, Encoding};
use zeroize::Zeroizing;

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
        #[arg(short = 'e', long, value_enum, default_value_t = CliEncoding::Base64url)]
        encoding: CliEncoding,

        /// Encrypt secret before splitting (prefer --passphrase-file to avoid shell history).
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

        /// Decrypt recovered secret (prefer --passphrase-file to avoid shell history).
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
    #[value(name = "base64url", alias = "base64")]
    Base64url,

    #[value(name = "base58check", alias = "base58")]
    Base58check,

    #[value(name = "mnemo-words")]
    MnemoWords,

    #[value(name = "mnemo-bip39")]
    MnemoBip39,
}

impl From<CliEncoding> for Encoding {
    fn from(value: CliEncoding) -> Self {
        match value {
            CliEncoding::Base64url => Encoding::Base64url,
            CliEncoding::Base58check => Encoding::Base58check,
            CliEncoding::MnemoWords => Encoding::MnemoWords,
            CliEncoding::MnemoBip39 => Encoding::MnemoBip39,
        }
    }
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
            let input = Zeroizing::new(read_input(r#in)?);
            let passphrase = read_passphrase(passphrase, passphrase_file)?;
            let passphrase_bytes = passphrase.as_ref().map(|p| p.as_slice());

            let packets = safeparts_core::split_secret(input.as_slice(), k, n, passphrase_bytes)
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
            let passphrase_bytes = passphrase.as_ref().map(|p| p.as_slice());

            let packets = parse_share_packets(&input_str, encoding)?;

            let secret = safeparts_core::combine_shares(&packets, passphrase_bytes)
                .map_err(|e| anyhow!(e))
                .context("combine failed")?;

            write_output_bytes(out, &secret)?;
        }

        Commands::Tui => launch_tui()?,
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

fn encode_packet_cli(
    packet: &safeparts_core::packet::SharePacket,
    encoding: CliEncoding,
) -> Result<String> {
    encoding::encode_packet(packet, encoding.into()).map_err(|e| anyhow!(e))
}

fn parse_share_packets(
    input: &str,
    encoding: Option<CliEncoding>,
) -> Result<Vec<safeparts_core::packet::SharePacket>> {
    let encoding = encoding.map_or(Encoding::Auto, Into::into);
    let parsed = encoding::parse_share_packets(input, encoding).map_err(|e| anyhow!(e))?;
    Ok(parsed.packets)
}

fn is_dash_path(path: &Path) -> bool {
    path == Path::new("-")
}

fn read_input(path: Option<PathBuf>) -> Result<Vec<u8>> {
    match path.as_deref() {
        Some(path) if !is_dash_path(path) => {
            fs::read(path).with_context(|| format!("read input {}", path.display()))
        }
        _ => {
            let mut buf = Vec::new();
            io::stdin().read_to_end(&mut buf).context("read stdin")?;
            Ok(buf)
        }
    }
}

fn write_output_text(path: Option<PathBuf>, text: &str) -> Result<()> {
    match path.as_deref() {
        Some(path) if !is_dash_path(path) => {
            fs::write(path, text).with_context(|| format!("write output {}", path.display()))
        }
        _ => {
            io::stdout()
                .write_all(text.as_bytes())
                .context("write stdout")?;
            Ok(())
        }
    }
}

fn write_output_bytes(path: Option<PathBuf>, bytes: &[u8]) -> Result<()> {
    match path.as_deref() {
        Some(path) if !is_dash_path(path) => {
            fs::write(path, bytes).with_context(|| format!("write output {}", path.display()))
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
) -> Result<Option<Zeroizing<Vec<u8>>>> {
    match (passphrase, passphrase_file) {
        (Some(p), None) => Ok(Some(Zeroizing::new(p.into_bytes()))),
        (None, Some(path)) => {
            let mut bytes = Zeroizing::new(
                fs::read(&path).with_context(|| format!("read passphrase {}", path.display()))?,
            );
            while matches!(bytes.last(), Some(b'\n' | b'\r')) {
                bytes.pop();
            }
            Ok(Some(bytes))
        }
        (None, None) => Ok(None),
        (Some(_), Some(_)) => Err(anyhow!("use either --passphrase or --passphrase-file")),
    }
}
