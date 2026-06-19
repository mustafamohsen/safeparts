# AGENTS.md — Desktop App

## Purpose

Owns the standalone Tauri desktop application for local Safeparts split and combine workflows.

## Ownership

- `package.json`, Vite, React, and TypeScript files for the desktop UI.
- `src-tauri/`: Tauri Rust command layer and packaging configuration.
- Desktop-specific README/build notes that do not replace the web, CLI, TUI, or help flows.

## Local Contracts

- Keep split/combine cryptography behind Tauri commands that call `safeparts_core` public APIs.
- Do not add a backend, telemetry, CLI sidecar, node runtime sidecar, or external service requirement.
- Do not persist secrets, recovery shares, reconstructed bytes, or passphrases in local storage.
- Treat recovery shares, passphrases, and reconstructed secrets as sensitive; do not log them.

## Work Guidance

- Preserve the local-first desktop workbench UX: clear split/combine modes, labeled controls, responsive layout, and high-contrast Safeparts styling.
- Use browser/Tauri file and clipboard affordances only for explicit user actions.
- Keep generated and reconstructed data in memory until the user clears it or closes the app.

## Verification

- Frontend type check: `bun run typecheck`
- Frontend build: `bun run build`
- Rust formatting from repo root: `cargo fmt --all -- --check`
- Rust tests from repo root: `cargo test --all-features`

## Child DOX Index

- `src/`: React UI, TypeScript command bindings, and desktop styling.
- `src-tauri/`: Tauri Rust crate, command tests, config, and permissions.
