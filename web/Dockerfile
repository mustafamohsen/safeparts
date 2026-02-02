# Multi-stage Dockerfile for Safeparts Web UI + Docs
# Optimized for layer caching and minimal final image size

# Stage 1: Rust builder - install toolchain and build dependencies
# Using nightly for edition 2024 support (required by some dependencies)
FROM rustlang/rust:nightly-bookworm AS rust-builder

# Install system dependencies for WASM tooling
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Add wasm32 target
RUN rustup target add wasm32-unknown-unknown

# Install wasm-pack and wasm-bindgen-cli with pinned versions
RUN cargo install wasm-pack --locked --version 0.13.1
RUN cargo install wasm-bindgen-cli --locked --version 0.2.108

# Stage 2: WASM builder - build the WASM module
FROM rust-builder AS wasm-builder

WORKDIR /build

# Copy only Cargo files first for dependency caching
COPY Cargo.toml Cargo.lock ./
COPY crates/safeparts_core/Cargo.toml ./crates/safeparts_core/
COPY crates/safeparts/Cargo.toml ./crates/safeparts/
COPY crates/safeparts_wasm/Cargo.toml ./crates/safeparts_wasm/

# Create dummy source files to cache dependencies
RUN mkdir -p crates/safeparts_core/src && echo "fn main() {}" > crates/safeparts_core/src/lib.rs
RUN mkdir -p crates/safeparts/src && echo "fn main() {}" > crates/safeparts/src/main.rs
RUN mkdir -p crates/safeparts_wasm/src && echo "fn main() {}" > crates/safeparts_wasm/src/lib.rs

# Build dependencies (this layer will be cached)
RUN cargo build --release -p safeparts_wasm --target wasm32-unknown-unknown || true

# Copy actual source code
COPY crates ./crates

# Build WASM package
RUN wasm-pack build crates/safeparts_wasm \
    --mode no-install \
    --target web \
    --out-dir /build/wasm_pkg

# Stage 3: Web builder - build web app and docs
FROM oven/bun:1.3-alpine AS web-builder

WORKDIR /build/web

# Copy web package files for dependency caching
COPY web/package.json web/bun.lock* ./
RUN bun install --frozen-lockfile

# Copy help (docs) package files
COPY web/help/package.json web/help/bun.lock* ./help/
RUN cd help && bun install --frozen-lockfile

# Copy WASM build from previous stage
COPY --from=wasm-builder /build/wasm_pkg ./src/wasm_pkg

# Copy web source code
COPY web/ ./

# Build web app
RUN bun run build

# Build docs site (outputs to ../dist/help)
RUN cd help && bun run build

# Stage 4: Runtime - nginx serving static files
FROM nginx:1.27-alpine AS runtime

# Copy custom nginx configuration
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built web app
COPY --from=web-builder /build/web/dist /usr/share/nginx/html

# Copy built docs to /help path
COPY --from=web-builder /build/web/dist/help /usr/share/nginx/html/help

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
