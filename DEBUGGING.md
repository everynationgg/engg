# Debugging

## Build Issues

### `pnpm install` Fails

- Confirm pnpm is being used; the root `preinstall` script blocks npm/yarn.
- Check whether a new package violates `minimumReleaseAge`.
- Avoid disabling supply-chain settings for convenience.

### Typecheck Fails

Run focused checks:

```powershell
pnpm --filter @workspace/every-nation run typecheck
pnpm --filter @workspace/end run typecheck
pnpm --filter @workspace/api-server run typecheck
```

Use the focused failure to avoid changing unrelated apps.

### Game Build Cannot Copy Assets On Windows

If Vite reports `EPERM` while copying files into `artifacts/end/dist/public`,
a preview server may still be serving the old game build. Stop the preview
process and rerun:

```powershell
$env:BASE_PATH="/errant-night/"; pnpm run build:game
```

## Vercel Deployment Issues

Both Vercel projects currently use root directory `.`. The dashboard settings
must differ:

- Website build: `pnpm run build:landing`, output `dist`
- Game build: `pnpm run build:game`, output `artifacts/end/dist/public`

If one project serves the wrong output, check that Vercel did not inherit an old
root `buildCommand` or `outputDirectory`.

## `BASE_PATH` Issues

The standalone game currently deploys under `/errant-night/`:

```text
BASE_PATH=/errant-night/
```

Symptoms of a wrong base path:

- Assets request `/end/...` or `/assets/...` without the expected proxy rule.
- `/errant-night/join/ABC123` or `/errant-night/room/ABC123` load a blank page.
- Manifest or icon URLs point to the old `/end` path.

## SPA Fallback Issues

The root `vercel.json` rewrites website routes to `/index.html`, but excludes
`/api`, `/socket.io`, and `/errant-night` so API/socket calls and the game proxy
do not fall into the website SPA.

If deep links 404:

- Confirm the project output directory is correct.
- Confirm the fallback rewrite is present.
- Confirm `/api/*`, `/socket.io/*`, and `/errant-night/*` are excluded from the
  website SPA fallback.

## API And Socket Proxy Issues

Expected production routing:

- `VITE_API_URL=https://engg.fly.dev`
- `/api/*` rewrites to `https://engg.fly.dev/api/*`
- `/socket.io/*` rewrites to `https://engg.fly.dev/socket.io/*`
- Socket.IO client path is `/socket.io`

For local game development, Vite proxies `/api` and `/socket.io` to
`API_SERVER_PORT` or `8080`.

## Redirect Issues

Main website `/end` and `/end/*` are Vercel redirects to `/errant-night`.
Main website `/errant-night` and `/errant-night/*` are Vercel rewrites to
`https://errant-night.vercel.app`.

If `/end/join/ABC123?x=1` does not preserve path/query, check the `redirects`
entries in root `vercel.json`. URL hashes are client-side only and are not
visible to Vercel redirects.

Do not change Navbar or unrelated website UI while debugging split redirects.
