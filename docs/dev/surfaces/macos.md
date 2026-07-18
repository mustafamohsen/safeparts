# Native macOS surface

The `macos/` Swift package owns the macOS 14+ SwiftUI app. `crates/safeparts_swift/` is a narrow UniFFI adapter. Cryptography, packet parsing, and share encodings stay in `safeparts_core`.

Run `mise run macos:check` on macOS. The preparation step builds a host-architecture Rust library with a macOS 14 deployment target, then regenerates the tracked Swift, header, and module-map files. SwiftPM build output and compiled Rust libraries remain untracked.

The app keeps secrets in memory, uses byte-accurate file operations, and only accesses the clipboard after an explicit user action. Rust work runs outside the main actor so passphrase derivation does not freeze the interface. File and bridge errors shown in the UI must not include secret or recovery-share contents.

The current workflow is for local development. It does not produce a universal app, signed bundle, notarized archive, or installer.
