package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SafepartsCore'
  s.version        = package['version']
  s.summary        = 'Safeparts core bridge (UniFFI + Expo Modules)'
  s.description    = 'Safeparts core bridge (UniFFI + Expo Modules)'
  s.license        = 'MIT'
  s.author         = 'Safeparts Contributors'
  s.homepage       = 'https://github.com/'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'LIBRARY_SEARCH_PATHS' => '$(inherited) "${PODS_TARGET_SRCROOT}/rust-libs/${PLATFORM_NAME}"',
    'OTHER_LDFLAGS' => '$(inherited) -force_load "${PODS_TARGET_SRCROOT}/rust-libs/${PLATFORM_NAME}/libsafeparts_mobile_bridge.a"'
  }

  s.user_target_xcconfig = {
    'LIBRARY_SEARCH_PATHS' => '$(inherited) "${PODS_ROOT}/../../modules/safeparts-core/ios/rust-libs/${PLATFORM_NAME}"',
    'OTHER_LDFLAGS' => '$(inherited) -force_load "${PODS_ROOT}/../../modules/safeparts-core/ios/rust-libs/${PLATFORM_NAME}/libsafeparts_mobile_bridge.a"'
  }

  s.script_phases = [
    {
      :name => 'Build safeparts_mobile_bridge (Rust)',
      :execution_position => :before_compile,
      :input_files => [
        '${PODS_TARGET_SRCROOT}/../../../src-native/Cargo.toml',
        '${PODS_TARGET_SRCROOT}/../../../src-native/src/lib.rs',
        '${PODS_TARGET_SRCROOT}/../../../src-native/src/safeparts_mobile_bridge.udl'
      ],
      :output_files => [
        '${PODS_TARGET_SRCROOT}/rust-libs/${PLATFORM_NAME}/libsafeparts_mobile_bridge.a'
      ],
      :shell_path => '/bin/sh',
      :script => <<-'SCRIPT'
set -euo pipefail

if [ -z "${PODS_TARGET_SRCROOT:-}" ] || [ -z "${PLATFORM_NAME:-}" ] || [ -z "${CURRENT_ARCH:-}" ]; then
  echo "Missing expected CocoaPods build environment variables"
  exit 1
fi

export PATH="$HOME/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v cargo >/dev/null 2>&1; then
  echo "cargo not found in PATH; install Rust from https://rustup.rs"
  exit 1
fi

SRC_NATIVE_DIR="${PODS_TARGET_SRCROOT}/../../../src-native"
MANIFEST_PATH="${SRC_NATIVE_DIR}/Cargo.toml"
OUT_DIR="${PODS_TARGET_SRCROOT}/rust-libs/${PLATFORM_NAME}"
mkdir -p "$OUT_DIR"

export IPHONEOS_DEPLOYMENT_TARGET="${IPHONEOS_DEPLOYMENT_TARGET:-15.1}"

if [ "$PLATFORM_NAME" = "iphoneos" ]; then
  export CFLAGS_aarch64_apple_ios="-miphoneos-version-min=${IPHONEOS_DEPLOYMENT_TARGET}"
  export RUSTFLAGS="-C link-arg=-miphoneos-version-min=${IPHONEOS_DEPLOYMENT_TARGET}"
  cargo build --manifest-path "$MANIFEST_PATH" --release --target aarch64-apple-ios
  cp "${SRC_NATIVE_DIR}/target/aarch64-apple-ios/release/libsafeparts_mobile_bridge.a" "$OUT_DIR/"
elif [ "$PLATFORM_NAME" = "iphonesimulator" ]; then
  export CFLAGS_aarch64_apple_ios_sim="-mios-simulator-version-min=${IPHONEOS_DEPLOYMENT_TARGET}"
  export CFLAGS_x86_64_apple_ios="-mios-simulator-version-min=${IPHONEOS_DEPLOYMENT_TARGET}"
  export RUSTFLAGS="-C link-arg=-mios-simulator-version-min=${IPHONEOS_DEPLOYMENT_TARGET}"
  cargo build --manifest-path "$MANIFEST_PATH" --release --target aarch64-apple-ios-sim
  cargo build --manifest-path "$MANIFEST_PATH" --release --target x86_64-apple-ios
  lipo -create \
    "${SRC_NATIVE_DIR}/target/aarch64-apple-ios-sim/release/libsafeparts_mobile_bridge.a" \
    "${SRC_NATIVE_DIR}/target/x86_64-apple-ios/release/libsafeparts_mobile_bridge.a" \
    -output "${OUT_DIR}/libsafeparts_mobile_bridge.a"
else
  echo "Unsupported PLATFORM_NAME: $PLATFORM_NAME"
  exit 1
fi
SCRIPT
    }
  ]

  s.source_files = "**/*.{h,m,swift}"
end
