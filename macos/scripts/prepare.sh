#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MACOS="$ROOT/macos"
export MACOSX_DEPLOYMENT_TARGET="${MACOSX_DEPLOYMENT_TARGET:-14.0}"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT/target/macos-host}"
LIB_DIR="$CARGO_TARGET_DIR/debug"

cd "$ROOT"
cargo build -p safeparts_swift

mkdir -p "$MACOS/Generated" "$MACOS/Native"
cp "$LIB_DIR/libsafeparts_swift.a" "$MACOS/Native/"

cargo run -q -p safeparts_swift --bin uniffi-bindgen -- \
  generate \
  --library "$LIB_DIR/libsafeparts_swift.dylib" \
  --language swift \
  --out-dir "$MACOS/Generated"

cp "$MACOS/Generated/safeparts_swiftFFI.modulemap" "$MACOS/Generated/module.modulemap"

# UniFFI output can contain trailing spaces. Normalize generated text so commits
# remain reviewable and `git diff --check` is useful for the whole repository.
python3 - "$MACOS/Generated" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
for path in root.iterdir():
    if not path.is_file():
        continue
    text = path.read_text(encoding="utf-8")
    lines = [line.rstrip() for line in text.splitlines()]
    while lines and not lines[-1]:
        lines.pop()
    normalized = "\n".join(lines) + "\n"
    path.write_text(normalized, encoding="utf-8")
PY

cp "$MACOS/Generated/safeparts_swift.swift" "$MACOS/Sources/SafepartsKit/Generated.swift"
cmp "$MACOS/Generated/safeparts_swift.swift" "$MACOS/Sources/SafepartsKit/Generated.swift"

echo "Prepared the native bridge for macOS ${MACOSX_DEPLOYMENT_TARGET} in $CARGO_TARGET_DIR."
echo "Run swift build or swift test from macos/."
