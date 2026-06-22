# Help docs

Owner: `web/help/`
Nearest contract: [`web/help/AGENTS.md`](../../../web/help/AGENTS.md)

## What belongs here

The help site is the user-facing Astro + Starlight documentation served under `/help/` in English and Arabic.

This developer guide is only for contributors working on that site.

## Change rules

- Apply the `humanizer` skill before finalizing user-facing prose.
- Keep English and Arabic route structures aligned.
- Preserve `/help/` base path behavior.
- Keep examples synthetic. Do not include real secrets or real share packets.
- Update `web/help/DOCS_MAP.md` for navigation or structure changes.
- Update `web/help/DOCS_STYLE.md` for style rules.

## Useful checks

```bash
cd web/help
bun install --frozen-lockfile
bun run build
```

For route parity and accessibility coverage:

```bash
cd web
bun run test:e2e:full
```

## When help docs change

Update:

- both English and Arabic files when route or core guidance changes
- `DOCS_MAP.md` for page map changes
- `DOCS_STYLE.md` for style rule changes
- [`docs/dev/feature-matrix.md`](../feature-matrix.md) if feature coverage changes
