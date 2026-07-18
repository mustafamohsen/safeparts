# AGENTS.md — Native macOS App

## Purpose

Owns the SwiftUI macOS 14+ app and generated UniFFI boundary artifacts.

## Ownership

- `Sources/`: app UI, in-memory state, and native file/clipboard integration.
- `Tests/`: view-model and real bridge integration tests.
- `Generated/`: reproducible UniFFI Swift, header, and module map outputs only.
- `scripts/prepare.sh`: builds the host Rust bridge and regenerates bindings.

## Local Contracts

- Keep cryptography in `safeparts_core`; Swift calls `safeparts_swift` only.
- Never log or persist secrets, passphrases, or recovery shares.
- Use byte-accurate file IO and explicit clipboard actions.
- Do not commit compiled libraries or Swift build output.

## Verification

- `./scripts/prepare.sh`
- `swift build`
- `swift test`

## Child DOX Index

- No child AGENTS.md files.
