#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MACOS="$ROOT/macos"
cd "$ROOT"
cargo build -p safeparts_swift
mkdir -p "$MACOS/Generated" "$MACOS/Native"
cp "$ROOT/target/debug/libsafeparts_swift.a" "$MACOS/Native/"
cargo run -q -p safeparts_swift --bin uniffi-bindgen -- generate --library "$ROOT/target/debug/libsafeparts_swift.dylib" --language swift --out-dir "$MACOS/Generated"
cp "$MACOS/Generated/safeparts_swiftFFI.modulemap" "$MACOS/Generated/module.modulemap"
cp "$MACOS/Generated/safeparts_swift.swift" "$MACOS/Sources/SafepartsKit/Generated.swift"
echo 'Prepared native bridge. Run swift build or swift test from macos/.'
