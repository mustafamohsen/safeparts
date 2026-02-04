## Context

Safeparts ships a bilingual (English + Arabic) help site built with Astro + Starlight under `web/help/`.
The current docs cover the right topics, but the tone and structure are uneven, and the English/Arabic versions can drift.

Constraints:

- Keep docs deployed under `/help/` and preserve existing route slugs where practical.
- English and Arabic content must stay in sync (same intent, same navigation, comparable structure).
- Use Starlight components deliberately (they should add clarity, not decoration).
- All docs routes must pass Playwright + axe accessibility checks.
- Docs are dark-only (no theme UI; no OS-driven light fallback).

Stakeholders:

- Users: need clear operational guidance (how to split/recover safely) and correct expectations (what this tool does and does not do).
- Maintainers: need a docs system that is easy to keep consistent, bilingual, and accessible over time.

## Goals / Non-Goals

**Goals:**

- Establish a consistent docs voice and information architecture that matches the product: practical, careful, and non-promotional.
- Restructure and rewrite all docs pages (EN + AR) while retaining the overall purpose and topic coverage.
- Define conventions for when to use Starlight components vs plain prose.
- Add automated guardrails so the rewrite cannot regress a11y or bilingual parity.

**Non-Goals:**

- Changing the underlying split/combine algorithms, packet formats, or cryptography.
- Turning the docs into a full cryptography textbook.
- Adding a general translation framework or external localization service.

## Decisions

### Decision: Treat docs as a product surface with explicit content rules

We will codify a small "docs content system" (tone + structure + component conventions) and apply it across every page.

Alternatives considered:

- "Just rewrite pages" without a shared standard. Rejected: drift returns quickly and reviewers lack a crisp rubric.

### Decision: Bilingual parity is enforced by structure, not only by translation quality

We will keep a 1:1 file map between English and Arabic docs and enforce parity in CI:

- Every English page has an Arabic counterpart.
- Navigation entry points (index cards, cross-links) point to the correct locale.

Alternatives considered:

- Allowing partial Arabic coverage. Rejected: violates project direction and creates a maintenance trap.

### Decision: Purposeful Starlight components are the default for "procedures" and "choices"

Component guidelines (docs-wide):

- Use `<Steps>` for significant procedures (multi-step tasks that a user might follow linearly).
- Use callouts (`:::note`, `:::tip`, `:::caution`, `:::danger`) for safety posture and sharp constraints.
- Use `CardGrid`/cards for curated navigation and "choose your path" moments.
- Prefer semantic inline tokens for non-code content:
  - variables: `<var>`
  - keys: `<kbd>`
  - UI/status strings: `<samp>`
  - small labels/tokens: `<span class="token">...`</span>

Alternatives considered:

- Markdown lists everywhere. Rejected: loses scannability on procedural content and underuses Starlight strengths.

### Decision: Expand docs a11y checks to all routes in both locales

We will update `web/tests/docs.a11y.spec.ts` to enumerate docs routes and run axe scans across:

- Every English doc page under `/help/`
- Every Arabic doc page under `/help/ar/`

This aligns the test contract with the user requirement that "all pages must pass the a11y tests".

Alternatives considered:

- Keeping representative-page scans only. Rejected: a rewrite can easily introduce a one-off violation on an untested page.

### Decision: Keep URLs stable; use redirects only when necessary

We will prefer editing content in-place under existing slugs. If a slug must change for clarity, we will add explicit redirects in Starlight routing (or keep a stub page that links forward) to avoid broken inbound links.

## Risks / Trade-offs

- Increased CI runtime due to scanning every docs route -> Mitigation: enumerate routes from the file tree and keep scans lightweight; keep Playwright workers at 1 in CI (already configured).
- English/Arabic drift over time -> Mitigation: add a parity check that fails CI when route sets diverge; keep cross-links locale-relative.
- "Component overuse" makes pages noisy -> Mitigation: treat components as structure, not decoration; keep prose-first and use components only when they improve navigation or procedures.
- RTL + mixed-direction pitfalls in Arabic pages -> Mitigation: enforce `dir="ltr"` for shares/hashes/tokens and keep semantic token styling consistent.
