## Context

Safeparts ships two distinct web surfaces:

- **Web app**: Vite + React UI (`web/`) for split/combine workflows.
- **Help docs**: Astro + Starlight site (`web/help/`) deployed under `/help/`.

The goal of this change is to make both surfaces fully accessible (WCAG 2.2 AA target) across:

- Keyboard-only navigation
- Screen readers
- Mobile touch
- High zoom / reflow
- English (LTR) and Arabic (RTL)

Constraints:

- **No branding changes**: do not change existing colors or font families.
- **Font size changes**: only if required to satisfy accessibility requirements (e.g., touch targets / readability / focus visibility).

Current state (high-level):

- Many controls are already semantic (`<button>`, `<a>`, `<label>`), but some key UI patterns are missing accessibility semantics (e.g., tabset state), and status/feedback is not consistently announced.
- Inputs get a focus ring via shared styles, but focus visibility for non-input controls is not consistently specified.
- Docs are Starlight-based (good baseline), but we intentionally operate them as **dark-only**, and we add custom behavior (e.g., forced `target=_blank`) that must remain accessible.

## Goals / Non-Goals

**Goals:**
- Implement the requirements defined in:
  - `specs/web-app-accessibility/spec.md`
  - `specs/docs-accessibility/spec.md`
  - `specs/bilingual-rtl-accessibility/spec.md`
  - `specs/web-typography/spec.md`
- Add **automated accessibility tests** for both the web app and docs.
- Add **CI coverage** so accessibility regressions fail builds.

**Non-Goals:**
- Visual redesign, rebranding, new color palette, or font-family changes.
- Large refactors unrelated to accessibility (keep changes scoped and reviewable).

## Decisions

### Decision 1: Prefer native semantics; use ARIA only to express missing state

Approach:

- Keep using native controls (`button`, `a`, `input`, `select`, `textarea`) wherever possible.
- Add ARIA only where the UI pattern requires expressing state/relationships:
  - Split/Combine toggle: `role="tablist"`, tabs with `role="tab"`, `aria-selected`, `aria-controls`, and panels with `role="tabpanel"`.
  - Language toggle: treat as a toggle-group using `aria-pressed` (or `role="radiogroup"` + `role="radio"`) so the current selection is announced.

Rationale:
- Native semantics are more robust across browsers and assistive technologies.

### Decision 2: Centralize focus-visible styling across all interactive controls

Approach:

- Introduce a consistent `:focus-visible` treatment for buttons/links/toggles that matches existing brand colors.
- Do not remove outlines unless replaced with an equally visible indicator.

Rationale:
- Focus visibility is frequently a top source of accessibility failures, and centralizing the style reduces drift.

### Decision 3: Use explicit programmatic relationships for field hints and errors

Approach:

- Ensure each field has an accessible name (label).
- Where hint text is present, connect it to the field via `aria-describedby`.
- Where errors apply to a specific field, mark `aria-invalid="true"` and connect error text via `aria-describedby`.

Rationale:
- Screen reader users should get the same context that sighted users get visually.

### Decision 4: Add a shared live region for status updates (errors and copy success)

Approach:

- Add a small, centralized `aria-live` region (polite for success, assertive for errors where appropriate).
- Route copy success and operation errors through the live region.

Alternatives considered:
- Rely on focus management (move focus to the error). Rejected as it can be disruptive, and announcing is usually sufficient.

Rationale:
- The specs require that status is announced “without requiring navigation”.

### Decision 5: Respect `prefers-reduced-motion` for animated text

Approach:

- Detect reduced motion and disable/reduce animated effects.
- Ensure screen readers always read the final text and not scrambled glyphs.

Rationale:
- Motion can be harmful for some users, and the EncryptedText effect should not harm assistive tech output.

### Decision 6: Automated accessibility tests with Playwright + axe-core

Approach:

- Add Playwright-based end-to-end runs for:
  - Web app: split and combine screens.
  - Docs: a representative set of routes including Arabic locale.
- Use axe-core integration (e.g., `@axe-core/playwright`) and fail the test suite on violations.
- Scope rules to the product requirements:
  - Target 0 `serious` / 0 `critical` (per specs), and ideally 0 violations total.

Rationale:
- Unit tests do not catch many a11y issues; e2e + axe is the highest leverage regression guard.

### Decision 7: Add CI coverage in GitHub Actions

Approach:

- Extend `.github/workflows/ci.yml` with a new job for the web stack:
  - Install Bun
  - `bun install` under `web/`
  - Build WASM if required by the UI build
  - Build app + docs
  - Run Playwright + axe a11y tests

Rationale:
- “100% accessibility support” needs enforced regression checks.

## Risks / Trade-offs

- **False positives / noisy axe rules** → Start with WCAG-aligned core rules; suppress only with documented justification.
- **CI runtime increase** → Keep page set small and focused; use Playwright’s minimal browser matrix (Chromium first).
- **Hard constraint of no color changes** → Some contrast failures may require alternative mitigations (layout, borders, font size/weight, or focus ring thickness) rather than color changes.
- **RTL edge cases** → Validate shares/secrets rendering in Arabic UI; enforce `dir="ltr"` for tokens and `dir="auto"` for freeform recovered text.
