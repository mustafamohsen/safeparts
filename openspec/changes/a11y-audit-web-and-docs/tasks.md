## 1. Test Harness (Automated A11y)

<<<<<<< HEAD
- [x] 1.1 Add Playwright test setup under `web/` and choose a stable port strategy for local/CI runs
- [x] 1.2 Add axe-core integration for Playwright (web app): scan Split and Combine screens and fail on violations
- [x] 1.3 Add axe-core integration for Playwright (docs): scan `/help/`, a representative content page, and `/help/ar/`
- [x] 1.4 Ensure tests enforce the spec threshold (0 critical/serious; prefer 0 total violations)

## 2. Web App: Keyboard + Focus

- [x] 2.1 Add consistent `:focus-visible` styling for links/buttons/toggles without changing colors
- [x] 2.2 Ensure all interactive controls meet minimum touch target size (44x44) where required (may adjust padding/font size only if needed)

## 3. Web App: Semantics + Announcements

- [x] 3.1 Implement Split/Combine as an accessible tabset (tablist/tab/tabpanel, `aria-selected`, `aria-controls`)
- [x] 3.2 Implement language toggle with announced selected state (e.g., `aria-pressed` or radio semantics)
- [x] 3.3 Add a shared live region for status updates; route operation errors through it
- [x] 3.4 Make Copy success feedback accessible (announced via live region or `aria-live`)
- [x] 3.5 Associate field hints with inputs using `aria-describedby` where needed
- [x] 3.6 Associate field-specific validation errors with inputs (`aria-invalid` + `aria-describedby`) where needed

## 4. Web App: Motion + Screen Reader Safety

- [x] 4.1 Update `EncryptedText` to respect `prefers-reduced-motion`
- [x] 4.2 Ensure screen readers read the final text and not scrambled glyphs (avoid announcing intermediate characters)

## 5. Docs: Accessibility Hardening

- [x] 5.1 Ensure docs are dark-only with no light theme fallback and no theme toggle UI
- [x] 5.2 Ensure external links that open new tabs are announced (accessible label/description)

## 6. Bilingual / RTL Verification

- [x] 6.1 Verify document `lang`/`dir` behavior for app language toggle and docs Arabic locale
- [x] 6.2 Verify mixed-direction content: shares render LTR in Arabic UI, recovered secret renders with appropriate direction

## 7. CI

- [x] 7.1 Add CI job to run `bun install`/build (including WASM build if required) and execute Playwright + axe tests
- [x] 7.2 Ensure CI fails on accessibility regressions and runs on PRs
