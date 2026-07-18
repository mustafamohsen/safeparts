# Feature matrix

Update this file when a feature is added, removed, exposed on a new surface, or intentionally left out of a surface.

Status keys:

- `Yes`: implemented and exposed.
- `Core`: implemented in core but not exposed here.
- `No`: not implemented.
- `Planned`: expected future work.
- `N/A`: not relevant for this surface.

## Current coverage

| Feature | Core | CLI | TUI | WASM | Web | Desktop | Native macOS | Help docs | Tests | Update when changed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Split/combine bytes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Rust, CLI e2e, web smoke, desktop command tests | All surface guides |
| Threshold range `1 <= k <= n <= 255` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Core negative tests | Core, CLI, TUI, WASM, web, desktop |
| BLAKE3 integrity tag | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Core corruption tests | Core and technical docs |
| Passphrase protection | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Core, CLI e2e, web smoke, desktop command tests | Security docs and every exposed UI |
| `base64url` share encoding | Yes | Yes, alias `base64` | Yes | Yes | Yes | Yes | Yes | Yes | Core, CLI e2e, desktop command tests | Encoding lists and UI choices |
| `base58check` share encoding | Yes | Yes, alias `base58` | Yes | Yes | Core | Core | Yes | Yes | Core, CLI e2e, desktop command tests | Feature exposure notes if web/desktop add it |
| `mnemo-words` share encoding | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Core, CLI e2e, web smoke, desktop command tests | Encoding docs and UI choices |
| `mnemo-bip39` share encoding | Yes | Yes | Yes | Yes | Core | Core | Yes | Yes | Core, CLI e2e, desktop command tests | Feature exposure notes if web/desktop add it |
| Auto encoding parse | Yes | Yes for combine | Yes for combine | Yes | Yes for combine | Yes for combine | Yes | Yes | Core, CLI e2e, web smoke, desktop command tests | Encoding parser docs and UI guidance |
| Web local-only workflow | N/A | N/A | N/A | Yes | Yes | N/A | N/A | Yes | Web build and smoke tests | Web surface guide |
| Desktop local-only Tauri workflow | N/A | N/A | N/A | N/A | Mirrored UI source | Yes | N/A | Yes | Desktop build, Tauri command tests | Desktop surface guide |
| Native macOS local-only workflow | N/A | N/A | N/A | N/A | N/A | N/A | Yes | N/A | Rust bridge and Swift model tests | Native macOS surface guide |
| Metadata-guided native recovery inputs | N/A | N/A | N/A | N/A | N/A | N/A | Yes | N/A | Swift metadata, passphrase, recovery, and field-removal tests | Native macOS model and UI |
| Native batch-export filename prefix | N/A | N/A | N/A | N/A | N/A | N/A | Yes | N/A | Swift filename tests | Native macOS model and UI |
| English + Arabic user docs | N/A | N/A | N/A | N/A | Links to help | N/A | N/A | Yes | Docs build, docs a11y route parity | Help docs guide |
| Release CLI/TUI archives | N/A | Yes | Yes | N/A | N/A | N/A | N/A | Yes | Release workflow, package script | Release guide |
| Tauri desktop installers | N/A | N/A | N/A | N/A | N/A | Yes, Linux and Windows | N/A | Yes | Release workflow | Release guide and desktop guide |
| Native macOS universal DMG | N/A | N/A | N/A | N/A | N/A | N/A | Yes, unsigned | Yes | macOS CI, package validator | Release guide and native macOS guide |
| QR export | No | No | No | No | Planned | Planned | N/A | Planned | None yet | Add proposal, UI tests, docs |
| Web `base58check` and `mnemo-bip39` exposure | Core | Yes | Yes | Yes | Planned | Planned after web | N/A | Planned | Add web and desktop parity tests | Web, desktop, help docs |
| Compatibility import/export | Planned | Planned | Planned | Planned | Planned | Planned | N/A | Planned | None yet | Add spec and migration notes |

## Required update checklist

When a feature changes, answer these before closing the task:

- Which surface owns the source of truth?
- Should CLI, TUI, WASM, web, desktop, help docs, and release packaging expose it now, later, or never?
- Which tests prove the core behavior and each exposed boundary?
- Does any `AGENTS.md` contract need a new rule?
- Does a developer guide need a new workflow or warning?
- Does user-facing documentation need an approved update?
- Does the change affect generated artifacts or release assets?

## Common future feature paths

### New share encoding

1. Implement encode/decode in `safeparts_core`.
2. Add parser and detection rules if auto encoding should support it.
3. Add core round-trip and negative tests.
4. Expose through CLI and TUI if the encoding is stable.
5. Add WASM bindings only through the core encoding API.
6. Decide whether web exposes it. If web exposes it, desktop should follow.
7. Update this matrix, surface guides, and relevant user docs.

### New UI workflow

1. Start in the web UI if it is a product feature.
2. Keep desktop UI parity unless there is a documented desktop-only reason.
3. Add browser accessibility coverage for stable flows.
4. Add Tauri command tests when the desktop command boundary changes.
5. Update this matrix and the web/desktop surface guides.

### New release artifact

1. Add the build or packaging path in scripts or release CI.
2. Document local verification in `verification.md` and `surfaces/release.md`.
3. Update checksums and artifact naming rules.
4. Update this matrix.
