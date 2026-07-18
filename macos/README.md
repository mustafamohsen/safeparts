# Native macOS app

This SwiftUI app is the downloadable Safeparts app for macOS 14 and later. It calls the Rust core through UniFFI, runs locally, and does not replace the Tauri source app used for Linux and Windows releases.

## Build and test

You need Swift 6 and the repository Rust toolchain on macOS.

```sh
mise run macos:prepare
swift build --package-path macos
swift test --package-path macos
```

`prepare.sh` builds the bridge for the host architecture with a macOS 14 deployment target. It regenerates the checked-in Swift, C header, and module maps, then copies the generated Swift binding into the compiled source target. The compiled static library stays in ignored `macos/Native/`.

Safeparts keeps operation state in memory and clears it when you choose Clear. Swift, Foundation, UniFFI, and the system clipboard may make copies that the app cannot fully erase. Copy only when needed because other apps can read clipboard contents.

## Build the release DMG

```sh
RELEASE_VERSION=v0.2.0 mise run macos:package
```

The release task builds arm64 and x86_64 slices, assembles an app bundle, verifies the macOS 14 minimum and static Rust linkage, and creates an unsigned universal DMG under `dist/release/`.

The package is not signed or notarized. Test downloaded artifacts with synthetic secrets before distributing them, and document the expected Gatekeeper warning in release notes.
