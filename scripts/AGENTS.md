# AGENTS.md — Scripts

## Purpose

Owns repository automation scripts.

## Ownership

- `release/`: local release-style archive packaging.

## Local Contracts

- Scripts must be deterministic, explicit about inputs/outputs, and avoid embedding secrets.
- Release packaging behavior should stay aligned with `scripts/release/README.md`.

## Work Guidance

- Prefer small, auditable scripts with clear error messages.
- Preserve executable behavior and documented command examples when editing packaging scripts.

## Verification

- Run the script-specific documented command when practical.

## Child DOX Index

- `release/`: release archive packaging script and README.
