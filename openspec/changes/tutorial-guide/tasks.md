## 1. Branch Setup

- [x] 1.1 Create dedicated branch `feat/help-getting-started-guide`
- [x] 1.2 Verify working tree is clean before edits

## 2. English Guide (Default Locale)

- [x] 2.1 Create `web/help/src/content/docs/getting-started.mdx` with a tutorial-style outline
- [x] 2.2 Write value-first intro explaining why k-of-n helps (failure + compromise)
- [x] 2.3 Add tool selection guidance (Web UI vs CLI vs TUI) with links to existing pages
- [x] 2.4 Add at least 12 real-world examples with recommended k/n, storage pattern, and best interface
- [x] 2.5 Add safety warnings (no real shares; avoid chat/tickets/logs)

## 3. Arabic Guide (ar Locale)

- [x] 3.1 Create `web/help/src/content/docs/ar/getting-started.mdx` translated from English
- [x] 3.2 Ensure Arabic content mirrors the English structure and examples (parity)
- [x] 3.3 Verify RTL rendering and that code/commands remain legible

## 4. Navigation Updates

- [x] 4.1 Update `web/help/astro.config.mjs` sidebar Start Here section to include `getting-started`
- [x] 4.2 Update `web/help/src/content/docs/index.mdx` homepage cards to point to `getting-started`

## 5. Preserve Use Cases Links

- [x] 5.1 Update `web/help/src/content/docs/use-cases.mdx` to be a short stub linking to `getting-started`
- [x] 5.2 Update `web/help/src/content/docs/ar/use-cases.mdx` similarly (Arabic stub)

## 6. Verify

- [x] 6.1 Run `cd web/help && bun install && bun run build`
- [x] 6.2 Confirm `getting-started` pages render for both locales
- [x] 6.3 Check that existing links to `use-cases` still work and point users to the new guide

## 7. Commit and PR

- [ ] 7.1 Commit changes (docs + nav)
- [ ] 7.2 Push branch and open PR
