# Architecture

## Workspace Overview

The repository is a pnpm workspace defined by `pnpm-workspace.yaml`.

Workspace packages include:

- `artifacts/*`
- `lib/*`
- `lib/integrations/*`
- `scripts`

The root scripts coordinate cross-workspace checks and builds.

## Main Website

Path: `artifacts/every-nation`

Package: `@workspace/every-nation`

The website is a Vite/React app. It owns the main ENGG web experience, website
routes, shop UI, profile/auth surfaces, Hub, and website navigation.

The Hub links to Errant Night through `VITE_ERRANT_NIGHT_URL`. The website no
longer builds the game into `/end`.

## Errant Night Game

Path: `artifacts/end`

Package: `@workspace/end`

The game is a Vite/React app. It owns the Errant Night landing page, room join
flow, room routes, game shell, game UI, role data, game-specific media, and
client-side Socket.IO integration.

The game currently still lives in this repo. Its build output is
`artifacts/end/dist/public`, and it is intended to run at `/` on its own Vercel
domain with `BASE_PATH=/`.

## API Server

Path: `artifacts/api-server`

Package: `@workspace/api-server`

The API server is an Express/Socket.IO backend deployed to Fly. It serves auth,
profile, friends, stats, shop, chat, game, and Socket.IO behavior. The current
public API target is `https://engg.fly.dev`.

The API server should remain separate on Fly unless a later decision changes
that hosting model.

## Shared Libraries

- `lib/api-client-react` - React API client helpers and generated client code.
- `lib/api-spec` - OpenAPI/orval source for API generation.
- `lib/api-zod` - shared Zod schemas for API validation.
- `lib/db` - Drizzle schema, database exports, and migration support.

The frontend apps currently depend on `@workspace/api-client-react`. The API
server depends on `@workspace/api-zod` and `@workspace/db`.

## Other Artifacts

- `artifacts/brain` is present in the workspace and should be left alone during
  the website/game separation unless explicitly audited.
- `artifacts/mockup-sandbox` is present and participates in typecheck when it
  has scripts. It is not part of the Vercel split.

## Current Vercel Split

The same repo can currently produce two deployable static outputs:

- Website: `pnpm run build:landing` -> `dist`
- Game: `pnpm run build:game` -> `artifacts/end/dist/public`

The root `vercel.json` does not force a build command or output directory.
Those settings belong in the individual Vercel project dashboards.

## Intended Future State

Target architecture:

- Website repository:
  - Contains the main website only.
  - Links out to the game URL.
  - Does not contain game source, game assets, or game-only dependencies.
- Game repository:
  - Contains the standalone Errant Night app.
  - Owns game assets and game-specific docs.
  - Deploys to its own Vercel project/domain at `/`.
- API:
  - Remains separately deployed on Fly.
  - Continues to serve both clients unless later split or replaced.
