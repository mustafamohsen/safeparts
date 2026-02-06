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
- Xcode (iOS simulator) and/or Android Studio (Android emulator), plus devices as needed

Install dependencies:

- `bun install`

Note: This app includes a local native module (`mobile/modules/safeparts-core`), so it will not run in Expo Go.

Run dev server:

- `bun run start`

Open on a simulator/emulator:

- iOS: `bunx expo run:ios`
- Android: `bunx expo run:android`

## Building

Store builds use EAS:

- `bunx eas build --profile production --platform all`

## App identifiers

Current placeholders (update before store submission):

- iOS bundle id: `com.safeparts.mobile`
- Android package: `com.safeparts.mobile`
