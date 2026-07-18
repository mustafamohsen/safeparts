#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BIN_DIR="$(swift build --package-path "$ROOT/macos" --show-bin-path)"
EXECUTABLE="$BIN_DIR/SafepartsMac"

BUILD_INFO="$(xcrun vtool -show-build "$EXECUTABLE")"
if ! grep -Eq 'minos 14([.]0)?$' <<<"$BUILD_INFO"; then
  echo "SafepartsMac does not declare macOS 14.0 as its minimum deployment target" >&2
  exit 1
fi

LINKED_LIBRARIES="$(otool -L "$EXECUTABLE")"
if grep -q 'libsafeparts_swift[.]dylib' <<<"$LINKED_LIBRARIES"; then
  echo "SafepartsMac links the dynamic Rust bridge instead of the static library" >&2
  exit 1
fi
SYMBOLS="$(nm "$EXECUTABLE")"
if ! grep -q 'uniffi_safeparts_swift' <<<"$SYMBOLS"; then
  echo "SafepartsMac does not contain the statically linked Rust bridge symbols" >&2
  exit 1
fi

echo "Verified macOS 14.0 deployment target and static Rust bridge linkage."
