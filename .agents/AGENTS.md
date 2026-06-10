# AGENTS.md — Project Agent Skills

## Purpose

Owns repository-local agent skills used by coding assistants.

## Ownership

- `skills/`: skill definitions and supporting materials.

## Local Contracts

- Skill instructions should be concise, operational, and scoped to their trigger conditions.
- Do not store secrets, credentials, or sensitive share material in skills or examples.

## Work Guidance

- Update a skill's `SKILL.md` and adjacent support files together when behavior changes.
- Keep examples synthetic and project-safe.

## Verification

- Manually inspect changed skill trigger descriptions and referenced relative paths.

## Child DOX Index

- `skills/diagnose/`: disciplined bug/performance diagnosis loop.
- `skills/frontend-design/`: production-grade frontend design guidance.
- `skills/grill-me/`: interview workflow for stress-testing plans.
- `skills/grill-with-docs/`: interview workflow tied to project context and ADR-style docs.
- `skills/handoff/`: conversation handoff document generation.
- `skills/improve-codebase-architecture/`: architecture deepening and reporting workflow.
- `skills/remotion-best-practices/`: Remotion video guidance.
- `skills/web-design-guidelines/`: UI/accessibility review guidance.
