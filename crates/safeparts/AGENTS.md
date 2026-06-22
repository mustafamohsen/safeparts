# AGENTS.md — safeparts CLI

## Purpose

Owns the `safeparts` command-line interface.

## Ownership

- `src/main.rs`: clap command definitions, stdin/stdout/file IO, passphrase file handling, TUI launcher.
- `tests/e2e.rs`: black-box CLI behavior tests.

## Local Contracts

- The CLI is non-interactive by default and script-friendly.
- Keep secret-sharing behavior in `safeparts_core`.
- Do not echo share text, passphrases, or recovered secrets in errors or logs.
- Preserve established flags unless a task explicitly changes the CLI contract.

## Work Guidance

- Follow `docs/agents/conventions.md` and `docs/dev/surfaces/cli.md`.
- Add e2e coverage for user-visible command behavior.
- Prefer `--passphrase-file` in docs and examples where shell history matters.

## Verification

- `cargo test -p safeparts --test e2e`
- `cargo test --all-features`
- `cargo fmt --all -- --check`
- `cargo clippy --all-targets --all-features -- -D warnings`

## Child DOX Index

- No child AGENTS.md files yet.
