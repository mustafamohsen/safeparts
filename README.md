<p align="center">
  <img src="web/src/assets/logo.svg" width="120" alt="Safeparts logo" />
</p>

# Safeparts

Safeparts helps you **split a sensitive secret into multiple “recovery parts”** so no single person, device, or location holds the whole thing.

You choose a threshold (`k` of `n`):

- With fewer than `k` parts, an attacker learns nothing useful about the secret.
- With any `k` parts, you can reconstruct the original secret.

## Example use cases

- Back up a password manager recovery key across family/friends (“social recovery”).
- Split an infrastructure API key so ops + security must collaborate to use it.
- Store an encryption key in multiple physical locations (home, office, safe deposit box).
- Reduce single-point-of-failure risk for a small business “break glass” secret.

## Significant features

- **Threshold secret sharing** (Shamir-style over GF(256), byte-wise).
- **Integrity-checked reconstruction** via a BLAKE3 tag (detects wrong/corrupted shares).
- **Multiple human-/machine-friendly encodings** for the same share packet:
  - `base64` (URL-safe, no padding)
  - `mnemo-words` (BIP-39 word list + CRC16 for error detection)
- **Optional passphrase protection** (encrypt-before-split): Argon2id → ChaCha20-Poly1305.
- **Scriptable CLI** (`safeparts`) and a **Rust core library** (`safeparts_core`).
- **Optional WASM bindings** (`safeparts_wasm`) for embedding in web contexts.

## Security notes (important)

- Share packets include metadata; treat shares as sensitive and avoid logging or posting them.
- Mnemonic formats use the BIP-39 English word list for readability and error detection.
  They are **not wallet seeds** and should not be imported into a wallet.
- **Browser mode**: when using the optional web UI (WASM), splitting/combining runs entirely in your browser.
  Your secret and shares are not sent to a server by default (unless you choose to copy, paste, upload, or deploy a modified UI).

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

The CLI binary is `safeparts` (crate: `crates/safeparts`).

Defaults:

- `split` defaults to `-e base64` (URL-safe, no padding)
- `combine` auto-detects encoding unless `-e/--encoding` is provided

### Terminal UI (TUI)

An interactive terminal UI is available via the `safeparts-tui` binary (crate: `crates/safeparts_tui`).

- Run directly: `cargo run -q -p safeparts_tui`
- Or via the CLI launcher: `cargo run -q -p safeparts -- tui`

Key shortcuts:

- `Enter`: run split/combine
- `Ctrl+L`: load secret/share file(s)
- `Ctrl+S`: save (one file per share, or recovered secret)
- `Ctrl+C`: copy (UTF-8 if possible, else base64)
- `Ctrl+Q`: quit
- `?`: help overlay

### Split a secret

Read secret from stdin and output shares to stdout:

- `echo -n "my secret" | cargo run -q -p safeparts -- split -k 2 -n 3 -e base64`

Mnemonic output (more human-friendly):

- `echo -n "my secret" | cargo run -q -p safeparts -- split -k 2 -n 3 -e mnemo-words`


### Combine shares

Provide at least `k` shares on stdin:

- `printf "%s\n%s\n" "<share1>" "<share2>" | cargo run -q -p safeparts -- combine`

For `mnemo-words`, each share is typically a full line (because the share contains spaces).

### Optional passphrase encryption

Split with a passphrase:

- `echo -n "my secret" | cargo run -q -p safeparts -- split -k 2 -n 3 -e base64 -p "correct horse"`

Combine with a passphrase:

- `printf "%s\n%s\n" "<share1>" "<share2>" | cargo run -q -p safeparts -- combine -p "correct horse"`

You can also use a file:

- `--passphrase-file path/to/passphrase.txt` (or `-P path/to/passphrase.txt`)

Note: `--passphrase <text>` may leak into shell history. Prefer `--passphrase-file` in many environments.

## Web interface (optional)

A minimal web UI exists under `web/` and uses `crates/safeparts_wasm` (WASM) to run the split/combine logic locally.

Run locally:

- `cd web`
- `bun install`
- `bun run build:wasm`
- `bun run dev`

Generated WASM output goes to `web/src/wasm_pkg/` (gitignored).

## Project layout

- `crates/safeparts_core/`: core algorithms, packets, encodings, encryption
- `crates/safeparts/`: CLI wrapper
- `crates/safeparts_wasm/`: wasm-bindgen exports
- `web/`: minimal Vite + React scaffold (optional)

## Contributing

Contributions are welcome — bug reports, feature requests, docs fixes, and PRs.

- Please avoid including real secrets (or real-looking shares) in issues, logs, or screenshots.
- For code changes, try to keep PRs focused and run:
  - `cargo fmt --all`
  - `cargo clippy --all-targets --all-features -- -D warnings`
  - `cargo test --all-features`

If you’re planning a larger change (packet format changes, new encodings, crypto changes), open an issue first so we can align on approach.

## License

MIT. See `LICENSE`.
