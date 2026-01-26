# ssss-mnemo

`ssss-mnemo` splits a secret into multiple “shares” so you can store them in different places/with different people. Later, you can recover the original secret using any `k` out of `n` shares (a threshold scheme).

This project provides:

- A Rust library (`crates/ssss_mnemo_core`) for splitting/combining secrets.
- A CLI (`crates/ssss_mnemo_cli`) for scripting and terminal usage.
- Optional WASM bindings (`crates/ssss_mnemo_wasm`) and a minimal web UI (`web/`).

## Why this exists (in plain terms)

If you keep one copy of an important secret (API key, recovery key, encryption key), losing it is catastrophic. If you make many copies, the chance of theft increases.

Threshold secret sharing gives a practical middle ground:

- Fewer than `k` shares reveal nothing useful about the secret.
- Any `k` shares can reconstruct the secret.

## Security model (important)

- This uses Shamir-style secret sharing over GF(256) (byte-wise).
- After splitting, reconstruction verifies integrity using a BLAKE3 tag.
- Optional passphrase protection encrypts the secret before splitting:
  - Argon2id key derivation
  - ChaCha20-Poly1305 authenticated encryption
- Treat shares as sensitive. Even though `<k` shares should not reveal the secret, shares still contain metadata and should not be logged or posted.

### About the mnemonic formats

The mnemonic encodings use the BIP-39 English word list for readability and error detection.

They are **not** wallet seeds and should not be imported into a wallet.

## Install / Build (Rust)

Prereqs:

- Rust stable
- `rustfmt` + `clippy` components

Build:

- `cargo build`

Run tests:

- `cargo test --all-features`

Lint (CI-style):

- `cargo clippy --all-targets --all-features -- -D warnings`

Format:

- `cargo fmt --all`

## CLI usage

The CLI binary is `ssss-mnemo` (crate: `ssss_mnemo_cli`).

### Split a secret

Read secret from stdin and output shares to stdout:

- `echo -n "my secret" | cargo run -q -p ssss_mnemo_cli -- split --k 2 --n 3 --encoding base64url --in-stdin --out-stdout`

Mnemonic output (more human-friendly):

- `echo -n "my secret" | cargo run -q -p ssss_mnemo_cli -- split --k 2 --n 3 --encoding mnemo-words --in-stdin --out-stdout`

BIP-39 chunked mnemonics:

- `echo -n "my secret" | cargo run -q -p ssss_mnemo_cli -- split --k 2 --n 3 --encoding mnemo-bip39 --in-stdin --out-stdout`

### Combine shares

Provide at least `k` shares on stdin:

- `printf "%s\n%s\n" "<share1>" "<share2>" | cargo run -q -p ssss_mnemo_cli -- combine --from base64url --in-stdin --out-stdout`

For `mnemo-words` and `mnemo-bip39`, each share is typically a full line (because the share contains spaces).

### Optional passphrase encryption

Split with a passphrase:

- `echo -n "my secret" | cargo run -q -p ssss_mnemo_cli -- split --k 2 --n 3 --encoding base64url --passphrase "correct horse" --in-stdin --out-stdout`

Combine with a passphrase:

- `printf "%s\n%s\n" "<share1>" "<share2>" | cargo run -q -p ssss_mnemo_cli -- combine --from base64url --passphrase "correct horse" --in-stdin --out-stdout`

You can also use a file:

- `--passphrase-file path/to/passphrase.txt`

Note: `--passphrase <text>` may leak into shell history. Prefer `--passphrase-file` in many environments.

## Encodings

All encodings represent the same underlying share packet.

- `base58check`: Base58Check string (checksum protected)
- `base64url`: URL-safe Base64 without padding
- `mnemo-words`: One line of BIP-39 words with CRC16
- `mnemo-bip39`: One share encoded as one or more valid BIP-39 mnemonics (frames separated by ` / `)

## Web UI (optional)

A minimal React UI exists under `web/`. It calls the WASM bindings.

Prereqs:

- Node.js
- `wasm-pack` installed

Run:

- `cd web`
- `npm install`
- `npm run build:wasm`
- `npm run dev`

Generated WASM output goes to `web/src/wasm_pkg/` (gitignored).

## Project layout

- `crates/ssss_mnemo_core/`: core algorithms, packets, encodings, encryption
- `crates/ssss_mnemo_cli/`: CLI wrapper
- `crates/ssss_mnemo_wasm/`: wasm-bindgen exports
- `web/`: minimal Vite + React UI

## Development and testing

Run a single unit test by name:

- `cargo test <substring>`

Run a single module:

- `cargo test -p ssss_mnemo_core gf256::`

Run a single CLI e2e test:

- `cargo test -p ssss_mnemo_cli --test e2e <substring>`

## License

MIT OR Apache-2.0
