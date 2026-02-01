## Context

Safeparts is a Rust workspace that produces at least two user-facing binaries:

- `safeparts` (CLI) from `crates/safeparts/`
- `safeparts-tui` (TUI) from `crates/safeparts_tui/`

The repository also contains a separate web UI under `web/` (Vite + React + a wasm build step) and an Astro/Starlight help site under `web/help/`.

Today, CI runs Rust formatting, clippy, and tests in `.github/workflows/ci.yml`, and triggers a Netlify build hook on pushes to `main`. There is no release automation for distributing binaries.

Key constraints from the proposal/specs:

- Release builds must be **stable** and gated by passing Rust tests.
- Provide local build tasks for macOS/Linux/Windows.
- Release build automation must not slow or interfere with web UI builds.
- CI and release workflows should be separated, and ideally use path filters.

## Goals / Non-Goals

**Goals:**
- Add a reproducible local process to build `safeparts` + `safeparts-tui` binaries in release mode.
- Add a GitHub Actions workflow that builds, tests, packages, and publishes release assets for macOS/Linux/Windows on version tags.
- Add checksums for release assets.
- Separate workflows:
  - Rust CI (lint/test)
  - Web CI (build web app + docs)
  - Release workflow (only on tags)
- Update README and docs with installation/download options per OS.

**Non-Goals:**
- Building and shipping the web UI as a release artifact.
- Adding auto-updaters.
- Supporting every possible CPU architecture immediately.

## Decisions

### Decision 1: Use GitHub Actions matrix builds for OS targets

Approach:

- Use a release workflow triggered by tags matching `v*`.
- Use a job matrix over `ubuntu-latest`, `macos-latest`, and `windows-latest`.
- Build both binaries with `cargo build --release`.
- Run `cargo test --all-features` once per OS (or once on Linux and build-only on other OSes if runtime becomes too high, but default to testing on each OS for confidence).

Rationale:
- Native OS runners avoid cross-compilation complexity for the first iteration.

### Decision 2: Package artifacts as per-OS archives + checksums

Approach:

- Package per-OS outputs (e.g., `safeparts-<version>-<os>-<arch>.tar.gz` / `.zip` for Windows).
- Include both binaries inside each archive.
- Generate a checksum file (SHA-256) for all archives and upload alongside release assets.

Rationale:
- Users expect simple downloads and integrity verification.

### Decision 3: Keep web build independent from release builds

Approach:

- Do not add web steps to the release build tasks.
- Ensure release workflow does not invoke `bun`, `wasm-pack`, or Vite.
- Introduce a separate web CI workflow (path-filtered to `web/**`).

Rationale:
- Web iteration should remain agile; release builds are inherently heavier and should be opt-in (tags only).

### Decision 4: Separate CI workflows with path filters

Approach:

- Split existing `.github/workflows/ci.yml` into:
  - `rust-ci.yml`: triggers on Rust-related paths; runs fmt/clippy/test.
  - `web-ci.yml`: triggers on `web/**`; runs Bun install + WASM build + web build + docs build.
  - `release.yml`: triggers only on tag pushes.

Rationale:
- Faster feedback and fewer unnecessary jobs.

### Decision 5: Provide local build tasks via documented commands

Approach:

- Provide a small set of documented commands (e.g. `cargo build --release -p safeparts -p safeparts_tui`) and an optional helper script for packaging.

Alternatives considered:
- Add `make`/`just`: currently not present in the repo; adding one is acceptable but optional.

Rationale:
- Keep local flow simple and cross-platform.

## Risks / Trade-offs

- **Windows/macOS runner differences** → Keep packaging scripts minimal; avoid bash-only packaging on Windows.
- **Versioning drift (Cargo.toml vs tag)** → Decide on a source of truth (tag version) and include it in archive names.
- **Release workflow runtime** → If too slow, reduce redundant test runs, but keep at least one full test gate.
- **Binary naming** → Ensure archives contain consistent names per OS (and `.exe` on Windows).
