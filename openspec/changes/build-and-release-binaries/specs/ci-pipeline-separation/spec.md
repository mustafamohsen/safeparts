## ADDED Requirements

### Requirement: Release automation is isolated from normal CI
The release workflow SHALL run only for version tags and SHALL NOT run on normal pushes or pull requests.

#### Scenario: PR does not run release
- **WHEN** a pull request is opened or updated
- **THEN** the release workflow does not run

#### Scenario: Push to main does not run release
- **WHEN** a commit is pushed to a branch (including `main`) without a version tag
- **THEN** the release workflow does not run

### Requirement: Web CI is separate from Rust CI
The project SHALL have separate CI workflows for web changes and Rust changes.

#### Scenario: Web-only change
- **WHEN** a pull request changes only files under `web/`
- **THEN** the web workflow runs
- **AND** the Rust workflow may be skipped based on path filters (if no Rust files changed)

#### Scenario: Rust-only change
- **WHEN** a pull request changes only Rust code outside `web/`
- **THEN** the Rust workflow runs
- **AND** the web workflow may be skipped based on path filters

### Requirement: Release build does not hinder web iteration
The normal web build and web CI SHALL remain fast and SHALL not include building platform release binaries.

#### Scenario: Web build remains agile
- **WHEN** running the web build locally or in web CI
- **THEN** it does not build multi-platform release artifacts
