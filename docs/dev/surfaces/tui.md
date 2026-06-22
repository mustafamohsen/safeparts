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
- Add domain-level tests when changing state transitions or parsing behavior.

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
