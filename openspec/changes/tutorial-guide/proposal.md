## Why

The current `use-cases.mdx` is a reference-style document with brief bullet points. Users need a comprehensive tutorial-style guide that:
- Explains concepts intuitively with examples and diagrams
- Helps readers choose the right tool (Web UI vs CLI vs TUI) based on their use case and technical competency
- Provides many real-world examples spanning personal, family, team, and enterprise scenarios
- Is bilingual (English and Arabic) to serve a broader audience
- Balances accessibility for non-technical users with depth for enterprise deployments

## What Changes

- Replace `web/help/src/content/docs/use-cases.mdx` with a new tutorial guide
- Create bilingual content (English and Arabic) using Starlight's tab component
- Include visual ASCII diagrams for conceptual explanations
- Add a tool selection decision tree (Web UI vs CLI vs TUI)
- Provide 12+ detailed examples with configuration recommendations
- Include best practices and common mistakes sections
- Update sidebar and index links to point to the new guide

## Capabilities

### New Capabilities
- `getting-started-guide`: Comprehensive tutorial guide covering k-of-n concept, tool selection, and real-world examples in English and Arabic

### Modified Capabilities
- (none)

## Impact

- Documentation: `web/help/src/content/docs/getting-started.mdx`
- Arabic documentation: `web/help/src/content/docs/ar/getting-started.mdx`
- Configuration: `web/help/astro.config.mjs` (sidebar update)
- Index page: `web/help/src/content/docs/index.mdx` (link update)
