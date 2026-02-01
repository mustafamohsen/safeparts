## Why

The current help docs include `use-cases.mdx`, but it is short and reference-like. Users need a tutorial-style guide that explains the value of Safeparts, helps them choose between Web UI/CLI/TUI based on technical comfort, and provides many concrete examples for both individuals and teams.

## What Changes

- Replace the current Use Cases page with a tutorial-style "Getting Started" guide focused on value, use cases, and safe operational patterns
- Provide the guide in both English and Arabic (maintaining parity across languages)
- Add a clear tool-selection section that routes users to Web UI vs CLI vs TUI based on use case and technical competency
- Expand examples to cover personal, family, small team, and enterprise scenarios
- Update navigation so the new guide is discoverable from the docs homepage and sidebar

## Capabilities

### New Capabilities
- `help-getting-started-guide`: A bilingual (English/Arabic) tutorial-style guide that teaches k-of-n sharing through examples and directs users to the right interface (Web UI/CLI/TUI)

### Modified Capabilities
- (none)

## Impact

- `web/help/src/content/docs/` (new/updated content and nav)
- `web/help/src/content/docs/ar/` (Arabic version kept in sync)
- `web/help/astro.config.mjs` (sidebar)
- `web/help/src/content/docs/index.mdx` (homepage card/link)
