#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <Safeparts.app> <version>" >&2
  exit 2
fi

APP="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
VERSION="${2#v}"
EXECUTABLE="$APP/Contents/MacOS/SafepartsMac"
PLIST="$APP/Contents/Info.plist"
RESOURCE_BUNDLE="$APP/SafepartsMac_SafepartsMac.bundle"

fail() {
  echo "native macOS release validation failed: $*" >&2
  exit 1
}

[ -d "$APP" ] || fail "missing app bundle: $APP"
[ -x "$EXECUTABLE" ] || fail "missing executable: $EXECUTABLE"
[ -f "$PLIST" ] || fail "missing Info.plist"
[ -f "$APP/Contents/Resources/AppIcon.icns" ] || fail "missing AppIcon.icns"
[ -f "$RESOURCE_BUNDLE/safeparts-logo.png" ] || fail "missing SwiftPM logo resource bundle"

plutil -lint "$PLIST" >/dev/null
plist_value() {
  /usr/libexec/PlistBuddy -c "Print :$1" "$PLIST"
}

[ "$(plist_value CFBundleExecutable)" = "SafepartsMac" ] || fail "wrong CFBundleExecutable"
[ "$(plist_value CFBundleIdentifier)" = "app.safeparts.macos" ] || fail "wrong bundle identifier"
[ "$(plist_value CFBundlePackageType)" = "APPL" ] || fail "wrong bundle package type"
[ "$(plist_value CFBundleShortVersionString)" = "$VERSION" ] || fail "wrong release version"
EXPECTED_BUILD="$(python3 - "$VERSION" <<'PY'
import sys
major, minor, patch = (int(part) for part in sys.argv[1].split("."))
print(major * 10000 + minor * 100 + patch)
PY
)"
[ "$(plist_value CFBundleVersion)" = "$EXPECTED_BUILD" ] || fail "wrong bundle build number"
[ "$(plist_value CFBundleIconFile)" = "AppIcon" ] || fail "wrong app icon metadata"
[ "$(plist_value LSMinimumSystemVersion)" = "14.0" ] || fail "wrong plist deployment target"

ARCHS="$(lipo -archs "$EXECUTABLE" | tr ' ' '\n' | sort | paste -sd ' ' -)"
[ "$ARCHS" = "arm64 x86_64" ] || fail "expected arm64 and x86_64 slices, got: $ARCHS"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
for ARCH in arm64 x86_64; do
  THIN="$WORK/SafepartsMac-$ARCH"
  lipo "$EXECUTABLE" -thin "$ARCH" -output "$THIN"

  BUILD_INFO="$(xcrun vtool -show-build "$THIN")"
  grep -Eq 'platform MACOS$' <<<"$BUILD_INFO" || fail "$ARCH slice is not a macOS binary"
  grep -Eq 'minos 14([.]0)?$' <<<"$BUILD_INFO" || fail "$ARCH slice does not target macOS 14.0"

  LINKED="$WORK/linked-$ARCH.txt"
  otool -L "$THIN" | tail -n +2 >"$LINKED"
  if grep -q 'libsafeparts_uniffi[.]dylib' "$LINKED"; then
    fail "$ARCH slice dynamically links the Rust bridge"
  fi
  if grep -Eq '(@rpath|/Users/|/opt/homebrew/|/usr/local/|/runner/)' "$LINKED"; then
    fail "$ARCH slice contains a non-system dynamic dependency"
  fi

  SYMBOLS="$WORK/symbols-$ARCH.txt"
  nm "$THIN" >"$SYMBOLS"
  grep -q 'uniffi_safeparts_uniffi' "$SYMBOLS" || fail "$ARCH slice lacks UniFFI bridge symbols"
done

if find "$APP" -type f -name '*.dylib' -print -quit | grep -q .; then
  fail "app bundle contains a dynamic library"
fi

SIGN_INFO="$(codesign -dvv "$APP" 2>&1 || true)"
if grep -q '^Authority=' <<<"$SIGN_INFO"; then
  fail "expected an unsigned/ad-hoc release, but a signing authority is present"
fi

if xattr -p com.apple.quarantine "$APP" >/dev/null 2>&1; then
  fail "app bundle carries a quarantine attribute before distribution"
fi

echo "Verified unsigned universal Safeparts.app $VERSION for macOS 14.0+."
