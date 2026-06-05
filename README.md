# ENGG Product Workspace

This repository contains the ENGG main website, the Fly-hosted API server, and
shared workspace libraries. Errant Night now lives in its standalone repository,
`everynationgg/errant-night`, and is served through the website path proxy.
The website is now being organized as a multi-game portal with game entries
managed through a catalog.

## Current Status

- The same-repo Vercel deployment split was committed and pushed as
  `7587310 Split website and game Vercel builds`.
- The main website build now targets `artifacts/every-nation` and outputs to
  root `dist`.
- The main website no longer owns or builds Errant Night game code.
- The standalone game repo is `everynationgg/errant-night`.
- The main website Hub links Errant Night at `/errant-night`.
- Hub game cards are registered in
  `artifacts/every-nation/src/lib/gameCatalog.ts`.
- Main-site `/errant-night` is proxied to the Everynation Vercel game project.
- Old main-site `/end` paths redirect to `/errant-night`.
- The old in-repo Errant Night app has been removed from this repository.

## What This Repo Contains

- `artifacts/every-nation` - main website app, package `@workspace/every-nation`
- `artifacts/api-server` - API and Socket.IO server deployed to Fly
- `artifacts/brain` - workspace artifact retained for now
- `artifacts/mockup-sandbox` - sandbox artifact retained for now
- `lib/api-client-react` - generated/client API helpers for React apps
- `lib/api-spec` - OpenAPI/orval source
- `lib/api-zod` - API validation schemas
- `lib/db` - database schema and Drizzle setup
- `scripts` - workspace build and support scripts
- `attached_assets` - retained media assets; prune only after a separate audit

## Separation Direction

The product split is now:

1. Website repo: owns the ENGG portal, Hub, shop/profile/auth UI, shared libs,
   and Fly API server source.
2. Game repo: `everynationgg/errant-night` owns Errant Night source, assets, and
   game deployment.
3. Website path proxy: `/errant-night` serves the standalone game behind the
   scenes; `/end` remains only as a legacy redirect.
4. Future games should use public paths like `/engraved-nether` and
   `/epsilon-nine`, with separate repos and Vercel projects.

The API server remains separate on Fly unless that decision changes later.

## Core Commands

```powershell
pnpm install
pnpm run typecheck
pnpm run build:landing
```

Run the main website locally:

```powershell
pnpm --filter @workspace/every-nation run dev
```

Run the game locally from `C:\projects\errant-night`, not this repository.

## Important Docs

- [AI Context](./AI_CONTEXT.md)
- [Architecture](./ARCHITECTURE.md)
- [Deployment](./DEPLOYMENT.md)
- [Local Setup](./LOCAL_SETUP.md)
- [Testing](./TESTING.md)
- [Security](./SECURITY.md)
- [Tech Stack](./TECH_STACK.md)
- [Roadmap](./ROADMAP.md)
- [Debugging](./DEBUGGING.md)
- [MVP QA Checklist](./MVP_QA_CHECKLIST.md)
- [Game Architecture](./GAME_ARCHITECTURE.md)
- [Game Registry](./GAME_REGISTRY.md)
- [Game Onboarding](./GAME_ONBOARDING.md)
- [Game Deployment](./GAME_DEPLOYMENT.md)
- [Game Proxy Routing](./GAME_PROXY_ROUTING.md)
- [Game QA Checklist](./GAME_QA_CHECKLIST.md)
- [Game Security Checklist](./GAME_SECURITY_CHECKLIST.md)
- [UI Standards](./UI_STANDARDS.md)
- [Decision Records](./decisions/README.md)
- [Repo Research](./repo-research/README.md)
- [API Deployment Guide](./artifacts/api-server/DEPLOY.md)
