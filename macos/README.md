# Native macOS app

This SwiftUI app is a separate macOS 14+ front end. It calls the Rust core through UniFFI, runs locally, and does not replace the Tauri desktop app.

## Build

You need Swift 6 and the repository Rust toolchain on macOS.

```sh
mise run macos:prepare
cd macos
swift build
swift test
```

`prepare.sh` builds the bridge for the host architecture with a macOS 14 deployment target. It regenerates the checked-in Swift, C header, and module maps, then copies the generated Swift binding into the compiled source target. The compiled static library stays in ignored `macos/Native/`.

Safeparts keeps operation state in memory and clears it when you choose Clear. Swift, Foundation, UniFFI, and the system clipboard may make copies that the app cannot fully erase. Copy only when needed because other apps can read clipboard contents.

The local build is not a release bundle. Signing, notarization, universal binaries, and installer packaging are not implemented.
