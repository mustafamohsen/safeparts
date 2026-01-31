## Why

The web UI and help docs became harder to read after switching all English text to JetBrains Mono; at the same CSS sizes it feels smaller and denser than a UI-oriented sans font.

We want to keep the distinctive mono "technical" feel where it helps (shares, secrets, code-like surfaces) while improving overall readability for prose, labels, and UI chrome.

## What Changes

- Use IBM Plex Sans as the default English/Latin UI font (body text, labels, hints, buttons).
- Keep JetBrains Mono as the monospace font for code-like content and share/secret outputs.
- Keep IBM Plex Sans Arabic as the default Arabic font.
- Update both the main web app (Vite/React) and help docs site (Astro/Starlight) so typography stays consistent.
- Ensure fonts are loaded with appropriate fallbacks and weights.

## Capabilities

### New Capabilities
- `web-typography`: A consistent bilingual typography system (English/Arabic UI font + monospace for code-like surfaces) applied across the web app and help docs.

### Modified Capabilities

<!-- None. -->

## Impact

- Web app:
  - `web/index.html`: update Google Fonts load to include IBM Plex Sans.
  - `web/src/styles.css`: set global English font to IBM Plex Sans; keep Arabic override; ensure mono surfaces remain JetBrains Mono.

- Help docs (Astro/Starlight):
  - `web/help/astro.config.mjs`: update Google Fonts load to include IBM Plex Sans.
  - `web/help/src/styles/theme.css`: set `--sl-font` (and related typography) to IBM Plex Sans; keep `--sl-font-mono` as JetBrains Mono; keep Arabic override.
