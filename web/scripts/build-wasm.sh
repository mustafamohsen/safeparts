#!/usr/bin/env bash
set -euo pipefail

WASM_PACK_VERSION="0.15.0"
WASM_BINDGEN_VERSION="0.2.108"

export PATH="$HOME/.cargo/bin:$PATH"

if ! command -v rustup >/dev/null 2>&1; then
  echo "error: rustup is required; install the pinned project tools with 'mise install'" >&2
  exit 1
fi

rustup target add wasm32-unknown-unknown

if ! command -v wasm-pack >/dev/null 2>&1 || ! wasm-pack --version | grep -q "wasm-pack ${WASM_PACK_VERSION}"; then
  cargo install wasm-pack --locked --version "$WASM_PACK_VERSION" --force
fi

if ! command -v wasm-bindgen >/dev/null 2>&1 || ! wasm-bindgen --version | grep -q "wasm-bindgen ${WASM_BINDGEN_VERSION}"; then
  cargo install wasm-bindgen-cli --locked --version "$WASM_BINDGEN_VERSION" --force
fi

wasm-pack build ../crates/safeparts_wasm --mode no-install --target web --out-dir ../../web/src/wasm_pkg
