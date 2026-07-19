# AGENTS.md — Native macOS App

## Purpose

Owns the SwiftUI macOS 14+ app and generated UniFFI boundary artifacts.

## Ownership

- `Sources/`: app UI, in-memory state, bundled brand resources, native file/clipboard integration, and the compiled copy of the generated Swift binding.
- `Tests/`: view-model, file-behavior, and real bridge integration tests.
- `Generated/`: canonical reproducible UniFFI Swift, header, and module map outputs.
- `Release/`: checked-in native app bundle metadata templates.
- `scripts/prepare.sh`: builds the host Rust bridge, normalizes generated text, and refreshes both binding locations.
- `scripts/package-release.sh` and `scripts/validate-release.sh`: build and validate the unsigned universal native DMG.

## Local Contracts

- Keep cryptography in `safeparts_core`; Swift calls `safeparts_uniffi` only.
- Never log or persist secrets, passphrases, or recovery shares.
- Use byte-accurate file IO and explicit clipboard actions.
- Put the Safeparts title and logo in the system title bar. The segmented task switcher contains only Split and Recover, and content pages do not set window titles.
- Default to the Words share format. Recovery starts with two share fields, expands to the detected threshold, and enables Passphrase only for encrypted shares.
- Label the primary split action "Split" and keep Command-Return as an unlabelled keyboard shortcut.
- Give each recovery share field compact Paste and eraser-style Clear actions. Identify fields with stable IDs so removal cannot leave stale index bindings. Allow fields above the two-field minimum to be removed without automatically adding them back. Show readiness in the share header, put Recover Secret immediately below the share inputs without a feedback label, present failures in a native alert, and do not show a separate metadata summary.
- Give recovered text a subtle highlight so it stands apart from the input controls.
- Use compact icon-only actions with accessibility labels and help for share copy/save, recovered-secret copy/save, and Export All.
- Export All may prepend a sanitized user-provided filename prefix without changing individual Save filenames.
- Release packaging must contain arm64 and x86_64 slices, target macOS 14.0, keep the Rust bridge static, preserve SwiftPM resources, and remain explicitly unsigned/unnotarized.
- Do not commit compiled libraries, Swift build output, app bundles, or DMGs.
- Keep `Generated/safeparts_uniffi.swift` byte-identical to `Sources/SafepartsKit/Generated.swift`.

## Work Guidance

- Run `scripts/prepare.sh` before Swift builds after changing the bridge.
- Keep long-running Rust operations off the main actor and discard stale results after Clear.
- Report file failures without including secret or recovery-share contents.

## Verification

- `./scripts/prepare.sh`
- `swift build`
- `./scripts/verify-binary.sh`
- `swift test`
- `RELEASE_VERSION=v0.2.0 mise run macos:package`

## Child DOX Index

- No child AGENTS.md files.
