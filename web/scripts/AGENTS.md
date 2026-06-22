# AGENTS.md — Web Scripts

## Purpose

Owns web-specific helper scripts.

## Ownership

- `build-wasm.sh`: builds `crates/safeparts_wasm` into the generated browser package under `web/src/wasm_pkg/`.

## Local Contracts

- Keep scripts deterministic and explicit about installed tool versions.
- Do not commit generated `web/src/wasm_pkg/` output unless a task explicitly changes generated artifact policy.
- Do not add scripts that upload secrets or share material.

## Work Guidance

- Follow `docs/dev/generated-artifacts.md` and `docs/dev/surfaces/wasm.md`.
- Keep local and CI WASM build behavior aligned.

## Verification

- `cd web && bun run build:wasm`
- `cd web && bun run typecheck`
- `mise run dx:verify` when generated artifact policy changes

## Child DOX Index

- No child AGENTS.md files yet.
