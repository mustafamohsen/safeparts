# AGENTS.md — Desktop Tauri Command Layer

## Purpose

Owns the Tauri Rust crate, command layer, permissions, generated schemas, and packaging configuration for the desktop app.

## Ownership

- `src/`: Tauri command implementation and command tests.
- `capabilities/`: Tauri permissions used by the desktop app.
- `tauri.conf.json`: app identity, window settings, CSP, and bundle config.
- `gen/schemas/`: Tauri-generated schema files.
- `icons/`: desktop bundle icons.

## Local Contracts

- Commands must call `safeparts_core` public APIs for split/combine behavior.
- Do not add a backend, telemetry, CLI sidecar, node sidecar, or external service requirement.
- Do not persist secrets, recovery shares, reconstructed bytes, or passphrases.
- Sanitize parse errors so share input is not echoed back to the UI.

## Work Guidance

- Follow `docs/dev/surfaces/desktop.md` and `docs/agents/conventions.md`.
- Add command tests for new command behavior and negative cases.
- Treat schema changes as generated artifact changes. Review them deliberately.

## Verification

- `cargo test -p safeparts_desktop --lib`
- `cargo fmt --all -- --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cd desktop && bun run tauri:build -- --no-bundle` when packaging/config changes

## Child DOX Index

- No child AGENTS.md files yet.
