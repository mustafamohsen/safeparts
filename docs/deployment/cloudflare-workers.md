# Cloudflare Workers deployment

This deployment is additive. Keep the existing Netlify deployment and build hook in place unless the project owner asks to remove it.

## Files

- `wrangler.jsonc` defines the Worker name, asset binding, and `web/dist` asset directory.
- `web/cloudflare-worker.ts` serves the built static files and mirrors the current Netlify routing rules:
  - `/help` redirects to `/help/`
  - `/help/ar` redirects to `/help/ar/`
  - missing `/help/*` pages return `web/dist/help/404.html` with status 404
  - other missing page routes fall back to `web/dist/index.html` for the Vite app
- `.github/workflows/cloudflare-workers.yml` builds the web app and docs, validates pull requests with a Wrangler dry run, and deploys on `main` when Cloudflare secrets are configured.

## Cloudflare setup

1. Create a Cloudflare API token with permission to deploy Workers in the target account.
2. Add these GitHub repository secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
3. Check `wrangler.jsonc` and change `name` if `safeparts-web` is not the Worker name you want.
4. Merge to `main` or run the `cloudflare workers deploy` workflow manually.

The workflow skips deployment when either secret is missing, so adding this file will not break `main` before Cloudflare is configured.

## Local build and dry run

From the repository root:

```bash
cd web
bun install
bun run build:wasm
bun run build
cd help
bun install
bun run build
cd ../..
bunx wrangler deploy --dry-run --config wrangler.jsonc
```

To deploy from your machine after logging in with Wrangler:

```bash
bunx wrangler deploy --config wrangler.jsonc
```

## Custom domain

Cloudflare can attach a custom domain in the Workers dashboard after the first deploy. Keep the Netlify domain active until the Cloudflare route is tested with the Web UI and `/help/` docs.
