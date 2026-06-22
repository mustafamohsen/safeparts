# AGENTS.md — Developer Automation Scripts

## Purpose

Owns local developer-experience diagnostics and verification helpers.

## Ownership

- `doctor.py`: read-only local environment diagnostics.
- `verify_dx.py`: repository DX consistency checks.
- `check_desktop_parity.py`: copied web/desktop UI parity guard.
- `README.md`: local script usage notes.

## Local Contracts

- Scripts must be deterministic, read-only by default, and explicit about failures.
- Do not print secrets, share text, passphrases, or reconstructed secrets.
- Prefer actionable messages that name the command or file to fix.

## Work Guidance

- Keep scripts dependency-free unless a task explicitly approves a new runtime dependency.
- Avoid network calls in diagnostics.
- Make checks pass from the repository root.

## Verification

- Run changed scripts directly with `python3`.
- Run `mise run dx:verify` when changing DX checks.

## Child DOX Index

- No child AGENTS.md files yet.
