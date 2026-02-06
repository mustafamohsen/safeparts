# Mobile Rust Bridge

The mobile app runs split/combine locally by calling `crates/safeparts_core` from native code.

## Strategy

- Expo app (React Native) calls an Expo native module.
- Native module calls Rust.
- Rust implements the sensitive logic by delegating to `crates/safeparts_core`.

We target a single shared API surface across iOS/Android:

- `supportedEncodings() -> string[]`
- `splitSecret(secretB64, k, n, encoding, passphrase?) -> string[]`
- `combineShares(shares[], encoding, passphrase?) -> secretB64`
- `getVersion() -> string`

## Build approach

- Local development uses Expo dev server.
- Platform builds use EAS Build.
- The bridge is implemented as Rust + thin platform wrappers (Swift/Kotlin).

## Byte wire format

The JS/native boundary uses base64 strings for raw bytes:

- JS passes secrets to native as base64 (`secretB64`).
- Native returns recovered secrets as base64.

Rationale:

- Stable across platforms and avoids JS number-array overhead.
- Works well with QR/file/clipboard flows where payloads are typically string-based.

## Security notes

- Never log secrets, shares, or passphrases.
- Avoid persisting secrets/shares/passphrases unless user explicitly exports.
- Clear sensitive buffers where practical.

## Local spike

There is a small “FFI spike” that exercises the Rust bridge via Bun FFI on the host:

- From `mobile/`: `bun run spike:ffi`

This is a development-only proof of wiring and does not replace iOS/Android native integration.

## UniFFI bindings

The Rust bridge includes a UniFFI UDL interface at `mobile/src-native/src/safeparts_mobile_bridge.udl`.

To (re)generate Swift + Kotlin bindings:

- From `mobile/src-native/`: `cargo run --bin uniffi_gen`

Bindings are written to:

- `mobile/bridge/bindings/ios/`
- `mobile/bridge/bindings/android/`
