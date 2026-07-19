# AGENTS.md — Developer Surface Guides

## Purpose

Owns focused contributor guides for each Safeparts surface.

## Ownership

- `core.md`: Rust core library and packet/encoding ownership.
- `cli.md`: CLI flags, IO behavior, and e2e tests.
- `tui.md`: terminal UI workflow and interaction rules.
- `wasm.md`: wasm-bindgen boundary consumed by the web app.
- `web.md`: Vite/React app, WASM package boundary, and browser checks.
- `desktop.md`: Tauri app, command layer, and web UI parity.
- `help-docs.md`: Astro/Starlight help-site contributor notes.
- `release.md`: release packaging and workflow notes.
- `mobile.md`: dormant mobile prototype expectations.
- `macos.md`: native SwiftUI app and shared UniFFI bridge workflow.
- `windows.md`: native Windows interoperability foundation and planned WinUI surface.

## Local Contracts

- Keep these guides contributor-facing and implementation-focused.
- Do not duplicate full API docs or user help pages.
- Update a guide when the matching source subtree contract changes.

## Work Guidance

- Keep each guide short enough to scan before making a change.
- Link to the owning source path and nearest `AGENTS.md`.

## Verification

- Run `mise run dx:verify` after changing guide names or links.

## Child DOX Index

- No child AGENTS.md boundaries. The surface guides listed under Ownership remain directly owned here.
