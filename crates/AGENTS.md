# AGENTS.md — Rust Workspace Crates

## Purpose

Owns Rust workspace members for the core library, CLI, TUI, WASM bindings, and native Swift bridge.

## Ownership

- `safeparts_core/`: security-sensitive algorithms, packet formats, encodings, optional encryption.
- `safeparts/`: script-friendly CLI binary and CLI integration tests.
- `safeparts_tui/`: terminal UI binary and interaction/domain state.
- `safeparts_wasm/`: wasm-bindgen facade consumed by `web/`.
- `safeparts_swift/`: narrow UniFFI facade consumed by the native macOS app.

## Local Contracts

- Keep shared secret-handling logic in `safeparts_core`; front-ends should adapt IO and presentation only.
- Treat share packets, passphrases, and reconstructed secrets as sensitive. Do not log or fixture real values.
- Workspace lints forbid `unsafe`; do not weaken lint policy.

## Work Guidance

- Follow `docs/agents/conventions.md` for Rust style, errors, testing, CLI flags, and security-sensitive code.
- Prefer typed errors in core and user-facing error mapping in CLI/TUI/WASM boundaries.
- Add deterministic round-trip and negative tests for packet, encoding, crypto, and threshold behavior changes.

## Verification

- Format: `cargo fmt --all -- --check`
- Lint: `cargo clippy --all-targets --all-features -- -D warnings`
- Test: `cargo test --all-features`
- Targeted examples: `cargo test -p safeparts_core <pattern>`, `cargo test -p safeparts --test e2e <pattern>`

## Child DOX Index

- `safeparts_core/`: core library internals and public API.
- `safeparts/`: CLI binary and e2e tests.
- `safeparts_tui/`: terminal UI binary.
- `safeparts_wasm/`: browser/WASM binding layer.
- `safeparts_swift/`: native Swift/UniFFI binding layer.
