# Deployment

## Historical Split Commit

The same-repo Vercel split is committed and pushed as:

```text
7587310 Split website and game Vercel builds
```

That commit made the website and game build independently from the same repo.
The game has since moved to `everynationgg/errant-night`.

## Root Vercel Config

The shared root `vercel.json` intentionally does not set `buildCommand` or
`outputDirectory`.

It keeps only shared install/framework metadata and route rewrites:

- `/api/*` -> `https://engg.fly.dev/api/*`
- `/socket.io/*` -> `https://engg.fly.dev/socket.io/*`
- `/errant-night/*` -> `https://errant-night-yogs-projects-cee6471c.vercel.app/errant-night/*`
- `/errant-night/assets/*` -> `https://errant-night-yogs-projects-cee6471c.vercel.app/assets/*`
- other website client routes -> `/index.html`

The website project uses root directory `.` and owns its build command/output
directory in the Vercel dashboard.

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
- Main `/errant-night` proxies to the Everynation game Vercel project.
- Main build output does not include bundled game files.

## Standalone Game Vercel Project

The game is deployed from `everynationgg/errant-night` under the Everynation
Vercel team.

- Root Directory: `.`
- Framework Preset: `Other`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build`
- Output Directory: `dist/public`

Environment variables:

- `BASE_PATH=/errant-night/`
- `VITE_API_URL=https://engg.fly.dev`
- `VITE_API_BASE_URL=https://engg.fly.dev/api`
- `VITE_PAYPAL_CLIENT_ID=<public PayPal client id>`

Expected behavior:

- Game serves under `/errant-night/` on its Vercel origin.
- Game route `/errant-night/join/ABC123` works.
- Game route `/errant-night/room/ABC123` works.
- API calls and Socket.IO reach `https://engg.fly.dev`.

## API Deployment

The API server deploys to Fly. See
[artifacts/api-server/DEPLOY.md](./artifacts/api-server/DEPLOY.md).

The workspace deploy command is:

```powershell
pnpm run deploy:api
```

## Game Repository

- Repo: `everynationgg/errant-night`
- Public origin: `https://errant-night-yogs-projects-cee6471c.vercel.app`
- Path base: `/errant-night/`
- Build command: `pnpm run build`
- Output directory: `dist/public`

The old in-repo game app has been removed. Do not recreate game code in this
repository unless a later migration explicitly reverses the split.

## Future Game Deployments

Future games should follow the standards in:

- [Game Architecture](./GAME_ARCHITECTURE.md)
- [Game Deployment](./GAME_DEPLOYMENT.md)
- [Game Proxy Routing](./GAME_PROXY_ROUTING.md)
- [Game QA Checklist](./GAME_QA_CHECKLIST.md)

Public user-facing URLs should stay under
`https://www.engg.online/<game-slug>`. Standalone Vercel origins are proxy
targets, not public product URLs.
