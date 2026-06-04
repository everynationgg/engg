# Deployment

## Current Split Commit

The same-repo Vercel split is committed and pushed as:

```text
7587310 Split website and game Vercel builds
```

That commit makes the website and game build independently from the same repo.
It does not move the game into a separate repository yet.

## Root Vercel Config

The shared root `vercel.json` intentionally does not set `buildCommand` or
`outputDirectory`.

It keeps only shared install/framework metadata and route rewrites:

- `/api/*` -> `https://engg.fly.dev/api/*`
- `/socket.io/*` -> `https://engg.fly.dev/socket.io/*`
- `/errant-night/*` -> `https://errant-night.vercel.app/errant-night/*`
- `/errant-night/assets/*` -> `https://errant-night.vercel.app/assets/*`
- other website client routes -> `/index.html`

Because both Vercel projects use root directory `.`, each project must set its
own build command and output directory in the Vercel dashboard.

## Main Website Vercel Project

Use these dashboard settings:

- Root Directory: `.`
- Framework Preset: `Other`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build:landing`
- Output Directory: `dist`

Environment variables:

- `VITE_API_URL=https://engg.fly.dev`
- `VITE_PAYPAL_CLIENT_ID=<public PayPal client id>`

Expected behavior:

- Main website serves normal website routes.
- Main `/hub` opens `/errant-night`.
- Main `/end` and `/end/*` redirect to `/errant-night`.
- Main `/errant-night` proxies to `https://errant-night.vercel.app`.
- Main build output does not include `dist/end`.

## Legacy Same-Repo Game Vercel Project

The original same-repo game project used these dashboard settings:

- Root Directory: `.`
- Framework Preset: `Other`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build:game`
- Output Directory: `artifacts/end/dist/public`

Environment variables:

- `BASE_PATH=/`
- `VITE_API_URL=https://engg.fly.dev`
- `VITE_API_BASE_URL=https://engg.fly.dev/api`
- `VITE_PAYPAL_CLIENT_ID=<public PayPal client id>`

Expected behavior:

- Game serves at `/` on its own domain.
- Game route `/join/ABC123` works at the domain root.
- Game route `/room/ABC123` works at the domain root.
- API calls and Socket.IO reach `https://engg.fly.dev`.

## API Deployment

The API server deploys to Fly. See
[artifacts/api-server/DEPLOY.md](./artifacts/api-server/DEPLOY.md).

The workspace deploy command is:

```powershell
pnpm run deploy:api
```

## Future Target

The standalone game repository now exists:

- Repo: `everynationgg/errant-night`
- Public origin: `https://errant-night.vercel.app`
- Path base: `/errant-night/`
- Build command: `pnpm run build`
- Output directory: `dist/public`

The next target is cleanup:

- Keep the website repository free of game code after extraction.

Do not delete `artifacts/end` from this repo until the website `/errant-night`
proxy is deployed and verified.
