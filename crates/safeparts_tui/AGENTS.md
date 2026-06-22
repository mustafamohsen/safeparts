# AGENTS.md — safeparts_tui

## Purpose

Owns the `safeparts-tui` interactive terminal UI.

## Ownership

- `src/app.rs`: terminal application state, rendering, events, keyboard flow.
- `src/domain.rs`: TUI-facing domain adapters over `safeparts_core`.
- `src/clipboard.rs`: system clipboard and terminal clipboard behavior.
- `src/main.rs`: binary entry point.

## Local Contracts

- Keep split/combine and encoding rules in `safeparts_core`.
- Keep the TUI keyboard-first.
- Treat clipboard contents, shares, passphrases, and recovered secrets as sensitive.
- Do not add logging that includes secret material.

## Work Guidance

- Follow `docs/agents/conventions.md` and `docs/dev/surfaces/tui.md`.
- Add domain/state tests when changing behavior that can be tested without terminal rendering.
- Keep terminal messages actionable and short.

## Verification

- `cargo test -p safeparts_tui`
- `cargo run -p safeparts_tui` for manual smoke when UI behavior changes
- `cargo fmt --all -- --check`
- `cargo clippy --all-targets --all-features -- -D warnings`

## Child DOX Index

- No child AGENTS.md files yet.
