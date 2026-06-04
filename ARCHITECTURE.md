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

The Hub links to Errant Night at `/errant-night`. Vercel proxies that path to
the standalone public game origin, `https://errant-night.vercel.app`. The
website no longer builds the game into `/end`.

## Errant Night Game

Path: `artifacts/end`

Package: `@workspace/end`

The game is a Vite/React app. It owns the Errant Night landing page, room join
flow, room routes, game shell, game UI, role data, game-specific media, and
client-side Socket.IO integration.

The old workspace game still lives in this repo temporarily. The current
standalone game repo is `everynationgg/errant-night`, deployed at
`https://errant-night.vercel.app` with path base `/errant-night/`.

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
  - Proxies `/errant-night` to the standalone game origin.
  - Does not contain game source, game assets, or game-only dependencies.
- Game repository:
  - Contains the standalone Errant Night app.
  - Owns game assets and game-specific docs.
  - Deploys to its own Vercel project/domain at `/`.
- API:
  - Remains separately deployed on Fly.
  - Continues to serve both clients unless later split or replaced.
