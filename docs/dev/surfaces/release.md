# Release packaging

Owners: `scripts/release/`, `macos/scripts/`, `.github/workflows/release.yml`
Nearest contracts: [`scripts/AGENTS.md`](../../../scripts/AGENTS.md), [`macos/AGENTS.md`](../../../macos/AGENTS.md), root [`AGENTS.md`](../../../AGENTS.md)

## What belongs here

Release tooling builds and publishes:

- `safeparts` CLI archives
- `safeparts-tui` archives
- Tauri desktop installers for Linux and Windows
- the native SwiftUI universal DMG for macOS 14+
- self-contained native WinUI preview archives for Windows 11 x64 and ARM64
- one checksum manifest covering every published file

The web UI is deployed as static output rather than a release archive. A manual `workflow_dispatch` assembles every release artifact and `SHA256SUMS.txt` into a short-lived dry-run artifact without creating a GitHub Release.

## Platform ownership

- `desktop/` owns the Tauri source and the canonical Linux and Windows installers during the native preview.
- `macos/` owns the downloadable macOS app and its unsigned universal DMG.
- `windows/` owns the unsigned architecture-specific Windows preview archives.
- `scripts/release/package.py` owns CLI/TUI archives.
- `.github/workflows/release.yml` joins these artifacts and creates the GitHub Release.

## Change rules

- Keep packaging deterministic in inputs, layout, naming, and validation. Apple DMG metadata may still prevent byte-for-byte identical images across hosts.
- Do not embed secrets in scripts, archives, or logs.
- Keep artifact names stable unless a release task changes them deliberately.
- Keep the native artifact explicitly marked unsigned and unnotarized.
- Update local commands, CI behavior, and release docs together.

## Useful checks

```bash
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
python3 scripts/release/package.py --version 0.3.0
RELEASE_VERSION=v0.3.0 mise run macos:package
# On Windows:
python windows/scripts/package-release.py 0.3.0 x64
```

The native package command verifies both architectures, bundle metadata, the macOS 14 deployment target, static Rust linkage, SwiftPM resources, and the mounted DMG.

## When release behavior changes

Update:

- `scripts/release/README.md`
- [`docs/dev/verification.md`](../verification.md)
- [`docs/dev/feature-matrix.md`](../feature-matrix.md)
- the matching platform surface guide
- `.github/workflows/release.yml`
