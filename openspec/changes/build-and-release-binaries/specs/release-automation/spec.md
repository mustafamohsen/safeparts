## ADDED Requirements

### Requirement: GitHub Releases are created from version tags
The project SHALL publish binaries via GitHub Releases when a version tag is pushed.

#### Scenario: Version tag trigger
- **WHEN** a git tag matching `v<MAJOR>.<MINOR>.<PATCH>` is pushed
- **THEN** GitHub Actions runs the release workflow
- **AND** a GitHub Release is created (or updated) for that tag

### Requirement: Release builds are stable and tested
Release artifacts SHALL be built with Rust stable and SHALL pass all Rust tests before publishing.

#### Scenario: Test gate
- **WHEN** the release workflow runs
- **THEN** it runs `cargo test --all-features`
- **AND** it publishes artifacts only if tests succeed

### Requirement: Release artifacts include supported OS binaries
Each release SHALL include binaries for macOS, Linux, and Windows.

#### Scenario: Release asset set
- **WHEN** a release completes successfully
- **THEN** the release contains downloadable artifacts for macOS
- **AND** downloadable artifacts for Linux
- **AND** downloadable artifacts for Windows

### Requirement: Release artifacts include both CLI and TUI binaries
Each release artifact set SHALL include both `safeparts` and `safeparts-tui` binaries.

#### Scenario: Included binaries
- **WHEN** a user downloads the release artifacts for their OS
- **THEN** they can install and run `safeparts` (CLI)
- **AND** they can install and run `safeparts-tui` (TUI)

### Requirement: Release artifacts are packaged and checksummed
Release artifacts SHALL be packaged in a user-friendly archive format and accompanied by checksums.

#### Scenario: Checksums available
- **WHEN** a release is published
- **THEN** the release includes a checksum file (e.g., SHA-256) covering all uploaded artifacts
