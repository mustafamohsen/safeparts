# Agent Conventions

This repo is security-sensitive. Treat share packets and reconstructed secrets as secrets.

The sections below are the established repo standards and conventions for agentic work.

## Coding Standards

### General

- Prefer small, reviewable PRs; keep unrelated refactors out of feature patches.
- Do not commit secrets or sample shares derived from real secrets.
- Treat share packets and reconstructed secrets as sensitive: minimize logging.

### Docs writing

- When editing or creating user-facing docs (for example `README.md`, `web/help/**/*.mdx`, and other end-user/contributor docs), load and apply the `humanizer` skill before finalizing the text.
- Do not apply this to internal instruction/tooling files (for example `AGENTS.md`, `openspec/**`, `.opencode/**`, or similar).

### Rust Style

**Formatting**

- Use `rustfmt` with default settings unless repo config overrides.
- Keep lines reasonably short; prefer clarity over cleverness.
- Workspace lints forbid `unsafe` (see `Cargo.toml`).

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
- Provide actionable error messages (e.g., `need k shares, got m`).
- Prefer typed errors in core logic; keep CLI/UI mapping separate.

**Security-sensitive code**

- Zeroize secret material after use (per PRD: `zeroize` crate).
- Verify integrity (BLAKE3 tag) before decoding/using reconstructed secrets.
- Treat decoding/parsing errors as expected inputs; do not crash.
- Keep packet formats versioned and validated strictly.

### CLI (Rust)

- Prefer `clap` derive APIs (per PRD) and consistent flags:
  - `-k/--threshold`, `-n/--shares`, `-e/--encoding`, `-i/--in <file>`, `-o/--out <file>`.
  - Stdin/stdout are defaults; use `-i -` / `-o -` explicitly if needed.
  - For encryption: `-p/--passphrase <text>` or `-P/--passphrase-file <path>`.
  - Binary name: `safeparts`.
- Ensure commands are script-friendly:
  - deterministic output where possible
  - no interactive prompts unless explicitly requested (passphrase flows)

### React + TypeScript Style

**Imports**

- Keep imports sorted and grouped (builtin -> external -> internal).
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
