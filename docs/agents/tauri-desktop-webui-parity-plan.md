# Tauri Desktop Web UI Parity Plan

## Goal

Make `desktop/` a locally runnable Tauri version of the existing `web/` UI. The desktop interface and exposed features should match the browser app instead of adding desktop-only workflows.

## Non-goals

- Do not redesign the product UI.
- Do not add file split/combine, save/download flows, inspection panels, base58check, mnemo-bip39, or extra metadata UI unless the web app already exposes them.
- Do not modify `crates/safeparts_core`.
- Do not introduce a backend, telemetry, CLI sidecar, node runtime sidecar, server, database, or helper executable at runtime.

## Source of truth

Use `web/src/**` as the UI and behavior source of truth.

The desktop app should preserve:

- Header layout, Safeparts logo, help/GitHub/Discord links, language toggle, keytips, keyboard shortcuts help, live region, and background treatment.
- Split tab with text-only secret input, `k`, `n`, optional passphrase, and encoding choices matching the web app.
- Combine tab with separate share boxes, add/remove share controls, paste/clear controls, optional passphrase, auto-expansion behavior, invalid-share highlighting, and recovered text output matching the web app.
- Web app encoding feature set: `mnemo-words` and `base64url` only.
- Web app copy behavior. Do not add save/download controls.

## Implementation approach

1. Copy the web UI files needed by `web/src/App.tsx` into `desktop/src/`:
   - `assets/`
   - `components/`
   - `context/`
   - `hooks/`
   - `lib/`
   - `i18n.ts`
   - `styles.css`
   - `shims.d.ts` / `vite-env.d.ts` if needed
2. Add Tailwind/PostCSS config and package dependencies to `desktop/` so copied web styles build unchanged.
3. Replace desktop-only `desktop/src/App.tsx` with the web app version.
4. Replace `desktop/src/main.tsx` with the web app version except the warmup should call the desktop adapter.
5. Implement `desktop/src/wasm.ts` as a Tauri adapter exposing the small API shape consumed by the copied web components:
   - `split_secret(bytes, k, n, encoding, passphrase?) -> string[]`
   - `combine_share_input(input, encoding, passphrase?) -> Uint8Array`
   - `combine_shares(shares, encoding, passphrase?) -> Uint8Array`
   - `inspect_share_input(input, encoding) -> { k, encoding }`
   - optional `inspect_share(share, encoding) -> { k, encoding }`
6. Keep the existing Tauri Rust command tests and command layer, but it is okay if some command capabilities are not surfaced in UI.
7. Update `desktop/AGENTS.md`, README, and checks only if they still describe desktop-only features that are no longer true.

## Acceptance criteria

- The desktop UI visually and structurally mirrors the web UI rather than the custom desktop workbench.
- Desktop exposed features match the web app: text split, share-box combine, `mnemo-words`, `base64url`, optional passphrase, copy actions, language toggle, keyboard shortcuts/keytips.
- Desktop does not expose file split/combine, save/download, inspection metadata card, base58check, or mnemo-bip39 in the UI.
- `crates/safeparts_core/**` remains unchanged.
- Tauri runtime remains local-first with no backend/telemetry/sidecar requirement.
- Verification passes:
  - `cargo fmt --all -- --check`
  - `cargo clippy --all-targets --all-features -- -D warnings`
  - `cargo test --all-features`
  - `cd desktop && bun install`
  - `cd desktop && bun run typecheck`
  - `cd desktop && bun run build`
  - `cd desktop && bun run tauri:build -- --no-bundle`
