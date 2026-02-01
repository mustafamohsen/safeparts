## Why

Users need a simple way to self-host Safeparts without managing Rust toolchains, WASM builds, or Node.js dependencies. A self-contained Docker image enables one-command deployment for air-gapped environments, internal infrastructure, and users who prefer not to use the hosted version.

## What Changes

- Add a multi-stage Dockerfile that builds WASM, web app, and docs into a single static-serving image
- Add CI workflow to build and publish Docker images to GitHub Container Registry (ghcr.io)
- Optimize Docker layer caching for fast rebuilds (Rust dependencies, npm dependencies, source changes)
- Update documentation with Docker usage instructions
- Update README with Docker quick-start section

## Capabilities

### New Capabilities

- `docker-web-image`: Dockerfile and build configuration for self-contained web UI + docs image
- `docker-ci-publish`: GitHub Actions workflow for building and publishing Docker images

### Modified Capabilities

None - this is additive functionality that doesn't change existing spec-level behavior.

## Impact

- **New files**: `web/Dockerfile`, `.github/workflows/docker-publish.yml`
- **Modified files**: `README.md`, `web/help/src/content/docs/build-and-run.md` (or equivalent docs)
- **Dependencies**: None added to runtime; build-time only (Docker)
- **CI**: New workflow triggered on releases and main branch pushes
- **Registry**: Images published to `ghcr.io/mustafamohsen/safeparts`
