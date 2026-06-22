# Mobile prototype

Owner: `mobile/`
Nearest contract: [`mobile/AGENTS.md`](../../../mobile/AGENTS.md)

## Current state

Mobile is a prototype/remnant area. Do not assume there is an active Expo, React Native, or native workflow without checking the files that exist now.

Tracked source is minimal. Local dependency and build output should stay untracked.

## Change rules

Before reviving mobile work, define:

- the active toolchain
- install, build, test, and run commands
- how mobile calls the core secret-sharing logic
- secret-handling rules equal to web and desktop
- whether a new child `AGENTS.md` is needed for source folders

Do not commit generated dependency folders or build output.

## Useful checks

There is no standard mobile verification command yet. Inspect the current mobile toolchain files before running commands.

## When mobile changes

Update:

- [`mobile/AGENTS.md`](../../../mobile/AGENTS.md)
- [`docs/dev/feature-matrix.md`](../feature-matrix.md)
- this guide with real setup and verification commands
