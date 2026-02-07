## 1. Setup and Repo Structure

- [x] 1.1 Create feature branch `feat/expo-mobile-app`
- [x] 1.2 Decide mobile app directory layout (target: `mobile/`) and document the choice
- [x] 1.3 Define mobile app identifiers (iOS bundle id, Android application id) and store metadata placeholders
- [x] 1.4 Add documented local dev commands for running the mobile app (device + simulator)

## 2. Toolchain Spike (Expo + Rust Bridge)

- [x] 2.1 Pick bridging strategy (Expo Module + Rust library) and document build approach for iOS/Android
- [x] 2.2 Implement a minimal spike: call `safeparts_core` from mobile to split/combine a small secret
- [x] 2.3 Decide JS/native wire format for bytes (base64 strings vs number arrays) and document it

## 3. Mobile Core Bridge (safeparts_core)

- [x] 3.1 Create the mobile bridge module/crate boundary and expose `supported_encodings`
- [x] 3.2 Expose `split_secret` with passphrase support and no secret logging
- [x] 3.3 Expose `combine_shares` with passphrase support and actionable error mapping
- [x] 3.4 Ensure sensitive buffers/passphrases are cleared/zeroized where practical
- [x] 3.5 Add bridge-level unit tests for encoding parity and passphrase error flows
- [x] 3.6 Add UniFFI interface and generate iOS/Android bindings
- [x] 3.7 Wrap UniFFI bindings in an Expo native module (Swift + Kotlin)
- [x] 3.8 Wire the mobile UI to call the native module (no host-only FFI)

## 4. Mobile UI (Split/Combine Parity)

- [x] 4.1 Scaffold Expo app UI shell with Split/Combine navigation
- [x] 4.2 Implement Split screen: secret input, k/n, encoding selector, passphrase, shares output
- [x] 4.3 Implement Combine screen: share inputs, encoding selector + auto-detect, passphrase, recovered output
- [x] 4.4 Implement Copy + platform Share actions for shares and recovered secret
- [x] 4.5 Add file import/export equivalents (document picker + share sheet) without secret persistence by default

## 5. Camera + QR

- [x] 5.1 Add QR rendering for each share (with fallback when payload is too large)
- [x] 5.2 Add Combine “Scan QR” flow that appends scanned shares
- [x] 5.3 Support rapid multi-scan (stay in scanner until user exits) and de-duplicate scans
- [x] 5.4 Add clear permission UX and localized camera/scan strings (English + Arabic)

## 7. Localization, RTL Safety, Accessibility, and Polish

- [x] 7.1 Localize all mobile UI strings (English + Arabic)
- [x] 7.2 Ensure correct RTL/LTR behavior and bidi-safe token rendering for shares and code-like strings
- [x] 7.3 Ensure touch targets meet minimum size and primary flows are usable one-handed
- [x] 7.4 Add reduced-motion support for any animations
- [ ] 7.5 Manual accessibility pass on iOS VoiceOver and Android TalkBack for main flows

## 8. CI and Store Release

- [x] 8.1 Add a `mobile-ci` workflow with path filters (mobile app + bridge + shared layers)
- [x] 8.2 Mobile CI runs Rust gates (`cargo test --all-features`) plus mobile lint/typecheck
- [x] 8.3 Add EAS build configuration (`eas.json`) and document required secrets/credentials
- [x] 8.4 Extend tag-based release workflow to build + submit to TestFlight and Google Play internal track
- [x] 8.5 Gate store submission on credentials and fail early with clear missing-secret messages

## 9. Verification

- [ ] 9.1 Manual test on iOS: split/combine for each encoding (with and without passphrase)
- [ ] 9.2 Manual test on Android: split/combine for each encoding (with and without passphrase)
- [ ] 9.3 Verify offline behavior: no network required for core workflows
- [ ] 9.4 Verify QR workflow: scan k shares from another device and recover successfully
