# Verification

Use the smallest check that proves your change, then run the broader gate before a PR when practical.

## One-command checks

```bash
mise run doctor      # local environment diagnostics
mise run dx:verify   # docs, AGENTS, lockfile, and generated-artifact checks
mise run verify      # full local gate
```

## Rust

```bash
mise run fmt-check
mise run lint
mise run test
```

Direct commands:

```bash
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
```

Targeted examples:

```bash
cargo test -p safeparts_core encoding::
cargo test -p safeparts --test e2e explicit_dash_paths_use_stdin_and_stdout
cargo test -p safeparts_tui app::tests
cargo test -p safeparts_wasm
cargo test -p safeparts_desktop --lib
```

## Web app

From `web/`:

```bash
bun install --frozen-lockfile
bun run build:wasm
bun run typecheck
bun run build
bun run test:e2e:smoke
```

Use local browser automation through the project browser skill or `browse` CLI for manual web smoke checks. Playwright remains the CI test runner and should not be the default manual browser tool unless a task asks for it.

## Help docs

From `web/help/`:

```bash
bun install --frozen-lockfile
bun run build
```

For route parity and accessibility coverage, run the web test suites from `web/`.

## Desktop app

From `desktop/`:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run build
bun run tauri:build -- --no-bundle
```

Use `mise run desktop:check` for the common local gate.

## Release packaging

From the repo root:

```bash
cargo test --all-features
cargo build --release -p safeparts -p safeparts_tui
python3 scripts/release/package.py --version 0.1.0
```

Release CI owns signed or bundled platform artifacts.

## DX checks

`mise run dx:verify` checks:

- AGENTS child indexes point to real paths.
- `docs/dev/feature-matrix.md` has required surface columns.
- Required surface guides and developer manuals are present.
- Bun package lock policy is not mixed with npm lockfiles.
- Generated artifact policy catches common drift.
- Desktop/web copied UI files have visible parity status.

## When to skip a check

If you skip a relevant check, record why in the PR or final handoff. Good reasons include missing host dependencies, a check that is unrelated to the changed surface, or a command that is too expensive for the current task. Do not hide failures.
