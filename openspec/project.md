# Project Context

## Purpose
Safeparts is a cross-platform, local-first toolkit for threshold secret sharing (k-of-n) of arbitrary bytes.

Primary deliverables in this repo:
- Rust core library: `crates/safeparts_core/`
- CLI: `crates/safeparts/` (binary: `safeparts`)
- TUI: `crates/safeparts_tui/` (binary: `safeparts-tui`, plus `safeparts tui` launcher)
- WASM bindings: `crates/safeparts_wasm/` (for the Web UI)
- Web UI: `web/` (Vite + React)
- Help site: `web/help/` (Astro Starlight)

Core goals:
- Split secrets into shares such that fewer than `k` shares reveal nothing.
- Reconstruct from >= `k` shares with strong input validation and integrity checks.
- Support multiple reversible encodings suitable for humans (Base64URL, Base58Check, mnemonic word formats).
- Optional passphrase-based encryption (encrypt-before-split) using modern KDF + AEAD.

## Tech Stack
Rust:
- Cargo workspace (edition 2024) with strict linting; `unsafe` is forbidden at the workspace level.
- Crypto / primitives: BLAKE3 (integrity), Argon2id (KDF), ChaCha20-Poly1305 (AEAD), `zeroize` for secret material.
- CLI parsing: `clap` (derive).
- CLI e2e testing: `assert_cmd` + `predicates`.

Web:
- Vite + React + TypeScript.
- TailwindCSS.
- `motion` for animations.
- WASM toolchain: `wasm-pack` / `wasm-bindgen`.
- JS package manager: Bun is used for the docs workflow (`web/help/`); the repo also includes an npm lockfile for `web/`.

Docs:
- Astro + Starlight (`web/help/`).

CI / Hosting:
- GitHub Actions runs `cargo fmt`, `cargo clippy -- -D warnings`, and `cargo test --all-features`.
- Netlify deploys the static output from `web/dist/` (triggered via a build hook on pushes to `main`).

## Project Conventions

### Code Style
Rust:
- Format: `cargo fmt --all` (CI enforces `--check`).
- Lints: `cargo clippy --all-targets --all-features -- -D warnings` (CI).
- No `unwrap()`/`expect()`/`panic!()` in non-test code; return typed errors.
- Minimize allocations/clones; prefer `&[u8]` at API boundaries.
- Security posture: treat shares and reconstructed secrets as sensitive; minimize logging.

TypeScript/React:
- Prefer `unknown` over `any`; narrow with runtime checks at boundaries.
- Use type-only imports where appropriate.
- Keep WASM boundary types explicit; validate user input and surface actionable errors.

Naming:
- Rust: `UpperCamelCase` types, `snake_case` functions/modules; avoid glob imports outside tests.
- OpenSpec change IDs: kebab-case, verb-led (e.g., `add-...`, `update-...`).

### Architecture Patterns
- Keep cryptographic/encoding logic in `crates/safeparts_core/`; other crates are thin wrappers.
- Share packets are versioned, strictly parsed, and validated before use.
- Integrity verification happens before decoding/using reconstructed secrets.
- Optional encryption is encrypt-before-split (KDF -> AEAD) and should be zeroized where practical.
- Web UI performs all crypto locally via WASM; no backend services are required for core functionality.

### Testing Strategy
Rust:
- Unit + property/round-trip tests for GF(256) math and each encoding.
- Negative tests for malformed packets, wrong/mismatched shares, wrong passphrase, and < `k` shares.
- Workspace test command: `cargo test --all-features`.

CLI:
- Prefer black-box e2e tests using `assert_cmd`.

Web:
- Keep WASM boundary tests small and deterministic; avoid brittle UI snapshot tests until workflows stabilize.

### Git Workflow
- Use conventional commits (e.g., `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`).
- Prefer rebasing feature branches over merging.
- Keep commits atomic and scoped to one change.
- For larger work, use a feature branch (e.g., `feat/<kebab-case>`).

## Domain Context
- Secret sharing: Shamir-style sharing over GF(256) with parameters `k` and `n` where `1 <= k <= n <= 255`.
- A “share packet” includes set metadata (set id, `k`, `n`, share index) plus payload and integrity tag.
- Encodings:
  - `base64` / `base64url` (URL-safe, typically no padding)
  - `base58` / `base58check`
  - mnemonic formats (`mnemo-words`, `mnemo-bip39`)
- Threat model assumption: fewer than `k` shares should reveal no information; corrupted/mismatched shares should fail reconstruction.

## Important Constraints
- Do not commit or log real secrets or real derived shares.
- CLI defaults are non-interactive and script-friendly (stdin/stdout by default).
- Web UI must remain static and local-first (no backend dependency for split/combine).
- Security-sensitive code prefers clarity and strict validation over cleverness.

## External Dependencies
- GitHub Actions: `.github/workflows/ci.yml`.
- Netlify: build hook (secret `NETLIFY_BUILD_HOOK_URL`) triggers deploys from `web/dist/`.
