# AGENTS.md — Repo Guide for Coding Agents

## Current Repo State (important)

- As of Jan 2026, this repository contains only `PRD.md` and no source code.
- No build system, package manager, linter, formatter, or test runner is currently detectable.
- The commands and conventions below are **recommended defaults** based on `PRD.md` and common Rust/React practices.
- When code lands, **update this file** to reflect the actual scripts/configs.

## Project Intent (from `PRD.md`)

The goal is a cross-platform tool/library that:

- Splits arbitrary secrets via SSSS-style secret sharing over GF(256).
- Encodes shares as Base58Check / Base64URL and/or BIP-39 word mnemonics.
- Reconstructs from ≥k shares with integrity via BLAKE3.
- Optionally encrypts secrets via Argon2id → ChaCha20-Poly1305.
- Provides both a Rust CLI/library and an optional React + TS frontend.

## Recommended Repo Layout (expected)

The PRD proposes:

- `crates/ssss_mnemo_core/` — core algorithms and formats
- `crates/ssss_mnemo_cli/` — CLI wrapper around the core
- `web/` — React + TypeScript frontend, with WASM bindings

If the repo ends up structured differently, prefer the actual layout over this.

---

## Build / Lint / Test

### Rust (Cargo)

**Prereqs**

- Install Rust toolchain (stable) and `rustfmt` + `clippy` components.

**Build**

- Debug: `cargo build`
- Release: `cargo build --release`

**Lint**

- Clippy (recommended): `cargo clippy --all-targets --all-features`
- Deny warnings (CI-style): `cargo clippy --all-targets --all-features -- -D warnings`

**Format**

- Check formatting: `cargo fmt --all -- --check`
- Auto-format: `cargo fmt --all`

**Test (all)**

- `cargo test --all-features`

**Run a single test (most important)**

- By test name substring: `cargo test <test_name_substring>`
- Exact module path: `cargo test gf256::tests::mul_properties`
- Single test with output: `cargo test <pattern> -- --nocapture`
- Single crate (workspace): `cargo test -p ssss_mnemo_core <pattern>`
- Single file/module (common approach): `cargo test -p ssss_mnemo_core gf256::`

**Benchmarks (only if added)**

- `cargo bench`

### WASM build (if `wasm-bindgen`/`wasm-pack` is used)

- Typical build: `wasm-pack build --target web`
- Prefer keeping WASM artifacts out of git unless project policy differs.

### React / TypeScript (Web UI)

**Status**: no JS tooling detected yet; when added, prefer these conventions.

**Package manager**

- Use whatever lockfile exists:
  - `pnpm-lock.yaml` → pnpm
  - `yarn.lock` → yarn
  - `package-lock.json` → npm

**Build** (examples; adjust to actual scripts)

- `pnpm build` / `yarn build` / `npm run build`

**Lint**

- `pnpm lint` / `yarn lint` / `npm run lint`

**Format**

- `pnpm format` or `pnpm prettier -w .` (depending on setup)

**Test**

- Unit tests (Vitest/Jest): `pnpm test`
- Run a single test (Vitest): `pnpm vitest -t "test name"`
- Run a single test (Jest): `pnpm jest -t "test name"`
- Run one file: `pnpm vitest path/to/file.test.ts`

### Meta

- If a `Makefile` exists later, prefer documented `make lint`, `make test`, etc.
- If CI exists later, mirror its exact commands locally.

---

## Coding Standards

### General

- Prefer small, reviewable PRs; keep unrelated refactors out of feature patches.
- Do not commit secrets or sample shares derived from real secrets.
- Treat share packets and reconstructed secrets as sensitive: minimize logging.

### Rust Style

**Formatting**

- Use `rustfmt` with default settings unless repo config overrides.
- Keep lines reasonably short; prefer clarity over cleverness.

**Imports**

- Group imports by crate/module; keep `use` lists tidy.
- Avoid glob imports (`use foo::*`) except in tests where idiomatic.

**Naming**

- Types: `UpperCamelCase` (`SharePacket`, `SplitConfig`).
- Functions/vars: `snake_case` (`split_secret`, `set_id`).
- Modules/files: `snake_case` (`gf256.rs`, `mnemo.rs`).

**Types / Ownership**

- Prefer explicit types at public API boundaries.
- Avoid unnecessary cloning; prefer slices (`&[u8]`) and `Cow` where appropriate.
- Keep the core crate `no_std` only if the project explicitly targets it.

**Error handling**

- Avoid `panic!`, `unwrap()`, and `expect()` in non-test code.
- Return `Result<T, E>` from fallible operations.
- Provide actionable error messages (e.g., “need k shares, got m”).
- Prefer typed errors in core logic; keep CLI/UI mapping separate.

**Security-sensitive code**

- Zeroize secret material after use (per PRD: `zeroize` crate).
- Verify integrity (BLAKE3 tag) before decoding/using reconstructed secrets.
- Treat decoding/parsing errors as expected inputs; do not crash.
- Keep packet formats versioned and validated strictly.

### CLI (Rust)

- Prefer `clap` derive APIs (per PRD) and consistent flags:
  - `--k`, `--n`, `--encoding`, `--in-stdin`, `--out-stdout`, `--in <file>`, `--out <file>`.
- Ensure commands are script-friendly:
  - deterministic output where possible
  - no interactive prompts unless explicitly requested (passphrase flows)

### React + TypeScript Style (if/when added)

**Imports**

- Keep imports sorted and grouped (builtin → external → internal).
- Prefer type-only imports (`import type { X } from ...`) when supported.

**Types**

- Prefer `unknown` over `any`.
- Narrow types via guards; keep runtime validation near boundary parsing.

**Naming**

- Components: `UpperCamelCase` (`SplitForm`, `ShareList`).
- Hooks: `useX`.
- Files: project convention (commonly `kebab-case` or `PascalCase` for components).

**Error handling**

- Show user-friendly errors with enough detail to fix input mistakes.
- Avoid swallowing errors; surface actionable messages (bad checksum, wrong passphrase).

---

## Testing Guidance

### Rust tests

- Prefer deterministic, table-driven tests for encodings.
- Add round-trip tests for every encoding and packet version.
- Include negative tests:
  - <k shares
  - inconsistent metadata
  - malformed share payload
  - checksum/CRC failures
  - wrong passphrase

### Web tests

- Keep WASM boundary tests small and focused.
- Add UI tests only when the workflow stabilizes (avoid brittle snapshots).

---

## Cursor / Copilot Rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` files are currently present.
- If these are added later, mirror their requirements here.

## Git workflow
- Always commit atomically and meaningfully
- Write commit messages using conventional commits
- Prefer rebase over merge
- For major features, create a feature branch (feat/this-feature). Use kebab case branch names
