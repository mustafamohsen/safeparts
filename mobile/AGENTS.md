# AGENTS.md — Mobile Prototype

## Purpose

Owns mobile-related prototype artifacts and native workspace remnants.

## Ownership

- `src-native/`: native/Rust mobile support artifacts when present.
- `.expo/` and `node_modules/`: local/generated tool state; avoid editing directly.

## Local Contracts

- Keep mobile secret-handling expectations aligned with the web and Rust core: secrets stay local, logs stay clean.
- Do not commit generated dependency or build output changes unless explicitly required.

## Work Guidance

- Inspect the current mobile toolchain files before assuming an Expo or native workflow exists.
- Keep mobile changes isolated from web/Rust workspace changes unless integration is part of the task.

## Verification

- Use mobile-specific build/test commands only after confirming the current toolchain files.

## Child DOX Index

- No child AGENTS.md files yet.
