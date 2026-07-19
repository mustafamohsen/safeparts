# Architecture

Safeparts is a local-first threshold secret-sharing toolkit. The same core logic feeds every user interface.

## Repo map

```text
crates/safeparts_core/   Core split/combine, packets, encodings, optional encryption
crates/safeparts/        CLI binary: safeparts
crates/safeparts_tui/    Terminal UI binary: safeparts-tui
crates/safeparts_wasm/   wasm-bindgen facade for the browser app
crates/safeparts_uniffi/ Platform-neutral UniFFI facade for native Swift and C#
web/                     Vite + React browser UI
web/help/                Astro + Starlight help site under /help/
desktop/                 Tauri + React desktop app
macos/                   Native SwiftUI macOS app
windows/                 Generated C# binding and Windows DLL smoke executable
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
  -> CLI, TUI, WASM, web, Tauri desktop, or native presentation
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
- The CLI, TUI, WASM, web app, Tauri desktop app, and native macOS app adapt IO and presentation. They should not fork the secret-sharing rules.
- The web UI is the source of truth for the Tauri desktop UI shape. Tauri may use commands behind the same interface, but it should not expose desktop-only product features unless web exposes them first.
- The native macOS app is a separate SwiftUI surface. It uses the platform-neutral UniFFI bridge to call the Rust core and may expose native file and clipboard workflows.
- The same UniFFI bridge generates the C# contract for the planned native Windows app. The current Windows executable is an interoperability check, not an end-user UI.
- Release CI packages Tauri for Linux and Windows. The native SwiftUI app owns the macOS 14+ universal DMG.
- The help site is user-facing documentation. Developer workflow docs live under `docs/dev/`.

## Boundary rules

- Do not add a backend for split/combine. Browser and desktop workflows stay local.
- Do not log share text, passphrases, or recovered secrets.
- Keep generated WASM output out of source edits unless the task is explicitly about generated artifacts.
- Refresh native Swift bindings through `macos/scripts/prepare.sh`; do not hand-edit UniFFI output.
- Refresh the native C# binding through `windows/scripts/prepare.py`; do not hand-edit generated C#.
- Keep release packaging scripts deterministic and explicit about inputs and outputs.

## Where to make changes

| Change | Primary owner | Usually also update |
| --- | --- | --- |
| New split/combine rule | `safeparts_core` | CLI, TUI, WASM, web, desktop tests, feature matrix |
| New share encoding | `safeparts_core::encoding` | CLI/TUI choices, WASM API, UI choices if exposed, docs, tests |
| CLI flag | `crates/safeparts` | CLI tests, help docs if user-visible, feature matrix |
| Web workflow | `web/src` | web tests, desktop parity if mirrored |
| Tauri desktop workflow | `desktop/src` and `desktop/src-tauri` | web parity plan, desktop tests |
| Native macOS workflow | `macos/` and `crates/safeparts_uniffi/` | Swift tests, bridge tests, generated bindings, feature matrix |
| Native Windows interoperability | `windows/` and `crates/safeparts_uniffi/` | Rust API tests, real-DLL C# smoke, generated bindings, feature matrix |
| Build or release behavior | `scripts/`, `.github/`, `mise.toml` | `docs/dev/verification.md`, release guide |
