## Why

Safeparts is currently easiest to use on desktop (CLI/TUI) or in a browser (Web UI). A first-class mobile app makes the tool accessible in the most common “in-hand” context for personal secrets, while keeping everything offline-first and local-only.

## What Changes

- Add an iOS/Android mobile app built with Expo (React Native) under `mobile/`.
- Provide Split/Combine feature parity with existing surfaces (encodings, passphrase protection, auto-detection, copy/share, file import/export equivalents) with a lightweight, native-feeling UI.
- Add camera-based QR scanning for importing shares (and QR rendering for exporting shares) to make recovery faster and less error-prone.
- Bundle the help/docs content for offline access inside the app (English + Arabic, RTL-safe).
- Add mobile CI (gated by path filters) and a tag-based release pipeline that builds and submits to App Store Connect and Google Play, with signing gated on credentials.

## Capabilities

### New Capabilities

- `expo-mobile-app`: Expo-based iOS/Android application surface and local dev workflow.
- `mobile-core-bridge`: Mobile-native bridge that runs `safeparts_core` locally for split/combine (no network, high performance).
- `mobile-ui-parity`: Mobile UX parity for Split/Combine (all encodings, passphrase flows, clipboard/share, file import/export equivalents, no secret persistence).
- `mobile-qr-scanning`: QR export + camera QR import for shares, optimized for multi-scan recovery flows.
- `mobile-offline-help`: Offline in-app help/docs access (English + Arabic) without opening an external browser.
- `mobile-ci-release`: Mobile CI gates plus store build/submit automation for iOS/Android.

### Modified Capabilities

<!-- None. -->

## Impact

- Repo structure: add `mobile/` (Expo project) and a mobile binding/bridge layer for `safeparts_core`.
- Tooling: introduce mobile dependency management (Expo + EAS) and native build configuration (iOS/Android).
- CI/release: new workflows and/or extensions to existing release workflows for EAS build + store submission.
- Security: ensure no secrets/shares/passphrases are logged or persisted; keep all operations offline and local-only.
