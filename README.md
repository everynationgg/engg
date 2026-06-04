# Errant Night (Every Nation GG)

A pnpm workspace with separate deployable apps for the main website and the Errant Night game.

## Workspace Apps

- `artifacts/every-nation` - main website, package `@workspace/every-nation`
- `artifacts/end` - Errant Night game, package `@workspace/end`
- `artifacts/api-server` - Fly-hosted API and Socket.IO backend
- `lib/*` - shared workspace packages used by the backend and clients

The main website does not build the game into `/end` anymore. Its Hub uses `VITE_ERRANT_NIGHT_URL` to send players to the separate game deployment, and old `/end` website paths redirect to that same external URL.

## Local Development

Install from the repo root:

```powershell
pnpm install
```

Run the main website:

```powershell
pnpm --filter @workspace/every-nation run dev
```

Run the game on another local port:

```powershell
$env:PORT="5174"; pnpm --filter @workspace/end run dev
```

## Vercel: Main Website

Create one Vercel project from this repo for the main website.

- Root Directory: `.`
- Framework Preset: Other
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build:landing`
- Output Directory: `dist`
- Domains: `engg.online`, `www.engg.online`, or the chosen main website domains

Environment variables:

- `VITE_ERRANT_NIGHT_URL=https://end.engg.online`
- `VITE_API_URL=https://engg.fly.dev`
- `VITE_PAYPAL_CLIENT_ID=<public PayPal client id if shop is enabled>`

## Vercel: Errant Night Game

Create a second Vercel project from this same repo for the game.

- Root Directory: `.`
- Framework Preset: Other
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build:game`
- Output Directory: `artifacts/end/dist/public`
- Domains: `end.engg.online` or the chosen game domain

Environment variables:

- `BASE_PATH=/`
- `VITE_API_URL=https://engg.fly.dev`
- `VITE_API_BASE_URL=https://engg.fly.dev/api`
- `VITE_PAYPAL_CLIENT_ID=<public PayPal client id if in-game shop is enabled>`

The shared root `vercel.json` keeps `/api/*` and `/socket.io/*` pointed at `https://engg.fly.dev`, then rewrites client routes to `index.html`.

## Validation

```powershell
pnpm run typecheck
pnpm run build:landing
pnpm run build:game
pnpm --filter @workspace/every-nation run typecheck
pnpm --filter @workspace/end run typecheck
```

## Documentation

- [UI Standards & Mobile Compliance](./UI_STANDARDS.md)
- [API Deployment Guide](./artifacts/api-server/DEPLOY.md)
