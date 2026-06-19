# Tauri desktop app implementation plan

## Branch and scope

- Branch: `feat/standalone-tauri-app`, created from `origin/main` in worktree `/Users/mustafamohsen/Projects/safeparts-tauri-app`.
- Add a standalone desktop app without changing `crates/safeparts_core`.
- Keep the existing web app, CLI, TUI, Netlify flow, and docs site intact.

## Product goals

The desktop app should make Safeparts available as an installed local app on macOS, Linux, and Windows. It must cover the same Safeparts workflows as the CLI/TUI, with a calmer and more guided UI than the command line.

Required workflows:

1. Split a secret from text or a file into recovery shares.
2. Choose threshold, share count, share encoding, and optional passphrase protection.
3. Support every core share encoding: `base64url`, `base58check`, `mnemo-words`, and `mnemo-bip39`.
4. Copy, download, and save generated recovery shares.
5. Combine pasted shares or shares loaded from a file.
6. Auto-detect share encoding on combine.
7. Show share metadata before combine when possible: threshold, share count, selected or detected encoding, and whether passphrase protection is required.
8. Reconstruct as text when it is valid UTF-8 and as downloadable bytes for all secrets.
9. Keep all split and combine work local. Do not introduce a backend or telemetry.

## Architecture

Create a new top-level `desktop/` package:

- `desktop/package.json`: Tauri/Vite/React scripts.
- `desktop/src/`: React UI and TypeScript helpers.
- `desktop/src-tauri/`: Tauri Rust crate.
- `desktop/AGENTS.md`: local DOX contract.

Add `desktop/src-tauri` as a Cargo workspace member so `cargo fmt`, `cargo clippy`, and `cargo test --all-features` cover the desktop Rust commands.

The Tauri Rust crate depends on `safeparts_core = { path = "../../crates/safeparts_core" }`. Do not edit `crates/safeparts_core`.

Use Tauri commands as the only cryptographic boundary:

- `split_secret_command(secret: Vec<u8>, threshold: u8, share_count: u8, encoding: String, passphrase: Option<String>) -> SplitResponse`
- `combine_shares_command(input: String, encoding: String, passphrase: Option<String>) -> CombineResponse`
- `inspect_shares_command(input: String, encoding: String) -> ShareInspection`
- `supported_encodings_command() -> Vec<EncodingInfo>`

The commands must use only public APIs from `safeparts_core`:

- `safeparts_core::split_secret`
- `safeparts_core::combine_shares`
- `safeparts_core::encoding::{encode_packet, parse_share_packets_wrapped_mnemonics, Encoding}`

## Runtime dependency interpretation

Tauri apps use each platform's webview runtime. Treat "without external dependencies" as: the installed Safeparts desktop app must not require a separate Safeparts CLI, server, database, node process, wasm build, or helper executable at runtime. The build can use Rust, Bun or npm, and Tauri tooling.

## UI/UX direction

Use the existing Safeparts black and green security aesthetic, but make the desktop app feel like a native workbench:

- A two-column shell on wide screens: left operation rail, right task panel.
- Clear split/combine modes.
- Plain language guidance for threshold and share count.
- Big textarea/file drop zones with explicit "local only" reassurance.
- Prominent encoding selector with short explanations.
- Passphrase fields that never echo by default and can be cleared quickly.
- Result cards for shares with copy and save actions.
- Combine status panel showing detected metadata before reconstruction.
- Keyboard-accessible controls, labels, focus states, and live status messages.
- Responsive layout down to narrow Windows/Linux desktop windows.

Avoid generic SaaS dashboard styling. Prefer a compact security-console feel with careful spacing, restrained motion, and high contrast.

## Security and privacy rules

- Never log secrets, recovery shares, passphrases, or reconstructed bytes.
- Do not persist secrets, shares, or passphrases in local storage.
- Keep generated shares and reconstructed data only in React state until the user clears or closes the app.
- Error messages must be actionable but must not echo sensitive input.
- Do not modify the core library or weaken workspace lint policy.

## Implementation steps

1. Add `desktop/AGENTS.md` and update root `AGENTS.md` Child DOX Index with `desktop/`.
2. Add `desktop/src-tauri` Rust crate and include it in root `Cargo.toml` workspace members.
3. Implement Tauri commands that wrap `safeparts_core` without modifying core.
4. Add unit tests for the desktop Rust command layer:
   - split and combine round trip for every concrete encoding.
   - auto encoding combine round trip.
   - passphrase-protected split and combine.
   - wrong passphrase returns an error.
   - too few shares returns an error.
5. Add React desktop UI with split, combine, inspect, copy, file import, and download/save flows.
6. Add package scripts: `dev`, `build`, `tauri`, `tauri:dev`, `tauri:build`, and `typecheck`.
7. Document the desktop app in `README.md` with concise build/run commands.
8. Run formatting and focused verification.

## Acceptance criteria

- The new branch exists from `origin/main` and all work is on `feat/standalone-tauri-app`.
- A standalone Tauri app exists under `desktop/`.
- The desktop app uses `safeparts_core` through a path dependency and does not modify `crates/safeparts_core`.
- Split works for text and file input.
- Combine works for pasted shares and file-loaded shares.
- Split supports `base64url`, `base58check`, `mnemo-words`, and `mnemo-bip39`.
- Combine supports Auto encoding plus every concrete encoding.
- Passphrase-protected split/combine works and wrong passphrases fail safely.
- UI is keyboard-accessible and responsive.
- Runtime behavior is local-first with no backend, telemetry, CLI sidecar, or node process requirement.
- DOX docs are updated for the new `desktop/` boundary.
- README includes desktop build/run notes.
- Verification evidence is reported, including any commands that cannot run in this environment.

## Verification commands

Run from `/Users/mustafamohsen/Projects/safeparts-tauri-app` unless noted:

```bash
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
cd desktop && bun install
cd desktop && bun run typecheck
cd desktop && bun run build
```

If Tauri's platform dependencies are unavailable in the environment, report the exact failure and still run the Rust command tests that do not need a windowing build.
