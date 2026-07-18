# Release packaging

Owners: `scripts/release/`, `macos/scripts/`, `.github/workflows/release.yml`
Nearest contracts: [`scripts/AGENTS.md`](../../../scripts/AGENTS.md), [`macos/AGENTS.md`](../../../macos/AGENTS.md), root [`AGENTS.md`](../../../AGENTS.md)

## What belongs here

Release tooling builds and publishes:

- `safeparts` CLI archives
- `safeparts-tui` archives
- Tauri desktop installers for Linux and Windows
- the native SwiftUI universal DMG for macOS 14+
- one checksum manifest covering every published file

The web UI is deployed as static output rather than a release archive.

## Platform ownership

- `desktop/` owns the Tauri source and the Linux and Windows installers.
- `macos/` owns the downloadable macOS app and its unsigned universal DMG.
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
python3 scripts/release/package.py --version 0.2.0
RELEASE_VERSION=v0.2.0 mise run macos:package
```

The native package command verifies both architectures, bundle metadata, the macOS 14 deployment target, static Rust linkage, SwiftPM resources, and the mounted DMG.

## When release behavior changes

Update:

- `scripts/release/README.md`
- [`docs/dev/verification.md`](../verification.md)
- [`docs/dev/feature-matrix.md`](../feature-matrix.md)
- the matching platform surface guide
- `.github/workflows/release.yml`
