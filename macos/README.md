# Native macOS app

This SwiftUI app is a separate macOS 14+ front end. It uses the Rust core through a generated UniFFI bridge, stays local, and does not replace the Tauri desktop app.

## Build

You need Swift 6 and the repository Rust toolchain on macOS.

```sh
mise run macos:prepare
cd macos
swift build
swift test
```

`prepare.sh` builds the bridge for the host architecture and regenerates the checked-in Swift, C header, and module map. The compiled static library goes in ignored `macos/Native/`.

Safeparts keeps operation state in memory and clears it when you choose Clear. Swift, Foundation, and the system clipboard can make copies whose complete erasure the app cannot guarantee. Copy only when needed; other apps may read clipboard contents.

Native app signing, notarization, and installer packaging are not implemented yet.
