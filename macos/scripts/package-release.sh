#!/bin/bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "usage: $0 <version> [output-directory]" >&2
  exit 2
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MACOS="$ROOT/macos"
VERSION="${1#v}"
OUT_DIR="${2:-$ROOT/dist/release}"
WORK="$ROOT/target/native-macos-release"
DEPLOYMENT_TARGET=14.0
APP_NAME=Safeparts.app
DMG_NAME="safeparts-native-macos-universal-$VERSION.dmg"
RUST_TARGETS=(aarch64-apple-darwin x86_64-apple-darwin)
SWIFT_ARCHES=(arm64 x86_64)

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "version must use major.minor.patch form (for example v0.2.0)" >&2
  exit 2
fi

if [ "$(uname -s)" != Darwin ]; then
  echo "native macOS release packaging requires macOS" >&2
  exit 1
fi

for COMMAND in cargo rustc rustup swift lipo iconutil sips hdiutil plutil ditto xattr; do
  command -v "$COMMAND" >/dev/null || {
    echo "missing required command: $COMMAND" >&2
    exit 1
  }
done

OUT_DIR="$(mkdir -p "$OUT_DIR" && cd "$OUT_DIR" && pwd)"
rm -rf "$WORK"
mkdir -p "$WORK/cargo" "$WORK/generated" "$WORK/packages" "$WORK/swift" "$WORK/app"

for TARGET in "${RUST_TARGETS[@]}"; do
  rustup target add "$TARGET"
done

cd "$ROOT"
for TARGET in "${RUST_TARGETS[@]}"; do
  echo "Building Rust bridge for $TARGET..."
  MACOSX_DEPLOYMENT_TARGET="$DEPLOYMENT_TARGET" \
    CARGO_TARGET_DIR="$WORK/cargo" \
    cargo build --locked --release -p safeparts_uniffi --target "$TARGET"
done

HOST_TARGET="$(rustc -vV | awk '/^host: / { print $2 }')"
case "$HOST_TARGET" in
  aarch64-apple-darwin|x86_64-apple-darwin) ;;
  *)
    echo "unsupported Rust host for UniFFI generation: $HOST_TARGET" >&2
    exit 1
    ;;
esac

HOST_DYLIB="$WORK/cargo/$HOST_TARGET/release/libsafeparts_uniffi.dylib"
CARGO_TARGET_DIR="$WORK/tools" cargo run --locked -q -p safeparts_uniffi --bin uniffi-bindgen -- \
  generate \
  --library "$HOST_DYLIB" \
  --language swift \
  --out-dir "$WORK/generated"
cp "$WORK/generated/safeparts_uniffiFFI.modulemap" "$WORK/generated/module.modulemap"

python3 - "$WORK/generated" <<'PY'
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
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

for FILE in safeparts_uniffi.swift safeparts_uniffiFFI.h safeparts_uniffiFFI.modulemap module.modulemap; do
  cmp "$WORK/generated/$FILE" "$MACOS/Generated/$FILE"
done
cmp "$WORK/generated/safeparts_uniffi.swift" "$MACOS/Sources/SafepartsKit/Generated.swift"

BINARIES=()
RESOURCE_BUNDLES=()
for INDEX in 0 1; do
  RUST_TARGET="${RUST_TARGETS[$INDEX]}"
  SWIFT_ARCH="${SWIFT_ARCHES[$INDEX]}"
  PACKAGE_STAGE="$WORK/packages/$SWIFT_ARCH"
  SCRATCH="$WORK/swift/$SWIFT_ARCH"
  SWIFT_TRIPLE="$SWIFT_ARCH-apple-macosx$DEPLOYMENT_TARGET"

  mkdir -p "$PACKAGE_STAGE/Native"
  cp "$MACOS/Package.swift" "$PACKAGE_STAGE/Package.swift"
  ditto "$MACOS/Generated" "$PACKAGE_STAGE/Generated"
  ditto "$MACOS/Sources" "$PACKAGE_STAGE/Sources"
  ditto "$MACOS/Tests" "$PACKAGE_STAGE/Tests"
  cp "$WORK/cargo/$RUST_TARGET/release/libsafeparts_uniffi.a" "$PACKAGE_STAGE/Native/"

  echo "Building Swift app for $SWIFT_ARCH..."
  MACOSX_DEPLOYMENT_TARGET="$DEPLOYMENT_TARGET" swift build \
    --package-path "$PACKAGE_STAGE" \
    --configuration release \
    --triple "$SWIFT_TRIPLE" \
    --scratch-path "$SCRATCH"

  BIN_DIR="$(MACOSX_DEPLOYMENT_TARGET="$DEPLOYMENT_TARGET" swift build \
    --package-path "$PACKAGE_STAGE" \
    --configuration release \
    --triple "$SWIFT_TRIPLE" \
    --scratch-path "$SCRATCH" \
    --show-bin-path)"
  BINARIES+=("$BIN_DIR/SafepartsMac")
  RESOURCE_BUNDLES+=("$BIN_DIR/SafepartsMac_SafepartsMac.bundle")

