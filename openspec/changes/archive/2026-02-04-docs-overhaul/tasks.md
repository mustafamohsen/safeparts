## 1. Plan and content system

- [x] 1.1 Audit current docs pages and map required topics/sections (EN + AR)
- [x] 1.2 Define docs voice rules and editing checklist (what to avoid, what to prefer)
- [x] 1.3 Define component usage rules (when to use Steps, Tabs, CardGrid, callouts)
- [x] 1.4 Define bilingual parity rules (file map, section parity, cross-link conventions)

## 2. Rewrite English docs

- [x] 2.1 Rewrite `web/help/src/content/docs/index.mdx` (navigation, positioning, next steps)
- [x] 2.2 Rewrite `web/help/src/content/docs/getting-started.mdx` (tutorial/guide tone, clear workflow)
- [x] 2.3 Rewrite `web/help/src/content/docs/use-cases.mdx` (curated scenarios, decision guidance)
- [x] 2.4 Rewrite `web/help/src/content/docs/build-and-run.mdx` (install/build/run for CLI/TUI/Web/Docs)
- [x] 2.5 Rewrite `web/help/src/content/docs/security.mdx` (threat model, storage rules, passphrases)
- [x] 2.6 Rewrite `web/help/src/content/docs/project.mdx` (how it works/science, integrity, encryption)
- [x] 2.7 Rewrite `web/help/src/content/docs/encodings.mdx` (trade-offs, when to choose which)
- [x] 2.8 Rewrite `web/help/src/content/docs/cli.mdx` (practical, script-friendly examples)
- [x] 2.9 Rewrite `web/help/src/content/docs/tui.mdx` (offline workflow and key shortcuts)
- [x] 2.10 Rewrite `web/help/src/content/docs/web-ui.mdx` (local-only WASM behavior, privacy notes)
- [x] 2.11 Rewrite `web/help/src/content/docs/troubleshooting.mdx` (common failure modes and fixes)

## 3. Rewrite Arabic docs in lockstep

- [x] 3.1 Mirror `index.mdx` rewrite to `web/help/src/content/docs/ar/index.mdx` (locale-correct links)
- [x] 3.2 Mirror `getting-started.mdx` rewrite to `web/help/src/content/docs/ar/getting-started.mdx`
- [x] 3.3 Mirror `use-cases.mdx` rewrite to `web/help/src/content/docs/ar/use-cases.mdx`
- [x] 3.4 Mirror `build-and-run.mdx` rewrite to `web/help/src/content/docs/ar/build-and-run.mdx`
- [x] 3.5 Mirror `security.mdx` rewrite to `web/help/src/content/docs/ar/security.mdx`
- [x] 3.6 Mirror `project.mdx` rewrite to `web/help/src/content/docs/ar/project.mdx`
- [x] 3.7 Mirror `encodings.mdx` rewrite to `web/help/src/content/docs/ar/encodings.mdx`
- [x] 3.8 Mirror `cli.mdx` rewrite to `web/help/src/content/docs/ar/cli.mdx`
- [x] 3.9 Mirror `tui.mdx` rewrite to `web/help/src/content/docs/ar/tui.mdx`
- [x] 3.10 Mirror `web-ui.mdx` rewrite to `web/help/src/content/docs/ar/web-ui.mdx`
- [x] 3.11 Mirror `troubleshooting.mdx` rewrite to `web/help/src/content/docs/ar/troubleshooting.mdx`

## 4. Automation: parity and accessibility

- [x] 4.1 Add a route parity check (EN vs AR) to fail CI when docs route sets diverge
- [x] 4.2 Update `web/tests/docs.a11y.spec.ts` to scan all docs routes (EN + AR), not only representative pages
- [x] 4.3 Ensure the docs remain dark-only and the theme toggle is not present in the DOM
- [x] 4.4 Ensure mixed-direction tokens in Arabic docs are rendered safely (dir=ltr wrappers for shares/hashes/paths)

## 5. Component and token hygiene

- [x] 5.1 Replace long procedural Markdown lists with `<Steps>` where it improves followability
- [x] 5.2 Use semantic tokens consistently (`<var>`, `<kbd>`, `<samp>`, `.token`) and avoid using inline code for non-code
- [x] 5.3 Run `bun run build` in `web/help/` and `bun run test:a11y` in `web/` and fix any failures
