## ADDED Requirements

### Requirement: GitHub Actions workflow builds Docker images

The repository SHALL include a GitHub Actions workflow at `.github/workflows/docker-publish.yml` that builds and publishes Docker images.

#### Scenario: Workflow triggered on push to main
- **WHEN** a commit is pushed to the `main` branch
- **AND** the commit includes changes to `web/`, `crates/`, or the Dockerfile
- **THEN** the workflow runs and builds a Docker image

#### Scenario: Workflow triggered on release
- **WHEN** a release tag matching `v*` is published
- **THEN** the workflow runs and builds a Docker image

#### Scenario: Workflow skipped when no relevant changes
- **WHEN** a commit is pushed to `main`
- **AND** the commit only changes files outside `web/`, `crates/`, `Cargo.lock`, and `Dockerfile`
- **THEN** the workflow is skipped or exits early

### Requirement: Images published to GitHub Container Registry

The workflow SHALL publish images to `ghcr.io/mustafamohsen/safeparts`.

#### Scenario: Image published with latest tag on main push
- **WHEN** workflow completes on a push to `main`
- **THEN** image is published as `ghcr.io/mustafamohsen/safeparts:latest`
- **AND** image is published as `ghcr.io/mustafamohsen/safeparts:sha-<short-sha>`

#### Scenario: Image published with version tag on release
- **WHEN** workflow completes on a release tag `v1.2.3`
- **THEN** image is published as `ghcr.io/mustafamohsen/safeparts:v1.2.3`
- **AND** image is published as `ghcr.io/mustafamohsen/safeparts:latest`

### Requirement: Build caching for CI performance

The workflow SHALL use caching to minimize build time.

#### Scenario: Docker layer cache used between builds
- **WHEN** workflow runs
- **THEN** it uses GitHub Actions cache or registry cache for Docker layers

#### Scenario: Cargo registry cached
- **WHEN** workflow runs
- **THEN** Cargo registry and build artifacts are cached between runs

### Requirement: Image metadata and labels

Published images SHALL include OCI-standard metadata labels.

#### Scenario: Image has source label
- **WHEN** user inspects the published image
- **THEN** the image has label `org.opencontainers.image.source` pointing to the GitHub repository

#### Scenario: Image has version label
- **WHEN** user inspects the published image built from a release
- **THEN** the image has label `org.opencontainers.image.version` matching the release tag

### Requirement: Documentation updated

The repository documentation SHALL be updated to include Docker usage instructions.

#### Scenario: README includes Docker quickstart
- **WHEN** user reads the README.md
- **THEN** there is a section explaining how to run the web UI via Docker

#### Scenario: Build docs include Docker section
- **WHEN** user reads the build-and-run documentation
- **THEN** there is a Docker tab or section with pull and run instructions
