#!/usr/bin/env bash
set -euo pipefail

WASM_PACK_VERSION="0.15.0"
WASM_BINDGEN_VERSION="0.2.108"

export PATH="$HOME/.cargo/bin:$PATH"

if ! command -v rustup >/dev/null 2>&1; then
  curl https://sh.rustup.rs -sSf | sh -s -- -y
fi

if [ -f "$HOME/.cargo/env" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.cargo/env"
fi

rustup target add wasm32-unknown-unknown

install_wasm_pack_binary() {
  local os arch target tmpdir url archive_dir
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os:$arch" in
    Darwin:arm64) target="aarch64-apple-darwin" ;;
    Darwin:x86_64) target="x86_64-apple-darwin" ;;
    Linux:x86_64) target="x86_64-unknown-linux-musl" ;;
    Linux:aarch64|Linux:arm64) target="aarch64-unknown-linux-musl" ;;
    *) return 1 ;;
  esac

  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' RETURN

  url="https://github.com/wasm-bindgen/wasm-pack/releases/download/v${WASM_PACK_VERSION}/wasm-pack-v${WASM_PACK_VERSION}-${target}.tar.gz"
  curl -L --fail -o "$tmpdir/wasm-pack.tar.gz" "$url"
  tar -xzf "$tmpdir/wasm-pack.tar.gz" -C "$tmpdir"
  archive_dir="$tmpdir/wasm-pack-v${WASM_PACK_VERSION}-${target}"
  mkdir -p "$HOME/.cargo/bin"
  cp "$archive_dir/wasm-pack" "$HOME/.cargo/bin/wasm-pack"
  chmod +x "$HOME/.cargo/bin/wasm-pack"
}

if ! command -v wasm-pack >/dev/null 2>&1 || ! wasm-pack --version | grep -q "wasm-pack ${WASM_PACK_VERSION}"; then
  install_wasm_pack_binary || cargo install wasm-pack --locked --version "$WASM_PACK_VERSION" --force
fi

if ! command -v wasm-bindgen >/dev/null 2>&1; then
  cargo install wasm-bindgen-cli --version "$WASM_BINDGEN_VERSION" --locked
fi

wasm-pack build ../crates/safeparts_wasm --mode no-install --target web --out-dir ../../web/src/wasm_pkg
