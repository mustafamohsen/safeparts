# Safeparts Mobile (Expo)

This is the iOS/Android mobile app for Safeparts.

## Directory layout

- `mobile/`: Expo app (React Native)
- `mobile/src/`: app code

Native/Rust bridge code will live alongside the app (still local-only, no backend).

## Local development

Prereqs:

- Node.js (Expo requires Node)
- Bun (repo default)
- Rust toolchain (`cargo` via `rustup`)
- Xcode + iOS Simulator runtime
- CocoaPods (`pod`) and Watchman
- Android Studio (Android emulator), plus devices as needed

iOS Rust targets (one-time):

- `rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios`

Install dependencies:

- `bun install`

Note: This app includes a local native module (`mobile/modules/safeparts-core`), so it will not run in Expo Go.

If `pod` crashes with a Ruby `Logger` error on macOS, run iOS commands with `RUBYOPT=-rlogger`.

Run dev server:

- `bun run start`

Open on a simulator/emulator:

- iOS: `bun run ios`
- Android: `bunx expo run:android`

Project checks:

- Expo doctor: `bun run doctor`
- Reinstall pods: `bun run pods:install`

## Building

Store builds use EAS:

- `bunx eas build --profile production --platform all`

## App identifiers

Current placeholders (update before store submission):

- iOS bundle id: `com.safeparts.mobile`
- Android package: `com.safeparts.mobile`
