
# AGENTS.md — Agent Entry Point

Keep this file short. It contains only the essentials and links to the deeper, task-specific guidance.

## Repo snapshot

- Rust Cargo workspace (edition 2024):
  - `crates/safeparts_core/` (core algorithms + encodings + optional encryption)
  - `crates/safeparts/` (CLI wrapper; binary: `safeparts`)
  - `crates/safeparts_tui/` (interactive terminal UI; binary: `safeparts-tui`)
  - `crates/safeparts_wasm/` (wasm-bindgen exports for the web UI)
- Web app: `web/` (Vite + React) which expects a WASM build step.
- Help/docs: `web/help/` (Astro + Starlight), deployed under `/help/`.

## Context

- Product intent + security model: `PRD.md`
- Local dev commands + repo layout: `README.md`

## Checks (mirrors CI)

- Build / lint / test commands: `docs/agents/checks.md`
- CI workflows (source of truth): `.github/workflows/rust-ci.yml`, `.github/workflows/web-ci.yml`, `.github/workflows/release.yml`

## Standards (do not change)

- Coding conventions + testing guidance: `docs/agents/conventions.md`

## Security-sensitive work

- Prefer small, reviewable PRs; keep unrelated refactors out of feature patches.
- Do not commit secrets or sample shares derived from real secrets.
- Treat share packets and reconstructed secrets as sensitive: minimize logging.

## Docs writing

- When editing or creating user-facing docs (for example `README.md`, `web/help/**/*.mdx`, and other end-user/contributor docs), load and apply the `humanizer` skill before finalizing the text.
- Do not apply this to internal instruction/tooling files (for example `AGENTS.md`, `openspec/**`, `.opencode/**`, or similar).

## Release packaging

- Local release-style archives: `scripts/release/README.md`

## OpenSpec tooling

- `openspec/` and `.opencode/` contain OpenSpec artifacts/tooling; avoid editing unless the task is explicitly about specs/tool config.

## Git workflow

- Always commit atomically and meaningfully
- Write commit messages using conventional commits
- Prefer rebase over merge
- For major features, create a feature branch (feat/this-feature). Use kebab case branch names
- Never push automatically. Only push when explicitly ordered to
