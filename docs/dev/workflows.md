# Workflows

Use these checklists to keep future changes predictable.

## Add or change a feature

1. Read the nearest `AGENTS.md` files.
2. Identify the source of truth. Most behavior starts in `crates/safeparts_core/`.
3. For multi-surface work, copy [change-checklist.md](change-checklist.md) into your issue, PR, or task notes.
4. Update [feature-matrix.md](feature-matrix.md) with intended surface coverage.
5. Add the lowest-level tests first.
6. Update each exposed boundary: CLI, TUI, WASM, web, desktop, docs, release packaging.
7. Update the nearest `AGENTS.md` if contracts changed.
8. Update developer docs under `docs/dev/`.
9. Update user docs only when the change is user-visible and the task includes that scope.
10. Run relevant checks from [verification.md](verification.md).

## Fix a bug

1. Reproduce it with the smallest failing test or command.
2. Fix the source of truth, not only the front-end symptom.
3. Add a regression test near the failure boundary.
4. Check that errors do not echo share text, passphrases, or recovered secrets.
5. Run targeted checks, then the broader gate if practical.

## Add a share encoding

1. Add the core encode/decode implementation and strict validation.
2. Add round-trip, malformed input, checksum, and auto-detection tests where relevant.
3. Add CLI/TUI support if the encoding is part of the Rust toolchain.
4. Add WASM support through the shared core encoding API.
5. Decide whether web exposes it. Desktop follows web exposure.
6. Update `docs/dev/feature-matrix.md`, `docs/dev/surfaces/core.md`, and affected surface guides.
7. Update help docs only if the encoding becomes user-visible in a released surface.

## Change web UI behavior

1. Read `web/AGENTS.md` and `web/src/AGENTS.md`.
2. Keep split/combine local to the browser.
3. Build WASM before running the app.
4. Keep accessibility labels, live regions, keyboard behavior, and RTL support intact.
5. If the change should also exist in desktop, update desktop or record why not.
6. Run web build, typecheck, and the relevant browser checks.

## Change desktop behavior

1. Read `desktop/AGENTS.md`, `desktop/src/AGENTS.md`, and `desktop/src-tauri/AGENTS.md`.
2. Check whether the web UI already exposes the behavior.
3. Keep secrets in memory only. Do not add a backend, telemetry, sidecar, or persistence for shares.
4. Add or update Tauri command tests when the command boundary changes.
5. Run the desktop parity check and desktop build.

## Change developer tooling

1. Keep scripts small and explicit about inputs and outputs.
2. Prefer read-only diagnostics for `doctor` and `dx:verify`.
3. Add commands to `mise.toml` when they are useful to most contributors.
4. Update `docs/dev/verification.md` and `docs/dev/troubleshooting.md` if the command changes how people work.

## Change docs or AGENTS

1. Keep public help docs and internal developer docs separate.
2. Apply the `humanizer` skill for contributor-facing prose.
3. Update child indexes when AGENTS files are added, removed, or moved.
4. Run `mise run dx:verify`.
