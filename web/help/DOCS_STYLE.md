# Safeparts Docs Style

This is a maintainer-facing guide for the help site under `web/help/`.
It exists to keep the English and Arabic docs consistent, readable, and easy to review.

## Voice (what to sound like)

- Be direct and practical. Prefer instructions and concrete trade-offs.
- Assume the reader is careful but may be stressed (recovery scenarios).
- Say what the tool does and does not do. Avoid implied guarantees.
- Avoid marketing tone and filler ("powerful", "effortless", "just", "simply").
- Prefer short paragraphs and strong headings.

Quick check:

- Does the page help a user make a decision or complete a procedure?
- Are safety constraints explicit and easy to spot?

## Structure and components

Default patterns (use when they improve clarity):

- `<CardGrid>`: curated navigation, "choose your path", page-level entry points.
- `<Steps>`: procedures a user should follow linearly. Do not use for minor lists.
- Callouts (`:::note`, `:::tip`, `:::caution`, `:::danger`): safety posture and sharp constraints.

Avoid:

- Long Markdown bullet lists for procedures.
- Using components as decoration.

## Inline tokens (don’t use code styling for everything)

- Variables: `<var>` (e.g. <var>k</var>, <var>n</var>)
- Keys/shortcuts: `<kbd>`
- UI/status strings: `<samp>`
- Small labels/values: `<span class="token">…</span>` (use `dir="ltr"` in Arabic pages)
- Reserve inline code for actual code/commands only.

## Bilingual parity rules (EN/AR)

- Keep a 1:1 file map: `docs/<slug>.mdx` <-> `docs/ar/<slug>.mdx`.
- Keep section intent aligned. Arabic is not a "summary" of English.
- Keep navigation and cross-links locale-relative:
  - English: `project/`, `./project/`
  - Arabic: `./project/` (stays under `/help/ar/`)
- Any example token that could be re-ordered by RTL context MUST be rendered LTR in Arabic (`dir="ltr"`).
