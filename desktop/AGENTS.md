# AGENTS.md — Desktop App

## Purpose

Owns the standalone Tauri desktop application that runs the existing Safeparts web UI locally through Tauri.

## Ownership

- `package.json`, Vite, React, and TypeScript files for the desktop UI.
- `src-tauri/`: Tauri Rust command layer and packaging configuration.
- Desktop-specific README/build notes that do not replace the web, CLI, TUI, or help flows.

## Local Contracts

- Keep the React interface and exposed features aligned with `web/src`; desktop is a local Tauri version of the web UI, not a separate product surface.
- Keep split/combine cryptography behind Tauri commands that call `safeparts_core` public APIs.
- Do not add a backend, telemetry, CLI sidecar, node runtime sidecar, or external service requirement.
- Do not persist secrets, recovery shares, reconstructed bytes, or passphrases in local storage.
- Treat recovery shares, passphrases, and reconstructed secrets as sensitive; do not log them.
- Release CI packages this Tauri app for Linux. Native SwiftUI and WinUI apps own the downloadable macOS and Windows releases.

## Work Guidance

- Copy web UI structure/styles/components from `web/src` when desktop needs UI parity updates.
- Do not expose desktop-only split/combine features unless the web UI exposes them first.
- Use browser/Tauri clipboard affordances only for explicit user actions.
- Keep generated and reconstructed data in memory until the user clears it or closes the app.

## Verification

- Frontend type check: `bun run typecheck`
- Frontend build: `bun run build`
- Rust formatting from repo root: `cargo fmt --all -- --check`
- Rust tests from repo root: `cargo test --all-features`

## Child DOX Index

- `src/`: React UI, TypeScript command bindings, and desktop styling.
- `src-tauri/`: Tauri Rust crate, command tests, config, and permissions.
