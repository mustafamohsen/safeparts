# Native macOS surface

The `macos/` Swift package owns the macOS 14+ SwiftUI app and the downloadable macOS release. `crates/safeparts_swift/` is a narrow UniFFI adapter. Cryptography, packet parsing, and share encodings stay in `safeparts_core`.

Run `mise run macos:check` on macOS. The preparation step builds a host-architecture Rust library with a macOS 14 deployment target, then regenerates the tracked Swift, header, and module-map files. SwiftPM build output and compiled Rust libraries remain untracked.

The app keeps secrets in memory, uses byte-accurate file operations, and only accesses the clipboard after an explicit user action. Rust work runs outside the main actor so passphrase derivation does not freeze the interface. File and bridge errors shown in the UI must not include secret or recovery-share contents.

## Release package

Run:

```bash
RELEASE_VERSION=v0.2.0 mise run macos:package
```

The release script builds the Rust bridge and Swift executable for arm64 and x86_64, assembles `Safeparts.app`, and creates an unsigned universal DMG. Validation checks the app and mounted DMG for:

- macOS 14.0 minimum deployment
- both architectures
- static UniFFI bridge linkage
- expected bundle identifier and version
- app icon and SwiftPM resource bundle
- absence of non-system dynamic libraries and release signing authorities

The DMG is not signed or notarized. Keep that limitation visible in release notes until Apple credentials and notarization checks are added.
