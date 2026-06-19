# Release Builds

This folder contains helper tooling for producing release-style archives for the
Safeparts binaries.

The release artifacts include:

- `safeparts` (CLI)
- `safeparts-tui` (TUI)
- Safeparts Desktop bundles from the release workflow:
  - Linux: AppImage, `.deb`, and `.rpm`
  - Windows: NSIS `.exe` and MSI
  - macOS: universal `.dmg` for Intel and Apple Silicon Macs

The web UI is intentionally not packaged as a separate release artifact.

## Build (host OS)

From the repo root:

```bash
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
```

On Windows (PowerShell):

```powershell
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
```

## Package (host OS)

The packaging script creates an archive under `dist/release/` for the current OS
and a `SHA256SUMS.txt` for local verification.

Linux/macOS:

```bash
python3 scripts/release/package.py --version 0.1.0
```

Windows:

```powershell
py -3 scripts\release\package.py --version 0.1.0
```

Notes:

- `--version` is used only for naming (it does not change Cargo versions).
- The script expects the binaries to exist under `target/release/`.
