# TUI

Owner: `crates/safeparts_tui/`
Nearest contract: [`crates/safeparts_tui/AGENTS.md`](../../../crates/safeparts_tui/AGENTS.md)

## What belongs here

The TUI is the keyboard-first terminal workflow over `safeparts_core`.

It owns:

- terminal application state
- split/combine interaction flow
- clipboard behavior and fallbacks
- terminal-focused validation and status messages

## Change rules

- Keep secret-sharing behavior in core.
- Keep keyboard operation reliable before adding mouse-only affordances.
- Treat clipboard contents as sensitive.
- Avoid writing share text or recovered secrets to logs.
- Save recovery shares and reconstructed secrets through atomic private-file output. On Unix, exported files must be owner-only.
- Add headless app-state tests for split/recovery workflows, recovery failures, focus wrapping, modal and status transitions, keyboard shortcuts, cyclic settings, and rendering.
- Use manual terminal smoke tests for rendering, clipboard integration, and other host behavior.
- Keep terminal setup behind an RAII session guard so raw mode, alternate-screen state, and cursor visibility are restored on every exit path.

## Useful checks

```bash
cargo test -p safeparts_tui
cargo test --all-features
cargo clippy --all-targets --all-features -- -D warnings
```

Manual smoke:

```bash
cargo run -p safeparts_tui
```

## When TUI changes

Update:

- [`docs/dev/feature-matrix.md`](../feature-matrix.md)
- CLI/TUI docs if launch or shortcut behavior changes
- release notes when binary packaging changes
