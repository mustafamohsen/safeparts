# AGENTS.md — Developer Automation Scripts

## Purpose

Owns local developer-experience diagnostics and verification helpers.

## Ownership

- `doctor.py`: read-only local environment diagnostics.
- `verify_dx.py`: repository DX consistency checks.
- `check_desktop_parity.py`: copied web/desktop UI parity guard.
- `rust_coverage.py`: Rust coverage runner, production-code filter, report writer, and floor gate.
- `test_rust_coverage.py`: unit tests for coverage filtering and floor diagnostics.
- `rustsec_audit.py`: Cargo audit runner and exact policy-exception gate.
- `test_rustsec_audit.py`: unit tests for RustSec finding classification.
- `README.md`: local script usage notes.

## Local Contracts

- Scripts must be deterministic and explicit about failures; generated reports belong under `target/`.
- Do not print secrets, share text, passphrases, or reconstructed secrets.
- Prefer actionable messages that name the command or file to fix.

## Work Guidance

- Keep scripts dependency-free unless a task explicitly approves a new runtime dependency.
- Avoid network calls in diagnostics.
- Make checks pass from the repository root.

## Verification

- Run changed scripts directly with `python3`.
- Coverage automation: `python3 scripts/dev/test_rust_coverage.py` and `mise run coverage`.
- RustSec automation: `python3 scripts/dev/test_rustsec_audit.py` and `mise run audit`.
- Run `mise run dx:verify` when changing DX checks.

## Child DOX Index

- No child AGENTS.md files yet.