done

diff -qr "${RESOURCE_BUNDLES[0]}" "${RESOURCE_BUNDLES[1]}"

APP="$WORK/app/$APP_NAME"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
lipo -create "${BINARIES[0]}" "${BINARIES[1]}" -output "$APP/Contents/MacOS/SafepartsMac"
chmod 0755 "$APP/Contents/MacOS/SafepartsMac"
ditto "${RESOURCE_BUNDLES[0]}" "$APP/SafepartsMac_SafepartsMac.bundle"

ICONSET="$WORK/AppIcon.iconset"
mkdir -p "$ICONSET"
ICON_SOURCE="$MACOS/Sources/SafepartsMac/Resources/AppIcon.png"
while read -r NAME SIZE; do
  sips -z "$SIZE" "$SIZE" "$ICON_SOURCE" --out "$ICONSET/$NAME" >/dev/null
done <<'SIZES'
icon_16x16.png 16
icon_16x16@2x.png 32
icon_32x32.png 32
icon_32x32@2x.png 64
icon_128x128.png 128
icon_128x128@2x.png 256
icon_256x256.png 256
icon_256x256@2x.png 512
icon_512x512.png 512
icon_512x512@2x.png 1024
SIZES
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

BUILD_NUMBER="$(python3 - "$VERSION" <<'PY'
import sys
major, minor, patch = (int(part) for part in sys.argv[1].split("."))
print(major * 10000 + minor * 100 + patch)
PY
)"
python3 - "$MACOS/Release/Info.plist.in" "$APP/Contents/Info.plist" "$VERSION" "$BUILD_NUMBER" <<'PY'
from pathlib import Path
import sys

source, destination, version, build = sys.argv[1:]
text = Path(source).read_text(encoding="utf-8")
text = text.replace("@VERSION@", version).replace("@BUILD_NUMBER@", build)
Path(destination).write_text(text, encoding="utf-8")
PY

chmod -R u+rwX,go+rX "$APP"
xattr -cr "$APP"
"$MACOS/scripts/validate-release.sh" "$APP" "$VERSION"

DMG_STAGE="$WORK/dmg-root"
mkdir -p "$DMG_STAGE"
ditto "$APP" "$DMG_STAGE/$APP_NAME"
ln -s /Applications "$DMG_STAGE/Applications"
if [ -f "$ROOT/LICENSE" ]; then
  cp "$ROOT/LICENSE" "$DMG_STAGE/LICENSE"
fi

DMG="$OUT_DIR/$DMG_NAME"
rm -f "$DMG"
hdiutil create \
  -volname "Safeparts $VERSION" \
  -srcfolder "$DMG_STAGE" \
  -fs HFS+ \
  -format UDZO \
  -imagekey zlib-level=9 \
  -ov \
  "$DMG" >/dev/null
hdiutil verify "$DMG" >/dev/null

MOUNT_POINT="$WORK/mount"
mkdir -p "$MOUNT_POINT"
cleanup_mount() {
  if mount | grep -Fq "on $MOUNT_POINT "; then
    hdiutil detach "$MOUNT_POINT" -force >/dev/null || true
  fi
}
trap cleanup_mount EXIT
hdiutil attach -readonly -nobrowse -mountpoint "$MOUNT_POINT" "$DMG" >/dev/null
"$MACOS/scripts/validate-release.sh" "$MOUNT_POINT/$APP_NAME" "$VERSION"
hdiutil detach "$MOUNT_POINT" >/dev/null
trap - EXIT

printf '%s\n' "$DMG"
