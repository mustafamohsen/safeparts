## Context

The help site lives under `web/help/` and is implemented with Astro + Starlight.
The docs content follows Starlight i18n conventions:

- English (default locale): `web/help/src/content/docs/*.mdx`
- Arabic (locale `ar`): `web/help/src/content/docs/ar/*.mdx`

Today, use-case guidance exists at:

- `web/help/src/content/docs/use-cases.mdx`
- `web/help/src/content/docs/ar/use-cases.mdx`

Those pages are concise and reference-like. The goal of this change is to replace that experience with a tutorial-style guide that is discoverable and routes users to the right interface (Web UI vs CLI vs TUI).

## Goals / Non-Goals

**Goals:**

- Introduce a tutorial-style Getting Started guide that is value-first and example-heavy
- Keep English and Arabic versions in parity (same sections/examples, translated appropriately)
- Route users to Web UI / CLI / TUI depending on use case and technical comfort
- Preserve the existing docs structure and localization model
- Keep the change documentation-only (no app/CLI behavior changes)

**Non-Goals:**

- No changes to the Web UI, CLI, or TUI implementations
- No new dependencies (no diagrams/images required; ASCII is OK)
- No secret material in docs (no real-looking shares)

## Decisions

### Decision: Use Starlight locale folders (not inline bilingual tabs)

**Choice:** Implement the guide as two pages, one per locale:

- `web/help/src/content/docs/getting-started.mdx`
- `web/help/src/content/docs/ar/getting-started.mdx`

**Rationale:**

- Matches the existing docs structure used by the current Arabic pages
- Avoids mixing languages in a single document and keeps RTL handling consistent
- Keeps translation work straightforward (diff English vs Arabic file)

**Alternatives considered:**

- One file with bilingual `<Tabs>`: rejected (does not match current locale structure)

### Decision: Preserve inbound links to `use-cases`

**Choice:** Keep `use-cases.mdx` as a short stub that links to the new guide (and optionally summarizes key use cases).

**Rationale:**

- Avoids breaking existing deep links and search engine indexes
- Provides a soft transition while the new guide becomes the primary entry point

**Alternatives considered:**

- Delete `use-cases.mdx`: rejected (breaks existing links)
- Add an HTTP redirect: rejected (not currently part of Starlight config here)

### Decision: Navigation updates

**Choice:** Update docs navigation to surface the new guide:

- Sidebar "Start Here" links to `getting-started`
- Docs homepage (`index.mdx`) links to `getting-started`

### Decision: Example style

**Choice:** Examples are written as patterns:

- Provide a suggested `k` and `n`
- Provide a recommended distribution plan
- Provide a recommended interface (Web UI / CLI / TUI)
- Avoid any copy/pasteable "real share" output

## Risks / Trade-offs

[Risk] English and Arabic drift over time
→ Mitigation: Keep a consistent section outline; require parity during review

[Risk] Too much content becomes hard to scan
→ Mitigation: Use clear headings, short subsections, and quick summary lines per example

[Risk] Confusion between Web UI and CLI workflows
→ Mitigation: Tool-selection section and consistent per-example interface recommendation
