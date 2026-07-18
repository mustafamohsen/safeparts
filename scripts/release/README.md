# Release builds

Safeparts publishes command-line archives and desktop installers from the tag-triggered release workflow.

Release artifacts include:

- `safeparts` and `safeparts-tui` archives for Linux, Windows, Intel macOS, and Apple Silicon macOS
- Tauri desktop installers for Linux: AppImage, `.deb`, and `.rpm`
- Tauri desktop installers for Windows: NSIS `.exe` and MSI
- the native SwiftUI app for macOS 14+ as an unsigned universal `.dmg`

The web UI is deployed separately and is not included as a release archive.

## CLI and TUI archives

From the repository root:

```bash
python3 scripts/release/check-version.py v0.2.0
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
python3 scripts/release/package.py --version 0.2.0
```

On Windows, run the packaging command with `py -3` instead of `python3`.

`--version` controls the archive name. Release manifests and binaries must already carry the matching project version.

## Native macOS DMG

On macOS with Xcode, Swift 6, Rust, and both Apple Rust targets available:

```bash
RELEASE_VERSION=v0.2.0 mise run macos:package
```

The command builds the Rust UniFFI bridge and Swift executable for arm64 and x86_64, assembles `Safeparts.app`, validates both slices, and writes:

```text
dist/release/safeparts-native-macos-universal-0.2.0.dmg
```

The validator checks the macOS 14.0 deployment target, static Rust linkage, bundle metadata, resource layout, and both architectures. It mounts the completed DMG and validates the packaged copy again.

The DMG is unsigned and unnotarized. Downloaded copies may require an explicit Gatekeeper override. Do not describe this artifact as signed or notarized until Apple release credentials and CI checks are added.
