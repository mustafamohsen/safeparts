## Context

The web app currently sets JetBrains Mono as the global `html` font family. This gives a distinctive technical feel but reduces readability at small sizes because the font metrics make `text-xs`/`text-sm` feel denser.

The help docs are built separately (Astro/Starlight) and also set JetBrains Mono as the primary font via `--sl-font` and an explicit `html { font-family: ... }` rule.

We want a consistent typography system across both builds:

- English/Latin UI text: IBM Plex Sans
- Arabic UI text: IBM Plex Sans Arabic
- Code-like surfaces: JetBrains Mono

## Goals / Non-Goals

**Goals:**
- Improve perceived readability of the web UI and docs without changing layout structure.
- Keep JetBrains Mono for code-like/secret/share surfaces.
- Keep Arabic typography as IBM Plex Sans Arabic.
- Maintain consistent typography between the Vite app and Astro docs build.

**Non-Goals:**
- Retuning the entire UI type scale (e.g. changing all `text-xs` to `text-sm`).
- Introducing self-hosted font assets.
- Visual redesign beyond font assignment.

## Decisions

### Decision 1: Use IBM Plex Sans as English/Latin UI font

IBM Plex Sans pairs well with IBM Plex Sans Arabic (same family) and is easily loaded via Google Fonts, matching the current font loading approach.

### Decision 2: Keep JetBrains Mono as the monospace lane

JetBrains Mono remains the monospace font for code-like content and sensitive outputs (shares/secrets). This preserves the product's technical voice where it helps comprehension.

### Decision 3: Ensure Tailwind `font-mono` maps to JetBrains Mono

Once the global font switches away from JetBrains Mono, any UI element using Tailwind's `font-mono` class must still render JetBrains Mono. The implementation should configure the mono stack centrally (preferably in Tailwind config) so components don't need per-element overrides.

### Decision 4: Mirror changes in the docs build

The help docs load fonts via `web/help/astro.config.mjs` and apply typography via Starlight CSS variables in `web/help/src/styles/theme.css`. Both need updates so docs match the app (IBM Plex Sans for prose, JetBrains Mono for code).

## Risks / Trade-offs

- **FOUT/FOIT during font load**  Mitigation: keep Google Fonts with `display=swap` and reasonable system fallbacks.
- **Inconsistent mono rendering if Tailwind config is not updated**  Mitigation: set the mono stack once (Tailwind theme or a base `.font-mono` rule) and rely on `font-mono` usage.
- **Docs typography overrides**  Mitigation: ensure Starlight variables and the explicit `html { font-family: ... }` rule agree.
