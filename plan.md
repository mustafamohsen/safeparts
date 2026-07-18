# Native macOS app implementation plan

## Goal

Add a first-class macOS 14+ application with a native SwiftUI interface while keeping `safeparts_core` as the source of truth for secret sharing, packet parsing, encodings, integrity checks, and passphrase protection.

The native app will live alongside the existing Tauri desktop app. It will not replace the Windows, Linux, or macOS Tauri builds in this change.

## User experience

The app uses standard macOS controls and interaction patterns:

- A `NavigationSplitView` separates the Split and Recover tasks.
- Forms, sections, labels, pickers, steppers, secure fields, toolbars, menus, and system panels use native SwiftUI or AppKit controls.
- File import and export use `NSOpenPanel` and `NSSavePanel`.
- Copy and paste happen only after explicit user actions.
- Standard text editing remains available in editable fields.
- Long-running Rust operations run outside the main actor and report progress without freezing the window.
- Errors, success messages, and clipboard warnings have distinct accessible states.

### Split workflow

1. Enter UTF-8 text, paste text, or import an arbitrary binary file.
2. Choose the threshold, share count, concrete share encoding, and optional passphrase.
3. Create recovery shares locally through the Rust bridge.
4. Review each share separately.
5. Copy or save one share, or export all shares as separate text files.

The default policy is 2-of-3. The valid core range remains `1 <= k <= n <= 255`.

### Recover workflow

1. Paste recovery-share text or import multiple UTF-8 share files.
2. Use automatic encoding detection or select a concrete encoding.
3. Inspect the detected encoding, threshold, share count, encryption state, consistency, and readiness.
4. Enter a passphrase when required.
5. Recover the exact original bytes locally.
6. Display and copy the result only when it is valid UTF-8. Always allow the recovered bytes to be saved without lossy conversion.

## Architecture

### Rust ownership

Add `crates/safeparts_swift/` as a narrow UniFFI adapter over `safeparts_core`.

The bridge will:

- Call `safeparts_core::split_secret` and `safeparts_core::combine_shares`.
- Use `encoding::encode_packet` and `encoding::parse_share_packets_wrapped_mnemonics`.
- Expose all four concrete encodings: `base64url`, `base58check`, `mnemo-words`, and `mnemo-bip39`.
- Allow Auto only for inspection and recovery input.
- Carry arbitrary secret and recovery bytes without UTF-8 conversion.
- Return UI-oriented records for encoded shares, inspection, and recovery metadata.
- Map `CoreError` into stable, sanitized bridge error categories.
- Zeroize owned secret, passphrase, and share-input buffers where practical.
- Contain no duplicated cryptographic or packet-format implementation.

UniFFI is preferred over handwritten C ABI code because the workspace forbids handwritten unsafe Rust. Reimplementing the algorithms in Swift is outside the approved approach unless the Rust bridge is proven impractical and the architecture is reconsidered explicitly.

### Swift ownership

Add `macos/` as a Swift package containing:

- `SafepartsKit`: generated bindings, app state, file operations, clipboard behavior, error mapping, and testable workflow logic.
- `SafepartsMac`: the SwiftUI application and native controls.
- Swift tests that call the real Rust bridge.
- A preparation script that builds the host Rust library and regenerates bindings.

App state stays in memory. The app will not add telemetry, analytics, network calls, recent-secret storage, automatic restoration, or sensitive logging.

### Generated bindings

`macos/scripts/prepare.sh` will:

1. Set a macOS 14 deployment target for Rust and native C dependencies.
2. Build the Rust static and dynamic libraries for the host architecture.
3. Generate the Swift binding, C header, and module maps through UniFFI.
4. Normalize generated text for reviewable diffs.
5. Copy the generated Swift binding into the compiled Swift target.
6. Verify that the canonical and compiled Swift binding copies match.

Generated source files are tracked. Compiled libraries and SwiftPM build output are ignored.

## Security and privacy requirements

- Never log secret bytes, recovery-share text, passphrases, or recovered bytes.
- Never include sensitive input in user-facing or diagnostic errors.
- Keep each recovery share independently copyable and saveable.
- Export recovery shares as separate files by default.
- Preserve imported binary secret bytes and recovered bytes exactly.
- Clear task state after an explicit Clear action.
- Discard stale asynchronous results after Clear or input changes.
- Warn that other applications can read copied clipboard contents.
- Do not claim complete memory erasure across Swift, Foundation, UniFFI, allocators, or the system clipboard.

