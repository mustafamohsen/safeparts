## ADDED Requirements

### Requirement: Dockerfile produces self-contained web UI image

The repository SHALL include a Dockerfile at `web/Dockerfile` that builds a self-contained image serving the web UI and documentation site.

#### Scenario: Build image from repository root
- **WHEN** user runs `docker build -t safeparts-web -f web/Dockerfile .`
- **THEN** Docker builds successfully and produces an image tagged `safeparts-web`

#### Scenario: Image serves web UI at root path
- **WHEN** user runs `docker run -p 8080:80 safeparts-web`
- **AND** user opens `http://localhost:8080/`
- **THEN** the Safeparts web UI loads and is fully functional (WASM initialized)

#### Scenario: Image serves documentation at /help/
- **WHEN** user runs `docker run -p 8080:80 safeparts-web`
- **AND** user opens `http://localhost:8080/help/`
- **THEN** the Starlight documentation site loads with all pages accessible

### Requirement: Multi-stage build for caching optimization

The Dockerfile SHALL use multi-stage builds to optimize layer caching and minimize rebuild time.

#### Scenario: Rust dependencies cached when only web code changes
- **WHEN** user modifies files in `web/src/` but not in `crates/` or `Cargo.lock`
- **AND** user rebuilds the Docker image
- **THEN** the Rust toolchain and dependency compilation stages are reused from cache

#### Scenario: Web dependencies cached when only app code changes
- **WHEN** user modifies files in `web/src/` but not `web/package.json` or `web/bun.lock`
- **AND** user rebuilds the Docker image
- **THEN** the `bun install` stage is reused from cache

#### Scenario: WASM cached when only web code changes
- **WHEN** user modifies files in `web/src/` but not in `crates/`
- **AND** user rebuilds the Docker image
- **THEN** the WASM compilation stage is reused from cache

### Requirement: Minimal final image size

The final runtime image SHALL be based on a minimal base image and contain only static files and the HTTP server.

#### Scenario: Final image is under 50MB
- **WHEN** user builds the Docker image
- **AND** user runs `docker images safeparts-web`
- **THEN** the image size is less than 50MB

#### Scenario: No build tools in final image
- **WHEN** user runs `docker run safeparts-web sh -c "which rustc || which bun || which node"`
- **THEN** the command returns no results (exit code 1)

### Requirement: SPA routing support

The HTTP server configuration SHALL support single-page application routing for the React web UI.

#### Scenario: Deep links work without 404
- **WHEN** user navigates directly to `http://localhost:8080/some/deep/path` (not a real file)
- **THEN** the server returns the index.html and React router handles the route

#### Scenario: Static assets served correctly
- **WHEN** user requests `http://localhost:8080/assets/index-abc123.js`
- **THEN** the server returns the JavaScript file with correct MIME type

### Requirement: Security headers configured

The HTTP server SHALL include security headers appropriate for a client-side application.

#### Scenario: CSP header present
- **WHEN** user requests any page from the container
- **THEN** the response includes a Content-Security-Policy header

#### Scenario: X-Frame-Options header present
- **WHEN** user requests any page from the container
- **THEN** the response includes `X-Frame-Options: SAMEORIGIN` header
