# Cloudflare Workers deployment

Cloudflare Workers is a second deployment for the web app. Netlify and its build hook remain in place.

## Configuration

- `wrangler.jsonc` defines the `safeparts-web` Worker and serves assets from `web/dist`.
- `web/cloudflare-worker.ts` mirrors the Netlify routing rules:
  - `/help` and `/help/ar` redirect to their trailing-slash paths.
  - Missing `/help/*` pages return `web/dist/help/404.html` with HTTP 404.
  - Other missing page routes fall back to `web/dist/index.html` for the Vite app.
- `.github/workflows/cloudflare-workers.yml` builds the app and help site, validates pull requests with a Wrangler dry run, and deploys only from `main`.

## GitHub setup

Create one repository secret named `CLOUDFLARE_API_TOKEN`. Scope the token to the target Cloudflare account and grant it permission to deploy Workers. Wrangler resolves the account from that token, so no `CLOUDFLARE_ACCOUNT_ID` secret or GitHub variable is required. A token that can access more than one account is ambiguous and cannot be used without an explicit account ID.

The Worker has no runtime variables. The workflow reports a notice and skips deployment until the token exists.

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

Attach a custom domain in the Workers dashboard after the first deploy. Keep the Netlify domain active until the Worker deployment has been tested with the web app and `/help/` docs.
