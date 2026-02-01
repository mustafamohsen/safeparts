# Release Builds

This folder contains helper tooling for producing release-style archives for the
Safeparts binaries.

The release artifacts include:

- `safeparts` (CLI)
- `safeparts-tui` (TUI)

The web UI is intentionally not part of the release build.

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
