# Release builds

Safeparts publishes command-line archives and desktop installers from the tag-triggered release workflow.

Release artifacts include:

- `safeparts` and `safeparts-tui` archives for Linux, Windows, Intel macOS, and Apple Silicon macOS
- Tauri desktop installers for Linux: AppImage, `.deb`, and `.rpm`
- Tauri desktop installers for Windows: NSIS `.exe` and MSI
- the native SwiftUI app for macOS 14+ as an unsigned universal `.dmg`
- native WinUI preview archives for Windows 11 x64 and ARM64

The web UI is deployed separately and is not included as a release archive.

## CLI and TUI archives

From the repository root:

```bash
python3 scripts/release/check-version.py v0.3.0
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
python3 scripts/release/package.py --version 0.3.0
```

On Windows, run the packaging command with `py -3` instead of `python3`.

`--version` controls the archive name. Release manifests and binaries must already carry the matching project version.

## Native macOS DMG

On macOS with Xcode, Swift 6, Rust, and both Apple Rust targets available:

```bash
RELEASE_VERSION=v0.3.0 mise run macos:package
```

The command builds the Rust UniFFI bridge and Swift executable for arm64 and x86_64, assembles `Safeparts.app`, validates both slices, and writes:

```text
dist/release/safeparts-native-macos-universal-0.3.0.dmg
```

The validator checks the macOS 14.0 deployment target, static Rust linkage, bundle metadata, resource layout, and both architectures. It mounts the completed DMG and validates the packaged copy again.

The DMG is unsigned and unnotarized. Downloaded copies may require an explicit Gatekeeper override. Do not describe this artifact as signed or notarized until Apple release credentials and CI checks are added.

## Native Windows preview archives

On a matching native Windows runner with .NET 10 and Rust:

```powershell
python windows/scripts/package-release.py 0.3.0 x64
python windows/scripts/package-release.py 0.3.0 arm64
```

Each command publishes an architecture-specific, self-contained WinUI app, adds the matching Rust DLL, validates the staged directory, creates a deterministic zip, extracts it into a clean directory, and validates the exact packaged copy. CI launches that extracted app and runs the Rust/C# interoperability smoke against its bundled bridge.

The artifacts are `safeparts-native-windows-x64-0.3.0.zip` and `safeparts-native-windows-arm64-0.3.0.zip`. They are unsigned and may trigger SmartScreen. The central `SHA256SUMS.txt` covers both archives. During the preview, release CI also publishes the established Tauri Windows MSI and NSIS installers. The native archives have a separate identity and are not an in-place upgrade for the Tauri app.