## Implementation phases

### Phase 1: repository contracts

- Add `macos/AGENTS.md` and index the new surface from the root contract.
- Add `safeparts_swift` to the Rust workspace and crates contract.
- Add a native macOS surface guide and feature-matrix coverage.
- Define generated and compiled artifact policy.

### Phase 2: Rust bridge

- Define the UniFFI encoding, share, inspection, recovery, and error types.
- Implement split, inspect, and recover exports through `safeparts_core`.
- Add sanitization and practical zeroization at the boundary.
- Add bridge-level round-trip and negative tests.

### Phase 3: build integration

- Add deterministic binding generation and host-library preparation.
- Set the macOS 14 deployment target explicitly.
- Add SwiftPM targets and linker settings.
- Add `macos:prepare` and `macos:check` tasks.

### Phase 4: application model

- Add task-scoped in-memory state.
- Keep imported binary input distinct from editable text input.
- Add typed status and sanitized error messages.
- Run expensive bridge work outside the main actor.
- Prevent stale split, recovery, inspection, and file-read results from replacing newer state.
- Add all-or-nothing multi-file share import and explicit file-write failures.

### Phase 5: native interface

- Build the Split and Recover views with native controls.
- Add contextual toolbar and menu commands.
- Add explicit Copy, Paste, Import, Save, Export All, and Clear actions.
- Add inspection, progress, empty, success, warning, and error states.
- Add keyboard shortcuts that do not interfere with multiline editing.
- Add accessibility labels and semantic status announcements where supported.

### Phase 6: verification and documentation

- Add Swift model, file-operation, and real bridge integration tests.
- Run Rust formatting, linting, bridge tests, and the full workspace test suite.
- Run binding preparation, Swift build, and Swift tests.
- Verify the executable deployment target and static Rust linkage.
- Update architecture, onboarding, workflows, verification, repository layout, and release limitations.

## Test matrix

### Rust bridge

- Binary secret round trip through every concrete encoding.
- Auto-detected recovery for every concrete encoding.
- Passphrase success, missing passphrase, and wrong passphrase.
- Insufficient, duplicate, mixed, empty, and malformed recovery-share input.
- Inspection consistency and readiness.
- Sanitized errors do not contain supplied recovery-share text.

### Swift

- Threshold and share-count normalization.
- Task-scoped Clear behavior.
- Valid UTF-8 and invalid UTF-8 recovery presentation.
- Real Rust bridge round trips for all encodings.
- Typed bridge-error mapping.
- Failed operations remove stale results.
- All-or-nothing share-file import.
- File-write failure reporting.
- Stable per-share file naming.

### Manual macOS review

- Split text and an imported binary file.
- Copy and save individual shares.
- Export all shares to a new directory.
- Paste and import recovery shares.
- Recover text and binary secrets.
- Check menu commands, keyboard navigation, focus, window resizing, long share layout, and VoiceOver labels.
- Confirm clipboard warnings and task-specific Clear behavior.

## Acceptance criteria

- The native app builds and tests on macOS with a declared minimum version of 14.0.
- Swift calls the Rust core through UniFFI; no algorithm is reimplemented.
- Split and recovery preserve arbitrary bytes.
- All four encodings and Auto recovery behave compatibly with the Rust toolchain.
- Copy, paste, import, save, and export are explicit native desktop actions.
- File and bridge failures are visible and do not leak sensitive input.
- Expensive passphrase operations do not block the main actor.
- Generated bindings are reproducible and compiled artifacts remain untracked.
- Existing Rust, web, Tauri desktop, documentation, and DX checks remain green.
- Signing, notarization, universal binaries, and installer packaging are documented as future work rather than completed features.

## Non-goals

- Replacing the existing Tauri desktop application.
- Reimplementing Shamir sharing, packet formats, encodings, or passphrase protection in Swift.
- Adding a backend, telemetry, synchronization, persistence, or cloud storage.
- Adding QR export or third-party share-format compatibility.
- Shipping a signed, notarized, universal, App Store, or installer artifact in this change.

## Risks and follow-up work

- Swift, Foundation, UniFFI, and clipboard APIs can create copies that cannot be guaranteed to be erased.
- The local preparation workflow builds only the current host architecture.
- macOS 14 runtime behavior still needs testing on an actual macOS 14 machine.
- Signing, notarization, universal packaging, and release CI need a separate approved plan.
- VoiceOver, keyboard focus, long-content layout, and file-panel behavior require a manual UI pass before release.
