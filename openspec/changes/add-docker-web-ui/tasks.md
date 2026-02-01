## 1. Dockerfile

- [x] 1.1 Create `web/Dockerfile` with multi-stage build (rust-builder, wasm-builder, web-builder, runtime stages)
- [x] 1.2 Configure rust-builder stage: install Rust toolchain, wasm-pack, wasm-bindgen-cli with version pinning
- [x] 1.3 Configure wasm-builder stage: build WASM from crates/safeparts_wasm
- [x] 1.4 Configure web-builder stage: install Bun, build web app and docs
- [x] 1.5 Configure runtime stage: nginx:alpine base with static file copy
- [x] 1.6 Add `.dockerignore` to exclude unnecessary files (target/, node_modules/, .git/)

## 2. Nginx Configuration

- [x] 2.1 Create `web/nginx.conf` with SPA routing (try_files for React router)
- [x] 2.2 Configure /help/ location for Starlight docs
- [x] 2.3 Add security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [x] 2.4 Configure caching headers for static assets

## 3. CI Workflow

- [x] 3.1 Create `.github/workflows/docker-publish.yml` workflow file
- [x] 3.2 Configure path filters to trigger only on relevant changes (web/, crates/, Dockerfile)
- [x] 3.3 Configure triggers for push to main and release tags
- [x] 3.4 Add Docker layer caching using GitHub Actions cache
- [x] 3.5 Add Cargo registry caching
- [x] 3.6 Configure image tagging: latest, sha-<commit>, vX.Y.Z for releases
- [x] 3.7 Add OCI metadata labels (source, version, description)
- [x] 3.8 Push to ghcr.io/mustafamohsen/safeparts

## 4. Testing

- [x] 4.1 Test local Docker build from repository root
- [x] 4.2 Verify web UI loads and WASM initializes in container
- [x] 4.3 Verify /help/ documentation site loads
- [x] 4.4 Verify SPA routing works (deep links return index.html)
- [x] 4.5 Verify final image size is under 50MB

## 5. Documentation

- [x] 5.1 Add Docker section to README.md with quick-start commands
- [x] 5.2 Add Docker tab/section to web/help/src/content/docs/build-and-run.mdx
- [x] 5.3 Document available tags (latest, version tags)
- [x] 5.4 Document environment variables or configuration options (if any)
