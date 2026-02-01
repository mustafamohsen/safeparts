## 1. Local Release Build Tasks

- [x] 1.1 Add documented local commands to build `safeparts` and `safeparts-tui` in release mode (Rust-only; no web)
- [x] 1.2 Add a local packaging script/task that produces per-OS archives and a SHA-256 checksum file

## 2. GitHub Actions: Workflow Separation

- [x] 2.1 Split Rust CI into its own workflow with path filters (Rust-only changes run Rust CI)
- [x] 2.2 Add a web CI workflow with path filters (`web/**`) that builds WASM + web app + docs
- [x] 2.3 Ensure neither CI workflow triggers the release workflow

## 3. GitHub Actions: Release Automation

- [x] 3.1 Add a release workflow triggered only by version tags (`v*`)
- [x] 3.2 Build on macOS/Linux/Windows via a job matrix; build both binaries in `--release`
- [x] 3.3 Run Rust tests (`cargo test --all-features`) as a gate before publishing assets
- [x] 3.4 Package and upload release assets (archives + checksum file) to GitHub Releases

## 4. Documentation

- [x] 4.1 Update `README.md` with download links, install steps for macOS/Linux/Windows, and a verification command
- [x] 4.2 Add/Update help docs pages to include download options and OS-specific installation instructions
- [x] 4.3 Document CLI vs TUI usage (`safeparts` vs `safeparts-tui`)

## 5. Verify

- [x] 5.1 Verify local build tasks produce expected binaries/archives on at least one platform
- [x] 5.2 Verify CI workflows behave correctly with path filters (web-only vs rust-only)
- [x] 5.3 Dry-run the release workflow logic (without publishing) or validate with a test tag in a safe manner
