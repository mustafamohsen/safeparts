# Safeparts Help Docs Map

This file tracks the intended coverage and the EN/AR page mapping.

## Route map (must stay in sync)

- `/help/` <-> `/help/ar/`
- `/help/getting-started/` <-> `/help/ar/getting-started/`
- `/help/use-cases/` <-> `/help/ar/use-cases/`
- `/help/build-and-run/` <-> `/help/ar/build-and-run/`
- `/help/security/` <-> `/help/ar/security/`
- `/help/project/` <-> `/help/ar/project/`
- `/help/encodings/` <-> `/help/ar/encodings/`
- `/help/cli/` <-> `/help/ar/cli/`
- `/help/tui/` <-> `/help/ar/tui/`
- `/help/web-ui/` <-> `/help/ar/web-ui/`
- `/help/troubleshooting/` <-> `/help/ar/troubleshooting/`
- `/help/developer-guide/` <-> `/help/ar/developer-guide/`
- `/help/developer-guide/library-api/` <-> `/help/ar/developer-guide/library-api/`
- `/help/developer-guide/encodings-and-packets/` <-> `/help/ar/developer-guide/encodings-and-packets/`
- `/help/developer-guide/testing-and-errors/` <-> `/help/ar/developer-guide/testing-and-errors/`
- `/help/it-devops-guide/` <-> `/help/ar/it-devops-guide/`
- `/help/it-devops-guide/cli-runbooks/` <-> `/help/ar/it-devops-guide/cli-runbooks/`
- `/help/it-devops-guide/break-glass/` <-> `/help/ar/it-devops-guide/break-glass/`
- `/help/it-devops-guide/automation/` <-> `/help/ar/it-devops-guide/automation/`

## Topic coverage (high level)

- Getting started: mental model, choosing k/n, a safe practice run
- Use cases: curated scenarios and decision guidance
- Build & run: install/build/run for CLI/TUI/web/docs
- Security: threat model, storage rules, passphrases, operational safety
- How it works: high-level explanation of secret sharing, integrity tag, optional encryption
- Encodings: trade-offs (copy/paste vs human transcription)
- CLI: script-friendly recipes and failure modes
- TUI: offline workflow and shortcuts
- Web UI: local-only WASM, privacy boundaries
- Troubleshooting: common errors and fixes
- Developer guide: Rust library integration, exposed `safeparts_core` functions, share packet encodings, integration tests, and error handling
- IT/devops guide: CLI runbooks, break-glass operations, automation boundaries, and CI pipeline patterns
