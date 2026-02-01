## Why

Safeparts currently requires building from source to run the CLI on macOS, Linux, and Windows. A first-class build + release process (with documented install paths) reduces friction for new users and makes releases reproducible and trustworthy.

## What Changes

- Add local build tasks to produce stable, release-grade binaries for macOS, Linux, and Windows.
- Add a GitHub Actions release workflow that builds and publishes binaries on version tags.
- Ensure release builds run on Rust stable and pass all Rust tests before publishing.
- Keep the web UI workflow agile: release builds must not run as part of the normal web build, and web CI must remain separate from release automation.
- Update README and help docs with OS-specific download and installation instructions.

## Capabilities

### New Capabilities
- `local-release-build`: Documented local commands to build platform binaries (macOS, Linux, Windows) in release mode.
- `release-automation`: GitHub Actions workflow to build/test/package binaries and publish them to GitHub Releases on version tags.
- `ci-pipeline-separation`: Separate CI workflows so web-only changes do not trigger release builds, and release workflows do not slow normal CI.
- `install-instructions`: Clear download options and install instructions per OS in README and the help docs site.

### Modified Capabilities

<!-- None. -->

## Impact

- Rust build/release tooling (scripts/Makefile and/or cargo subcommands)
- GitHub Actions: new workflow(s) for release + CI separation (`.github/workflows/*`)
- Documentation updates:
  - `README.md`
  - `web/help/src/content/docs/**` (download + install instructions)
