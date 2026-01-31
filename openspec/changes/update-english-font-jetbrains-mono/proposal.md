# Change: Use JetBrains Mono for English typography

## Why
The web UI and help docs currently use Inter for English text. We want a consistent, distinctive look by using JetBrains Mono as the primary English typeface across the entire web experience.

## What Changes
- Switch the default English/Latin font to JetBrains Mono across the main web app and Astro (Starlight) help site.
- Keep Arabic typography on IBM Plex Sans Arabic.
- Ensure font assets are loaded in both sites (Google Fonts) with appropriate fallbacks.

## Impact
- Affected specs: typography
- Affected code:
  - web/index.html
  - web/src/styles.css
  - web/help/astro.config.mjs
  - web/help/src/styles/theme.css
