# Native macOS surface

The `macos/` Swift package owns the macOS 14+ SwiftUI app. `crates/safeparts_swift/` exposes a narrow, sanitized UniFFI API while algorithms remain in `safeparts_core`.

Run `mise run macos:check` on macOS. Generated Swift, header, and module-map files are tracked; compiled libraries and `.build/` are ignored. Signing, notarization, and installer packaging are not implemented.
