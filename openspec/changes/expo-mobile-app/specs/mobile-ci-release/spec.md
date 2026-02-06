## ADDED Requirements

### Requirement: Mobile CI runs on relevant changes
The repository SHALL run a dedicated CI workflow to validate the mobile app when changes affect mobile code or shared components used by mobile.

#### Scenario: Mobile-related pull request
- **WHEN** a pull request changes files under `mobile/` (or mobile bridge code)
- **THEN** mobile CI runs and reports success/failure

### Requirement: Mobile CI includes core correctness gates
Mobile CI SHALL run Rust correctness gates to ensure the underlying core remains correct.

#### Scenario: Rust test gate
- **WHEN** mobile CI runs
- **THEN** `cargo test --all-features` succeeds

### Requirement: Store release is tag-based
The release pipeline SHALL build and submit iOS and Android releases to App Store Connect and Google Play when a version tag matching `v<MAJOR>.<MINOR>.<PATCH>` is pushed.

#### Scenario: Tag trigger
- **WHEN** a version tag is pushed
- **THEN** the pipeline builds iOS and Android release binaries
- **AND** submits them to the configured store destinations

### Requirement: Signing and submission are gated on credentials
Store submissions SHALL be gated on required credentials and fail early with a clear error if missing.

#### Scenario: Missing credentials
- **WHEN** a release tag is pushed and required credentials are not configured
- **THEN** the release job fails with a message describing which credentials are missing

### Requirement: Release process supports staged rollout
The pipeline SHALL support submitting releases to non-production tracks (e.g., TestFlight, Play internal testing) before promotion.

#### Scenario: Internal track submission
- **WHEN** a release is initiated
- **THEN** the pipeline can submit to an internal/testing track without requiring immediate production promotion
