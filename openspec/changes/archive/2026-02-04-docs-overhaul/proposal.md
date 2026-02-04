## Why

The help docs currently feel inconsistent in voice and structure, and the English/Arabic pages can drift out of sync.
This change rewrites the docs to be clear, intentional, and maintainable while meeting the repo's accessibility and localization standards.

## What Changes

- Rewrite the full docs set (English + Arabic) with a consistent tone, tighter structure, and clearer information architecture.
- Establish a small, opinionated docs content system (voice + structure + component conventions) and apply it across all pages.
- Enforce bilingual parity: every page/section in English has an equivalent in Arabic with matching intent and navigation.
- Make Starlight components a first-class part of the docs writing style (used purposefully, not decoratively).
- Strengthen automated docs accessibility coverage so all help pages pass Playwright + axe checks.

## Capabilities

### New Capabilities

- `docs-content-system`: Define and apply a docs-wide standard for structure, tone, and purposeful Starlight component usage across the help site (EN + AR), while keeping the same topic coverage (use cases, tutorials, installation, security, and the "why/how it works" science).

### Modified Capabilities

- `docs-accessibility`: Expand the docs a11y contract from representative pages to the full docs route set, so the rewrite cannot regress accessibility.
- `bilingual-rtl-accessibility`: Add explicit requirements for docs parity (EN/AR staying in sync) and mixed-direction safety in Arabic docs (shares, hashes, base64/base58, mnemonics).

## Impact

- Docs content and structure: `web/help/src/content/docs/**/*.mdx`
- Docs theme/components conventions: `web/help/src/styles/theme.css` and (if needed) `web/help/astro.config.mjs`
- CI and a11y coverage: `web/tests/docs.a11y.spec.ts` (and any helper utilities it depends on)
