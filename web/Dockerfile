# syntax=docker/dockerfile:1.7

# Build a self-contained image that serves the Safeparts Web UI.
#
# Usage:
#   docker build -t safeparts-webui -f web/Dockerfile .
#   docker run --rm -p 8080:8080 safeparts-webui

ARG RUST_IMAGE=rust:1-slim-bookworm
ARG BUN_IMAGE=oven/bun:1-alpine
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.27-alpine

ARG WASM_PACK_VERSION=0.13.1
ARG WASM_BINDGEN_CLI_VERSION=0.2.108

FROM ${RUST_IMAGE} AS rust-tools

ARG WASM_PACK_VERSION
ARG WASM_BINDGEN_CLI_VERSION

WORKDIR /work

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      pkg-config \
      libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32-unknown-unknown

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    cargo install wasm-pack --locked --version ${WASM_PACK_VERSION}

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    cargo install wasm-bindgen-cli --locked --version ${WASM_BINDGEN_CLI_VERSION}

FROM rust-tools AS wasm-builder

WORKDIR /work

# Copy only manifests first to maximize cache hits.
COPY Cargo.toml Cargo.lock ./
COPY crates/safeparts_core/Cargo.toml ./crates/safeparts_core/Cargo.toml
COPY crates/safeparts/Cargo.toml ./crates/safeparts/Cargo.toml
COPY crates/safeparts_wasm/Cargo.toml ./crates/safeparts_wasm/Cargo.toml
COPY crates/safeparts_tui/Cargo.toml ./crates/safeparts_tui/Cargo.toml

# Create minimal sources so we can cache dependencies.
RUN mkdir -p \
      crates/safeparts_core/src \
      crates/safeparts/src \
      crates/safeparts_wasm/src \
      crates/safeparts_tui/src \
    && printf 'pub fn _docker_dummy() {}\n' > crates/safeparts_core/src/lib.rs \
    && printf 'fn main() {}\n' > crates/safeparts/src/main.rs \
    && printf 'use wasm_bindgen::prelude::*;\n#[wasm_bindgen]\npub fn _docker_dummy() {}\n' > crates/safeparts_wasm/src/lib.rs \
    && printf 'fn main() {}\n' > crates/safeparts_tui/src/main.rs

RUN --mount=type=cache,target=/work/target \
    --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    cargo build -p safeparts_wasm --release --target wasm32-unknown-unknown || true

# Copy real sources and build the WASM package.
COPY crates ./crates

RUN --mount=type=cache,target=/work/target \
    --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    wasm-pack build crates/safeparts_wasm \
      --mode no-install \
      --target web \
      --release \
      --out-dir /out/wasm_pkg

FROM ${BUN_IMAGE} AS web-builder

WORKDIR /work/web

COPY web/package.json web/bun.lock ./
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

# Cache docs (help) dependencies separately.
COPY web/help/package.json web/help/bun.lock ./help/
RUN --mount=type=cache,target=/root/.bun \
    cd help && bun install --frozen-lockfile

COPY web/ ./
COPY --from=wasm-builder /out/wasm_pkg ./src/wasm_pkg

RUN bun run build
RUN cd help && bun run build

FROM ${NGINX_IMAGE} AS runtime

COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-builder /work/web/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

EXPOSE 8080
