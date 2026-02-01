## Context

The Safeparts help documentation at `web/help/` uses Starlight (Astro-based docs theme). Currently:
- `use-cases.mdx` provides brief reference-style bullet points for scenarios
- No comprehensive tutorial exists that walks users through concepts and tool selection
- Bilingual support exists but needs full Arabic translation
- Examples are sparse and don't cover the spectrum from personal to enterprise use cases

## Goals / Non-Goals

**Goals:**
- Create a tutorial-style guide that replaces use-cases.mdx
- Use Starlight's `<Tabs>` component for bilingual (English/Arabic) content
- Include visual ASCII diagrams for conceptual explanations
- Provide tool selection guidance (Web UI vs CLI vs TUI)
- Cover 12+ detailed examples with configurations
- Include best practices and common mistakes sections

**Non-Goals:**
- Don't modify the web UI application code
- Don't change the CLI/TUI interfaces
- Don't create new specs for capabilities (documentation-only change)
- Don't translate content beyond English and Arabic

## Decisions

### Decision 1: File structure

**Choice:** Create `getting-started.mdx` as the main guide, remove `use-cases.mdx`

**Rationale:**
- `getting-started` is a more descriptive name than `tutorial`
- Follows Starlight conventions for onboarding content
- Allows keeping `use-cases` reference-style as separate content if needed later

**Alternatives considered:**
- Add to existing `index.mdx` - rejected (too long, dilutes homepage)
- Keep `use-cases.mdx` alongside new guide - rejected (proposal says replace)

### Decision 2: Bilingual implementation

**Choice:** Use Starlight's `<Tabs>` component with English and Arabic tabs

**Rationale:**
- Native Starlight support for i18n
- Clean visual presentation
- Easy to maintain (both languages in same file)
- Works with RTL layout for Arabic

**Alternatives considered:**
- Separate English and Arabic files - rejected (duplication, harder to sync)
- Auto-translate existing content - rejected (quality concerns)

### Decision 3: Content organization

**Choice:** Structure as:
1. Why Secret Sharing? (concept with diagrams)
2. The k-of-n Mental Model (intuitive explanation)
3. Your Tool, Your Choice (decision tree)
4. Quick Start (5-minute hands-on)
5. Examples by Situation (main section with many examples)
6. Best Practices
7. Common Mistakes
8. Next Steps

**Rationale:**
- Follows progressive disclosure (concept → tool → examples → details)
- Mirrors user journey from understanding to action
- Groups examples by persona (personal, family, team, enterprise)

**Alternatives considered:**
- Organize by encoding type - rejected (not user-centric)
- Separate conceptual and practical sections - rejected (loses flow)

### Decision 4: Example depth

**Choice:** 12+ examples with configuration (k/n values), distribution strategy, tool recommendation, and rationale

**Rationale:**
- Provides actionable guidance, not just concepts
- Each example should be copy-pasteable as starting point
- Balances breadth (many scenarios) with depth (actionable details)

**Examples to include:**
1. Personal: Password manager recovery key
2. Personal: Cryptocurrency seed phrase
3. Personal: Digital legacy/estate planning
4. Family: Shared streaming account
5. Developer: Personal access tokens
6. DevOps: Break-glass access
7. Small business: Shared service accounts
8. Agency: Client website access
9. Startup: Cofounder access
10. Enterprise: Credential rotation policy
11. Compliance: Separation of duties
12. High-risk: Journalist/activist source protection

### Decision 5: Visual elements

**Choice:** Use ASCII diagrams for:
- Traditional backup vs k-of-n comparison
- k-of-n vault analogy
- Tool comparison table
- Decision tree for tool selection

**Rationale:**
- No external dependencies
- Works in terminal and web
- Lightweight, fast to render
- Consistent with CLI-first aesthetic

## Risks / Trade-offs

[Risk] Content drift between English and Arabic
→ Mitigation: Use `<Tabs>` to keep both in same file, review together

[Risk] Guide becomes outdated as Safeparts evolves
→ Mitigation: Keep examples as patterns, not fixed configurations; link to interface docs for details

[Risk] Too long for effective onboarding
→ Mitigation: Make each section skippable; "Next Steps" links to interface docs for depth

[Risk] Users skip to examples without understanding concepts
→ Mitigation: Progressive disclosure; concepts are prerequisites for examples section

## Migration Plan

1. Create `getting-started.mdx` (English and Arabic)
2. Update `astro.config.mjs` sidebar to point to `getting-started` instead of `use-cases`
3. Update `index.mdx` link to new guide
4. Delete old `use-cases.mdx` files (English and Arabic)
5. Verify build succeeds
6. Deploy with Netlify

**Rollback:** Restore `use-cases.mdx` from git history if issues arise.

## Open Questions

- Should we keep a short reference-style summary alongside the tutorial?
- Should examples include sample outputs (shares)?
- Should we add a "dry run" exercise for users to practice?
