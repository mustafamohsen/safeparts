## Why

We want the Safeparts web app and help docs to be fully usable with assistive technologies (screen readers, keyboard-only navigation, high zoom, and Arabic RTL) without changing branding (colors/fonts). Today, several interactive patterns rely on visual affordances and do not consistently expose state and feedback to accessibility APIs.

## What Changes

- Define explicit, testable accessibility requirements (WCAG-aligned) for both the web app and the docs.
- Cover bilingual behavior (English LTR + Arabic RTL) including language attributes and direction.
- Require consistent keyboard navigation, focus visibility, labeling, and status/error announcements.
- Constrain changes: no branding changes (colors/fonts); font-size changes only when required for readability/accessibility.

## Capabilities

### New Capabilities
- `web-app-accessibility`: Accessibility requirements for the Vite/React web UI (split/combine flows).
- `docs-accessibility`: Accessibility requirements for the Astro/Starlight help site.
- `bilingual-rtl-accessibility`: Shared requirements for English/Arabic language, direction, and mixed-direction content.

### Modified Capabilities
- `web-typography`: Clarify accessibility constraints around typography changes (no font/color changes; font-size adjustments allowed only when needed).

## Impact

- Web app: `web/src/App.tsx`, `web/src/components/*.tsx`, `web/src/styles.css`
- Docs: `web/help/astro.config.mjs`, `web/help/src/**/*.astro`, `web/help/src/styles/theme.css`
- Testing/tooling: potential addition of automated accessibility checks (e.g., axe) in CI and/or local scripts.
