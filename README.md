<p align="center">
  <img src="web/src/assets/logo.svg" width="120" alt="Safeparts logo" />
</p>

# Safeparts

Safeparts splits a sensitive secret into recovery shares and reconstructs it later from any k of n shares.

- Web app: https://safeparts.netlify.app
- Help / docs: https://safeparts.netlify.app/help/ (English) and https://safeparts.netlify.app/help/ar/ (Arabic)
- Releases: https://github.com/mustafamohsen/safeparts/releases

## What it does

- Threshold secret sharing (Shamir-style over GF(256), byte-wise)
- Integrity-checked reconstruction (BLAKE3 tag)
- Multiple share encodings for the same packet bytes:
  - base64 (base64url, no padding)
  - base58 (base58check)
  - mnemo-words (word list + CRC16 for typo detection)
  - mnemo-bip39 (BIP-39-valid sentences)
- Optional passphrase protection (encrypt-before-split): Argon2id -> ChaCha20-Poly1305

## Safety model (read this first)

- Shares are as sensitive as the secret. If an attacker obtains k shares, they can reconstruct.
- Do not paste real secrets/shares into chat, tickets, logs, or screenshots. Use synthetic examples.
- Store shares in separate places/roles. Do not keep all shares together.
- Practice recovery once with a fake secret before trusting a real recovery plan.
- Mnemonic shares are not wallet seeds. Do not import them into wallet apps.

## Install

Download a release archive from GitHub Releases. Each release includes:

- safeparts (CLI)
- safeparts-tui (terminal UI)

Platform-specific install steps live in the docs:

- https://safeparts.netlify.app/help/build-and-run/

## CLI quickstart

Split a secret into 3 shares, requiring any 2 to recover:

```bash
echo -n "my secret" | safeparts split -k 2 -n 3 -e base64
```

Combine (provide any k shares on stdin):

```bash
printf "%s\n%s\n" "<share1>" "<share2>" | safeparts combine
```

Passphrases:

- Prefer `--passphrase-file` (`-P`) over `--passphrase` (`-p`) in shells that keep history.

Encodings:

- `split` supports: `base64`, `base58`, `mnemo-words`, `mnemo-bip39`
- `combine` can auto-detect if you omit `--encoding`

## TUI

Run the interactive terminal UI:

```bash
safeparts-tui
```

Or launch it via the CLI:

```bash
safeparts tui
```

## Web UI (local)

The web UI runs split/combine locally in your browser via WASM.
Nothing is uploaded unless you choose to copy/paste or deploy a modified build.

```bash
cd web
bun install
bun run build:wasm
bun run dev
```

Open http://localhost:5173.

Docs site (served under /help/):

```bash
cd web/help
bun install
bun run dev
```

Open http://localhost:4321/help/.

## Development

Rust (matches CI):

```bash
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
```

Web a11y tests (Playwright + axe):

```bash
cd web
bun install
bun run test:a11y:install
bun run test:a11y
```

## Repo layout

- crates/safeparts_core/: core algorithms, packet format, encodings, crypto
- crates/safeparts/: CLI wrapper (binary: safeparts)
- crates/safeparts_tui/: terminal UI (binary: safeparts-tui)
- crates/safeparts_wasm/: wasm-bindgen exports used by the web UI
- web/: Vite + React app
- web/help/: Astro + Starlight docs

## Release builds

- Tag pushes matching `v*` run the GitHub Actions release workflow and publish archives.
- Local packaging helpers live in `scripts/release/README.md`.

## Contributing

Contributions are welcome. Start with an issue. Use it to agree on scope, direction, and acceptance criteria before writing code.

Workflow:

1. Open or pick an issue.
2. Fork the repo.
3. Create a dedicated branch (e.g. `feat/<short-slug>` or `fix/<short-slug>`).
4. Make changes and run checks:
   - `cargo fmt --all`
   - `cargo clippy --all-targets --all-features -- -D warnings`
   - `cargo test --all-features`
   - `cd web && bun run test:a11y` (if you touched the web/docs)
5. Open a PR and link the issue (e.g. “Fixes #123”).

## License

MIT. See LICENSE.
