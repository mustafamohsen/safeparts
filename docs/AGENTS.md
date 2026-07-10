# AGENTS.md — Repository Docs

## Purpose

Owns internal repository documentation for agents and developers.

## Ownership

- `agents/`: coding-agent checks, conventions, and task notes.
- `dev/`: human developer onboarding, workflows, surface guides, and DX maintenance docs.
- `deployment/`: operational guides for supported deployments.

## Local Contracts

- Keep developer docs separate from end-user product docs in `README.md` and `web/help/`.
- Update `dev/feature-matrix.md` when feature behavior changes across core, CLI, TUI, WASM, web, desktop, docs, or release packaging.
- Apply the `humanizer` skill before finalizing contributor-facing prose in `dev/`.

## Work Guidance

- Prefer short operational docs with commands, owners, and update rules.
- Link to source-of-truth files instead of copying long command lists.
- Do not document secrets, real share packets, or real passphrases.

## Verification

- Run `mise run dx:verify` when docs structure, AGENTS indexes, or developer workflow docs change.
- Run the nearest build/test command when a doc change describes a command or script.

## Child DOX Index

- `agents/`: agent-oriented checks, conventions, and durable task notes.
- `dev/`: contributor onboarding, workflows, feature coverage, and surface guides.
- `deployment/`: supported deployment setup and validation guides.
