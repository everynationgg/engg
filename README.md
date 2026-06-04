# ENGG Product Workspace

This repository currently contains the ENGG main website, the Errant Night game,
the Fly-hosted API server, and shared workspace libraries. It is organized as a
pnpm workspace while the product is being prepared for a cleaner split between
the website and the game.

## Current Status

- The same-repo Vercel deployment split was committed and pushed as
  `7587310 Split website and game Vercel builds`.
- The main website build now targets `artifacts/every-nation` and outputs to
  root `dist`.
- The game build now targets `artifacts/end` and outputs to
  `artifacts/end/dist/public`.
- The main website no longer bundles the game into `dist/end`.
- The main website Hub links Errant Night through `VITE_ERRANT_NIGHT_URL`.
- Old main-site `/end` paths redirect in the browser to the configured external
  game URL.
- `artifacts/end` has not been deleted or moved yet.
- The next product-cleanup target is a standalone game repository.

## What This Repo Contains

- `artifacts/every-nation` - main website app, package `@workspace/every-nation`
- `artifacts/end` - Errant Night game app, package `@workspace/end`
- `artifacts/api-server` - API and Socket.IO server deployed to Fly
- `artifacts/brain` - workspace artifact retained for now
- `artifacts/mockup-sandbox` - sandbox artifact retained for now
- `lib/api-client-react` - generated/client API helpers for React apps
- `lib/api-spec` - OpenAPI/orval source
- `lib/api-zod` - API validation schemas
- `lib/db` - database schema and Drizzle setup
- `scripts` - workspace build and support scripts
- `attached_assets` - shared media currently used by the game

## Separation Direction

The product is moving in two steps:

1. Current step: keep the existing workspace, but deploy the website and game as
   separate Vercel projects from the same repo.
2. Future step: extract Errant Night into its own repository and Vercel project,
   then remove game code from the website repo.

The API server remains separate on Fly unless that decision changes later.

## Core Commands

```powershell
pnpm install
pnpm run typecheck
pnpm run build:landing
pnpm run build:game
```

Run the main website locally:

```powershell
pnpm --filter @workspace/every-nation run dev
```

Run the game locally:

```powershell
$env:PORT="5174"; pnpm --filter @workspace/end run dev
```

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
- [UI Standards](./UI_STANDARDS.md)
- [Decision Records](./decisions/README.md)
- [Repo Research](./repo-research/README.md)
- [API Deployment Guide](./artifacts/api-server/DEPLOY.md)
