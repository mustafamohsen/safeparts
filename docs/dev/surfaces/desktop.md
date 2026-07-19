# Desktop app

Owner: `desktop/`
Nearest contracts: [`desktop/AGENTS.md`](../../../desktop/AGENTS.md), [`desktop/src/AGENTS.md`](../../../desktop/src/AGENTS.md), [`desktop/src-tauri/AGENTS.md`](../../../desktop/src-tauri/AGENTS.md)

## What belongs here

The desktop app is a Tauri + React local app. It mirrors the web UI and calls `safeparts_core` through Tauri commands. Release CI packages it for Linux and Windows during the native Windows preview. The SwiftUI app owns macOS releases.

It owns:

- desktop packaging configuration
- Tauri command boundary and permissions
- desktop adapter for the web UI API shape
- desktop build and command tests

## Change rules

- Do not add a backend, telemetry, CLI sidecar, node sidecar, or external service requirement.
- Do not persist shares, passphrases, or recovered secrets.
- Wrap secret bytes and passphrase byte buffers in zeroizing storage before calling core.
- Keep Tauri request and response types explicit in `commands.ts`. Keep `wasm.ts` as the typed adapter that matches the browser WASM call shape.
- Do not expose desktop-only product features unless the web UI exposes them first.
- Keep command errors useful without echoing share input.
- Run parity checks when copied UI files change.

## Useful checks

```bash
cd desktop
bun install --frozen-lockfile
bun run typecheck
bun run build
bun run tauri:build -- --no-bundle
```

Rust command tests run from the repo root:

```bash
cargo test -p safeparts_desktop --lib
```

## When desktop changes

Update:

- [`docs/dev/feature-matrix.md`](../feature-matrix.md)
- web parity notes if behavior intentionally differs
- release guide if bundle targets, icons, identifiers, or packaging change
