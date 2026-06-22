# Architecture

Safeparts is a local-first threshold secret-sharing toolkit. The same core logic feeds every user interface.

## Repo map

```text
crates/safeparts_core/   Core split/combine, packets, encodings, optional encryption
crates/safeparts/        CLI binary: safeparts
crates/safeparts_tui/    Terminal UI binary: safeparts-tui
crates/safeparts_wasm/   wasm-bindgen facade for the browser app
web/                     Vite + React browser UI
web/help/                Astro + Starlight help site under /help/
desktop/                 Tauri + React desktop app
scripts/                 Repository automation
```

## Data flow

```text
secret bytes
  -> optional passphrase protection in safeparts_core
  -> BLAKE3 integrity tag
  -> Shamir-style split over GF(256)
  -> SharePacket values
  -> selected share encoding
  -> CLI, TUI, WASM, web, or desktop presentation
```

Combine reverses that path:

```text
share text
  -> decode into SharePacket values
  -> validate metadata and threshold
  -> reconstruct tagged bytes
  -> verify integrity tag
  -> optional decrypt
  -> recovered secret bytes
```

## Source of truth

- Cryptography, packet parsing, validation, and encodings live in `crates/safeparts_core/`.
- The CLI, TUI, WASM, web app, and desktop app adapt IO and presentation. They should not fork the secret-sharing rules.
- The web UI is the source of truth for the desktop UI shape. Desktop may use Tauri commands behind the same interface, but it should not expose desktop-only product features unless web exposes them first.
- The help site is user-facing documentation. Developer workflow docs live under `docs/dev/`.

## Boundary rules

- Do not add a backend for split/combine. Browser and desktop workflows stay local.
- Do not log share text, passphrases, or recovered secrets.
- Keep generated WASM output out of source edits unless the task is explicitly about generated artifacts.
- Keep release packaging scripts deterministic and explicit about inputs and outputs.

## Where to make changes

| Change | Primary owner | Usually also update |
| --- | --- | --- |
| New split/combine rule | `safeparts_core` | CLI, TUI, WASM, web, desktop tests, feature matrix |
| New share encoding | `safeparts_core::encoding` | CLI/TUI choices, WASM API, UI choices if exposed, docs, tests |
| CLI flag | `crates/safeparts` | CLI tests, help docs if user-visible, feature matrix |
| Web workflow | `web/src` | web tests, desktop parity if mirrored |
| Desktop workflow | `desktop/src` and `desktop/src-tauri` | web parity plan, desktop tests |
| Build or release behavior | `scripts/`, `.github/`, `mise.toml` | `docs/dev/verification.md`, release guide |
