use std::fs;
use std::io::{self, Read, Write};
use std::path::PathBuf;

use anyhow::{Context, Result, anyhow};
use clap::{Parser, Subcommand};
use safeparts_core::{ascii, mnemo_bip39, mnemo_words};

#[derive(Debug, Parser)]
#[command(name = "safeparts")]
#[command(about = "Split/combine secrets into threshold shares", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Split {
        #[arg(long)]
        k: u8,

        #[arg(long)]
        n: u8,

        #[arg(long, value_enum, default_value_t = CliEncoding::Base58check)]
        encoding: CliEncoding,

        #[arg(long)]
        passphrase: Option<String>,

        #[arg(long)]
        passphrase_file: Option<PathBuf>,

        #[arg(long)]
        r#in: Option<PathBuf>,

        #[arg(long, default_value_t = false)]
        in_stdin: bool,

        #[arg(long)]
        out: Option<PathBuf>,

        #[arg(long, default_value_t = false)]
        out_stdout: bool,
    },

    Combine {
        #[arg(long, value_enum, default_value_t = CliEncoding::Base58check)]
        from: CliEncoding,

        #[arg(long)]
        passphrase: Option<String>,

        #[arg(long)]
        passphrase_file: Option<PathBuf>,

        #[arg(long)]
        r#in: Option<PathBuf>,

        #[arg(long, default_value_t = false)]
        in_stdin: bool,

        #[arg(long)]
        out: Option<PathBuf>,

        #[arg(long, default_value_t = false)]
        out_stdout: bool,
    },
}

#[derive(Clone, Copy, Debug, clap::ValueEnum)]
enum CliEncoding {
    Base58check,
    Base64url,
    MnemoWords,
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
            in_stdin,
            out,
            out_stdout,
        } => {
            let input = read_input(r#in, in_stdin)?;
            let passphrase = read_passphrase(passphrase, passphrase_file)?;

            let packets = safeparts_core::split_secret(&input, k, n, passphrase.as_deref())
                .with_context(|| format!("split failed (k={k}, n={n})"))?;

            let encoded: Vec<String> = packets
                .iter()
                .map(|p| match encoding {
                    CliEncoding::Base58check => {
                        ascii::encode_packet(p, ascii::Encoding::Base58check)
                            .map_err(|e| anyhow!(e))
                    }
                    CliEncoding::Base64url => {
                        ascii::encode_packet(p, ascii::Encoding::Base64url).map_err(|e| anyhow!(e))
                    }
                    CliEncoding::MnemoWords => {
                        mnemo_words::encode_packet(p).map_err(|e| anyhow!(e))
                    }
                    CliEncoding::MnemoBip39 => {
                        mnemo_bip39::encode_packet(p).map_err(|e| anyhow!(e))
                    }
                })
                .collect::<Result<Vec<_>>>()?;

            let output = encoded.join("\n") + "\n";
            write_output_text(out, out_stdout, &output)?;
        }

        Commands::Combine {
            from,
            passphrase,
            passphrase_file,
            r#in,
            in_stdin,
            out,
            out_stdout,
        } => {
            let input = read_input(r#in, in_stdin)?;
            let input_str = String::from_utf8(input).context("shares input must be UTF-8")?;
            let passphrase = read_passphrase(passphrase, passphrase_file)?;

            let packets = match from {
                CliEncoding::MnemoWords | CliEncoding::MnemoBip39 => {
                    let lines: Vec<&str> = input_str
                        .lines()
                        .map(str::trim)
                        .filter(|l| !l.is_empty())
                        .collect();
                    if lines.is_empty() {
                        return Err(anyhow!("no shares provided"));
                    }

                    lines
                        .into_iter()
                        .map(|line| match from {
                            CliEncoding::MnemoWords => {
                                mnemo_words::decode_packet(line).map_err(|e| anyhow!(e))
                            }
                            CliEncoding::MnemoBip39 => {
                                mnemo_bip39::decode_packet(line).map_err(|e| anyhow!(e))
                            }
                            CliEncoding::Base58check | CliEncoding::Base64url => {
                                unreachable!("handled in other match arm")
                            }
                        })
                        .collect::<Result<Vec<_>>>()?
                }
                CliEncoding::Base58check | CliEncoding::Base64url => {
                    let tokens: Vec<&str> = input_str.split_whitespace().collect();
                    if tokens.is_empty() {
                        return Err(anyhow!("no shares provided"));
                    }

                    let encoding = match from {
                        CliEncoding::Base58check => ascii::Encoding::Base58check,
                        CliEncoding::Base64url => ascii::Encoding::Base64url,
                        CliEncoding::MnemoWords | CliEncoding::MnemoBip39 => {
                            unreachable!("handled above")
                        }
                    };

                    tokens
                        .into_iter()
                        .map(|t| ascii::decode_packet(t, encoding).map_err(|e| anyhow!(e)))
                        .collect::<Result<Vec<_>>>()?
                }
            };

            let secret = safeparts_core::combine_shares(&packets, passphrase.as_deref())
                .map_err(|e| anyhow!(e))
                .context("combine failed")?;

            write_output_bytes(out, out_stdout, &secret)?;
        }
    }

    Ok(())
}

fn read_input(path: Option<PathBuf>, in_stdin: bool) -> Result<Vec<u8>> {
    match (path, in_stdin) {
        (Some(_p), true) => Err(anyhow!("use either --in or --in-stdin")),
        (Some(p), false) => fs::read(&p).with_context(|| format!("read input {}", p.display())),
        (None, _) => {
            let mut buf = Vec::new();
            io::stdin().read_to_end(&mut buf).context("read stdin")?;
            Ok(buf)
        }
    }
}

fn write_output_text(path: Option<PathBuf>, out_stdout: bool, s: &str) -> Result<()> {
    match (path, out_stdout) {
        (Some(_), true) => Err(anyhow!("use either --out or --out-stdout")),
        (Some(p), false) => {
            fs::write(&p, s).with_context(|| format!("write output {}", p.display()))
        }
        (None, _) => {
            io::stdout()
                .write_all(s.as_bytes())
                .context("write stdout")?;
            Ok(())
        }
    }
}

fn write_output_bytes(path: Option<PathBuf>, out_stdout: bool, bytes: &[u8]) -> Result<()> {
    match (path, out_stdout) {
        (Some(_), true) => Err(anyhow!("use either --out or --out-stdout")),
        (Some(p), false) => {
            fs::write(&p, bytes).with_context(|| format!("write output {}", p.display()))
        }
        (None, _) => {
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
        (Some(_), Some(_)) => Err(anyhow!("use either --passphrase or --passphrase-file")),
        (Some(p), None) => Ok(Some(p.into_bytes())),
        (None, Some(path)) => {
            let bytes =
                fs::read(&path).with_context(|| format!("read passphrase {}", path.display()))?;
            Ok(Some(bytes))
        }
        (None, None) => Ok(None),
    }
}
