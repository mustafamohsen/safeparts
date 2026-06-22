# AGENTS.md — Web Source

## Purpose

Owns the Vite + React browser application source and generated WASM package boundary.

## Ownership

- `App.tsx`, `main.tsx`: app shell and startup.
- `components/`: split/combine UI, shared controls, and visual components.
- `hooks/`, `context/`, `lib/`: browser UI support code.
- `i18n.ts`: English/Arabic UI strings and direction handling.
- `styles.css`, `assets/`: web styling and assets.
- `wasm.ts`: generated WASM package loader.
- `wasm_pkg/`: generated output from `bun run build:wasm`.

## Local Contracts

- Split/combine stays local to the browser through WASM.
- Do not hand-edit `wasm_pkg/` unless the task explicitly targets generated artifacts.
- Preserve accessibility, keyboard behavior, live-region feedback, and RTL support when changing UI.
- Desktop UI parity depends on copied files from this subtree.

## Work Guidance

- Follow `docs/agents/conventions.md` and `docs/dev/surfaces/web.md`.
- Keep WASM boundary types explicit and avoid `any` in new TypeScript code.
- Use project browser automation for manual smoke checks unless Playwright is explicitly requested.

## Verification

- `cd web && bun run build:wasm`
- `cd web && bun run typecheck`
- `cd web && bun run build`
- `cd web && bun run test:e2e:smoke`
- `mise run desktop:parity` when copied UI files change

## Child DOX Index

- No child AGENTS.md files yet.
