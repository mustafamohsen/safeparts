# AGENTS.md — Native macOS App

## Purpose

Owns the SwiftUI macOS 14+ app and generated UniFFI boundary artifacts.

## Ownership

- `Sources/`: app UI, in-memory state, bundled brand resources, native file/clipboard integration, and the compiled copy of the generated Swift binding.
- `Tests/`: view-model, file-behavior, and real bridge integration tests.
- `Generated/`: canonical reproducible UniFFI Swift, header, and module map outputs.
- `scripts/prepare.sh`: builds the host Rust bridge, normalizes generated text, and refreshes both binding locations.

## Local Contracts

- Keep cryptography in `safeparts_core`; Swift calls `safeparts_swift` only.
- Never log or persist secrets, passphrases, or recovery shares.
- Use byte-accurate file IO and explicit clipboard actions.
- Use the top segmented Split/Recover switcher; do not add a navigation sidebar.
- Default to the Words share format. Recovery starts with two share fields, expands to the detected threshold, and enables Passphrase only for encrypted shares.
- Keep per-share copy and save actions compact, accessible, and secondary to the share text.
- Do not commit compiled libraries or Swift build output.
- Keep `Generated/safeparts_swift.swift` byte-identical to `Sources/SafepartsKit/Generated.swift`.

## Work Guidance

- Run `scripts/prepare.sh` before Swift builds after changing the bridge.
- Keep long-running Rust operations off the main actor and discard stale results after Clear.
- Report file failures without including secret or recovery-share contents.

## Verification

- `./scripts/prepare.sh`
- `swift build`
- `./scripts/verify-binary.sh`
- `swift test`

## Child DOX Index

- No child AGENTS.md files.
