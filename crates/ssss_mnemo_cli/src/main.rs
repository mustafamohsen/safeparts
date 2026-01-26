use std::fs;
use std::io::{self, Read, Write};
use std::path::PathBuf;

use anyhow::{Context, Result, anyhow};
use clap::{Parser, Subcommand};
use ssss_mnemo_core::ascii;

#[derive(Debug, Parser)]
#[command(name = "ssss-mnemo")]
#[command(about = "Split/combine secrets into SSSS shares", long_about = None)]
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
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Split {
            k,
            n,
            encoding,
            r#in,
            in_stdin,
            out,
            out_stdout,
        } => {
            let input = read_input(r#in, in_stdin)?;
            let packets = ssss_mnemo_core::tag_and_split(&input, k, n)
                .with_context(|| format!("split failed (k={k}, n={n})"))?;

            let ascii_encoding = match encoding {
                CliEncoding::Base58check => ascii::Encoding::Base58check,
                CliEncoding::Base64url => ascii::Encoding::Base64url,
            };

            let encoded: Vec<String> = packets
                .iter()
                .map(|p| ascii::encode_packet(p, ascii_encoding))
                .collect();

            let output = encoded.join("\n") + "\n";
            write_output_text(out, out_stdout, &output)?;
        }

        Commands::Combine {
            from,
            r#in,
            in_stdin,
            out,
            out_stdout,
        } => {
            let input = read_input(r#in, in_stdin)?;
            let input_str = String::from_utf8(input).context("shares input must be UTF-8")?;

            let tokens: Vec<&str> = input_str.split_whitespace().collect();
            if tokens.is_empty() {
                return Err(anyhow!("no shares provided"));
            }

            let ascii_encoding = match from {
                CliEncoding::Base58check => ascii::Encoding::Base58check,
                CliEncoding::Base64url => ascii::Encoding::Base64url,
            };

            let packets = tokens
                .into_iter()
                .map(|t| ascii::decode_packet(t, ascii_encoding).map_err(|e| anyhow!(e)))
                .collect::<Result<Vec<_>>>()?;

            let secret = ssss_mnemo_core::combine_and_verify(&packets)
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
