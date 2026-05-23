# Safeparts Remotion Explainer

A first-pass Remotion animation for explaining Safeparts: what it is, who it is for, how threshold recovery works, and the underlying Shamir/GF(256) maths.

## Run

```bash
cd explainer
npm install
npm run studio
```

## Render

```bash
cd explainer
npm run render
```

The main composition is `SafepartsExplainer`. A still poster is available as `SafepartsPoster`.

## Files

- `SCRIPT.md` — narration and scene map for v0.11
- `src/SafepartsExplainer.tsx` — scene sequencing and animation components
- `src/styles.css` — visual system and static styling
- `public/logo.svg` — Safeparts logo used by Remotion via `staticFile()`
