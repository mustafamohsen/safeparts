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
- one checksum manifest listing every published asset by its release-page filename

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

## Pinned inputs and publication permissions

The release workflow uses immutable commit SHAs for third-party actions. Each `uses:` line keeps the reviewed action version beside the SHA. Build jobs use the Rust and Bun versions from `mise.toml`, the .NET SDK from `windows/global.json`, Xcode 16.2, and fixed GitHub-hosted runner images.

Workflow permissions default to `contents: read`. Artifact assembly stays read-only. The separate `publish` job runs only for a pushed tag and is the only job granted `contents: write`. A manual dispatch still builds, validates, downloads, checksums, and uploads the full candidate, but it cannot create a GitHub Release.

`mise run workflow:check` tests this policy and runs actionlint. CI runs the policy tests whenever the release workflow, validator, or version sources change.

## Update a pin safely

1. Read the upstream release notes and confirm the new action or tool version supports the fixed runner image.
2. Resolve the reviewed tag to its commit SHA. For an annotated tag, use the dereferenced value from `git ls-remote <repository-url> 'refs/tags/<version>^{}'`.
3. For `dtolnay/rust-toolchain`, resolve `refs/heads/stable`, review that commit, and update the date in its comment. Keep `toolchain:` equal to the Rust version in `mise.toml`.
4. Update the SHA and version comment together. Keep Bun aligned with `mise.toml` and .NET aligned with `windows/global.json`.
5. Run `mise run workflow:check`, then start the release dry run and inspect the assembled artifact before merging.

Do not replace a SHA with a major tag, `stable`, `latest`, an `x` version, or a `*-latest` runner label.

## Useful checks

```bash
mise run workflow:check
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
python3 scripts/release/package.py --version 0.3.1
RELEASE_VERSION=v0.3.1 mise run macos:package
# On Windows:
python windows/scripts/package-release.py 0.3.1 x64

# Full remote dry run; this assembles artifacts but does not publish a release.
gh workflow run release.yml --ref <branch> -f version=v0.3.1
gh run watch
```

The native package command verifies both architectures, bundle metadata, the macOS 14 deployment target, static Rust linkage, SwiftPM resources, and the mounted DMG.

## When release behavior changes

Update:

- `scripts/release/README.md`
- [`docs/dev/verification.md`](../verification.md)
- [`docs/dev/feature-matrix.md`](../feature-matrix.md)
- the matching platform surface guide
- `.github/workflows/release.yml`
