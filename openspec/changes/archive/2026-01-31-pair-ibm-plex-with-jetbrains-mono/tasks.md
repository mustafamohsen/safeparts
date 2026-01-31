## 1. Web App (Vite/React)

- [x] 1.1 Update `web/index.html` Google Fonts load to include IBM Plex Sans (keep JetBrains Mono + IBM Plex Sans Arabic)
- [x] 1.2 Update `web/src/styles.css` to use IBM Plex Sans as the default English/Latin font while preserving the Arabic override
- [x] 1.3 Ensure Tailwind `font-mono` renders JetBrains Mono after the global font switches (centralize mono stack)

## 2. Help Docs (Astro/Starlight)

- [x] 2.1 Update `web/help/astro.config.mjs` Google Fonts load to include IBM Plex Sans (keep JetBrains Mono + IBM Plex Sans Arabic)
- [x] 2.2 Update `web/help/src/styles/theme.css` to use IBM Plex Sans for prose (`--sl-font` / `html`), keep JetBrains Mono for mono (`--sl-font-mono`), and preserve Arabic behavior

## 3. Verify

- [x] 3.1 Run `bun run --cwd web build` and confirm the web app renders with IBM Plex Sans for prose and JetBrains Mono for code-like areas
- [x] 3.2 Run `bun run --cwd web help:build` and confirm the docs render with the same typography system
