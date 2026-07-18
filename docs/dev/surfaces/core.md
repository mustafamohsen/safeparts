# Core library

Owner: `crates/safeparts_core/`
Nearest contract: [`crates/safeparts_core/AGENTS.md`](../../../crates/safeparts_core/AGENTS.md)

## What belongs here

- Shamir-style split/combine over GF(256).
- Share packet versioning and strict parsing.
- Share encodings and auto-detection rules.
- Optional passphrase protection.
- Typed errors for core behavior.

Front-ends should call core APIs instead of reimplementing rules. For external Rust integrations, use the [Rust library integration manual](../manuals/rust-library.md).

## Change rules

- Keep security-sensitive logic clear and tested.
- During byte-wise Shamir reconstruction, compute interpolation weights once for the selected share coordinates and reuse them for every payload byte. Keep field division fallible.
- Add deterministic round-trip tests and negative tests for threshold, packet, encoding, crypto, and integrity behavior.
- Avoid logging or formatting share text, passphrases, or recovered secrets.
- Keep public API changes explicit in docs and downstream surfaces.
- Update the library manual when public functions, packet fields, errors, or integration guidance changes.

## Useful checks

```bash
cargo test -p safeparts_core
cargo test -p safeparts_core encoding::
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
```

## When core changes

Update:

- [`docs/dev/feature-matrix.md`](../feature-matrix.md)
- [`docs/dev/manuals/rust-library.md`](../manuals/rust-library.md) for public API or integration changes
- CLI/TUI/WASM/web/desktop callers if behavior is exposed
- Help docs only when user-visible behavior changes and the task includes that scope
