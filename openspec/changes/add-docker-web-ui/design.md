## Context

Safeparts web UI requires a complex build chain: Rust toolchain with wasm32 target, wasm-pack, wasm-bindgen-cli, Bun/Node.js, and multiple build steps (WASM compilation, Vite build, Astro/Starlight build). This makes self-hosting difficult for users who want to run the web UI internally without using the hosted version.

Current deployment relies on Netlify's build hooks triggered from CI. There's no containerized option.

## Goals / Non-Goals

**Goals:**
- Single `docker run` command to serve the complete web UI + docs
- Multi-stage Dockerfile with aggressive layer caching for fast CI builds
- GitHub Actions workflow to build and publish images on releases
- Minimal final image size (static files served by lightweight HTTP server)
- Support for custom base path configuration (for reverse proxy setups)

**Non-Goals:**
- Runtime secret splitting (WASM runs in browser, not server)
- Custom TLS termination (users should use reverse proxy)
- CLI/TUI in the Docker image (separate concern, different use case)
- Kubernetes manifests or docker-compose files (future enhancement)

## Decisions

### Decision 1: Multi-stage Dockerfile with 4 stages

**Choice:** Four build stages: rust-builder → wasm-builder → web-builder → runtime

**Rationale:** 
- `rust-builder`: Install Rust toolchain, wasm-pack, wasm-bindgen-cli. Cached unless Cargo.lock changes.
- `wasm-builder`: Build WASM from Rust sources. Cached unless crates/ changes.
- `web-builder`: Install Bun deps, build web app + docs. Cached unless web/ changes.
- `runtime`: Copy static files to nginx:alpine (~25MB final image).

**Alternatives considered:**
- Single-stage: Simpler but 2GB+ image, no caching benefits.
- Two-stage (build + runtime): Less granular caching, rebuilds WASM on web changes.

### Decision 2: nginx:alpine as runtime base

**Choice:** Use `nginx:alpine` with custom config for SPA routing and /help/ path.

**Rationale:**
- Battle-tested, tiny (~8MB base), excellent caching headers support
- Native SPA fallback (`try_files $uri $uri/ /index.html`)
- Easy to configure for /help/ static path

**Alternatives considered:**
- Caddy: Simpler config but larger image, less common in enterprise
- Static file server in Rust: Would need to build/maintain, no clear benefit
- Node.js serve: Adds ~50MB for runtime, unnecessary for static files

### Decision 3: GitHub Container Registry (ghcr.io)

**Choice:** Publish to `ghcr.io/mustafamohsen/safeparts` with tags: `latest`, `vX.Y.Z`, `sha-<commit>`

**Rationale:**
- Free for public repos, integrated with GitHub Actions
- Supports multi-arch manifests for future ARM support
- No separate credentials needed (uses GITHUB_TOKEN)

**Alternatives considered:**
- Docker Hub: Rate limits, requires separate credentials
- Self-hosted registry: Maintenance burden, no benefit for open source

### Decision 4: Build triggers and tagging strategy

**Choice:** 
- Build on every push to main (tag: `latest`, `sha-<short>`)
- Build on release tags (tag: `vX.Y.Z`, `latest`)
- Skip build if only non-web files changed

**Rationale:** Users get `latest` for bleeding edge, semver tags for stability.

## Risks / Trade-offs

**[Risk] WASM build is slow (~3-5 min)** → Mitigate with aggressive caching. Only rebuild when Cargo.lock or crates/ change. Use GitHub Actions cache for Cargo registry.

**[Risk] Large intermediate images consume CI storage** → Use `--squash` or multi-stage to discard intermediate layers. Set cache retention policy.

**[Risk] Base path conflicts with user reverse proxy** → Document the expected paths. Provide `BASE_PATH` env var for customization (requires rebuild).

**[Trade-off] No ARM64 support initially** → Start with amd64 only. Add multi-arch manifest when there's demand (requires QEMU in CI, slower builds).

**[Trade-off] No hot-reload in container** → Container is for production serving, not development. Document this clearly.
