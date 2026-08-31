# AGENTS.md — Desktop React Source

## Purpose

Owns the React UI source for the Tauri desktop app.

## Ownership

- `App.tsx`, `main.tsx`: desktop app shell and startup.
- `components/`, `hooks/`, `context/`, `lib/`, `i18n.ts`, `styles.css`: copied web UI surface.
- `commands.ts`: typed Tauri command invocations.
- `wasm.ts`: desktop adapter that matches the web WASM API shape.

## Local Contracts

- Keep the desktop UI aligned with `web/src` unless a task documents an intentional difference.
- Do not expose desktop-only product features unless the web UI exposes them first.
- Do not persist shares, passphrases, or recovered secrets in browser storage.
- Split clipboard actions copy one Recovery share at a time; only Combine may copy its recovered Secret through the global result shortcut.
- Generated Recovery shares must disappear when any Split input changes, and pending Tauri results must not restore stale output.
- Preserve the Tauri command's UTF-8 metadata, refuse binary recovered output, and invalidate results whenever Recovery shares, Share encoding, or Passphrase protection changes.
- Keep Tauri command payloads typed and avoid `any` in new code.

## Work Guidance

- Follow `docs/dev/surfaces/desktop.md` and `docs/dev/surfaces/web.md`.
- Copy web UI changes deliberately, then run the parity check.
- Keep `commands.ts` and `wasm.ts` as the desktop-specific boundary.

## Verification

- `cd desktop && bun run typecheck`
- `cd desktop && bun run test:adapter`
- `cd desktop && bun run build`
- `mise run desktop:parity`
- `cargo test -p safeparts_desktop --lib` when command behavior changes

## Child DOX Index

- No child AGENTS.md files yet.
