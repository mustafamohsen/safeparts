## Context

Safeparts currently ships as a Rust core (`crates/safeparts_core`) with three user-facing surfaces: CLI, TUI, and a React web UI that calls the core via WASM. A mobile app adds an iOS/Android surface where users can split/combine secrets fully offline and transfer shares via camera (QR) instead of manual copy/paste.

Constraints:

- Offline-first: split/combine and help/docs must work without network connectivity.
- Offline-first: split/combine must work without network connectivity.
- Security: no secret/share/passphrase logging; no persistence unless explicit user export.
- Parity: match existing encodings and passphrase behavior so shares are cross-compatible with CLI/TUI/Desktop/Web.
- Bilingual UI: English + Arabic, with correct direction handling and bidi-safe rendering of share tokens.

## Goals / Non-Goals

**Goals:**

- Build an Expo (React Native) mobile app for iOS and Android under `mobile/`.
- Run split/combine operations locally by calling `safeparts_core` through a native bridge (not via a remote service).
- Provide QR export and camera QR import for shares.
- Add CI gates and an automated tag-based store release pipeline (App Store Connect + Google Play) with signing gated on credentials.

**Non-Goals:**

- Adding accounts, sync, telemetry, or any hosted backend.
- Implementing auto-update outside the app stores.
- OCR of printed shares in the first iteration (QR scanning is the primary “camera input”).

## Decisions

### Decision 1: Use Expo + EAS as the mobile toolchain

Approach:

- Use Expo for developer experience and cross-platform UI.
- Use EAS Build/Submit as the canonical reproducible build and store-submission mechanism.

Alternatives considered:

- WebView wrapper around the existing web UI: faster parity, but weaker native feel and more awkward camera integration.
- Flutter: strong performance and native feel, but diverges from the existing React investment.

Rationale:

- Expo + EAS provides the most direct path to iOS/Android store delivery while keeping a React-based UI.

### Decision 2: Implement a native bridge to `safeparts_core`

Approach:

- Expose a minimal API surface to JS: `split_secret`, `combine_shares`, `supported_encodings`, and `get_version`.
- Build Rust as platform-native libraries and call it from Swift/Kotlin through an Expo Module (expo-modules-core) or equivalent native module.
- Represent byte payloads across the JS/native boundary using base64 strings or `Uint8Array`-like arrays, preferring a clear, stable wire format.

Alternatives considered:

- Running the WASM build inside a mobile WebView: simpler, but makes the camera path and native integrations more complex.
- Pure JS implementation: not acceptable for parity/security/performance goals.

Rationale:

- Keeping split/combine in Rust preserves correctness and performance and avoids duplicating security-sensitive crypto/encoding logic.

### Decision 3: Make QR scanning the primary camera-based input

Approach:

- Render each share as a QR code for transfer.
- Provide a Combine flow that supports rapid multi-scan (scan → append share → continue scanning).
- Define behavior for oversized shares (e.g., advise file/share-sheet transfer instead of QR when payload exceeds practical limits).

Rationale:

- QR is more reliable than OCR for high-entropy tokens like base58/base64.

### Decision 4: Localization and bidi-safe share rendering are first-class

Approach:

- Localize all user-facing strings (English + Arabic).
- Treat shares and other encoded tokens as LTR “code” blocks even while the UI is RTL.
- Ensure layouts are direction-aware (mirrored where appropriate) without breaking token rendering.

Rationale:

- Prevents bidi reordering bugs that can silently corrupt share copying/visual verification.

### Decision 5: CI and release are part of the product surface

Approach:

- Add a dedicated mobile CI workflow with path filters for `mobile/**` (and any shared layers).
- For tags `v*`, run EAS build + submit to App Store Connect / Google Play.
- Gate signing/submission on credentials; for release tags, fail early with a clear message if required secrets are missing.

Rationale:

- Store-first distribution requires reliable signing and submission automation.

## Risks / Trade-offs

- Expo + native Rust bridge complexity (managed vs prebuild/dev-client) → resolve early with a minimal spike and lock the approach.
- Store credential management and operational burden → use EAS + App Store Connect API keys + Google service account; document secret rotation and least privilege.
- QR payload size for larger secrets → define constraints; provide file/share-sheet fallbacks; consider multipart QR only if needed.
- Performance for large secrets / higher thresholds → consider optimizing `safeparts_core` combine path (precompute interpolation weights) and run native work off the UI thread.
- RTL layout differences across iOS/Android → test both platforms early; keep token rendering explicitly LTR.

## Migration Plan

- Add the mobile app as an additive surface with no changes to existing share formats.
- First releases ship to TestFlight and Play internal testing tracks.
- Promote to production tracks after manual verification on real devices (Split/Combine parity, QR scan flows, accessibility baseline).

## Open Questions

- Final app identifiers (iOS bundle id / Android application id) and store listing metadata.
- Whether to unify i18n string sources across web/desktop/mobile, or maintain a separate mobile i18n module initially.
- QR framing strategy for large secrets (single QR vs multipart vs disallow).
- Whether to add OCR for mnemonic-only shares as a later milestone.
