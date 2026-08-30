#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

browser_args=(--headless --chrome)
if [[ -n "${CHROMEDRIVER:-}" ]]; then
  browser_args+=(--chromedriver "$CHROMEDRIVER")
fi

wasm-pack test "${browser_args[@]}" ../crates/safeparts_wasm
