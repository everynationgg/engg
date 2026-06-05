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
the standalone Everynation Vercel game project. The website no longer builds or
serves the game code.

Hub game card data lives in
`artifacts/every-nation/src/lib/gameCatalog.ts`. Future games should be added to
that catalog before they are wired into routing.

## Errant Night Game

Repo: `everynationgg/errant-night`

The game is a standalone Vite/React app. It owns the Errant Night landing page,
room join flow, room routes, game shell, game UI, role data, game-specific
media, and client-side Socket.IO integration.

The website repo proxies `/errant-night` to the game project's Everynation
Vercel origin, currently `https://errant-night-yogs-projects-cee6471c.vercel.app`,
with path base `/errant-night/`.

## Multi-Game Model

Future games should follow the same pattern:

- Public URL: `https://www.engg.online/<game-slug>`
- Local repo folder: `C:\projects\<game-slug>`
- GitHub repo: `everynationgg/<game-slug>`
- Vercel project: standalone game project under the Everynation team
- Game base path: `BASE_PATH=/<game-slug>/`
- Website routing: path proxy in root `vercel.json`

Examples:

- `/errant-night`
- `/engraved-nether`
- `/epsilon-nine`

Public game subdomains are not the default architecture.

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

The website currently depends on `@workspace/api-client-react`. The API server
depends on `@workspace/api-zod` and `@workspace/db`.

## Other Artifacts

- `artifacts/brain` is present in the workspace and should be left alone during
  the website/game separation unless explicitly audited.
- `artifacts/mockup-sandbox` is present and participates in typecheck when it
  has scripts. It is not part of the Vercel split.

## Current Vercel Split

The website repo produces the deployable static website output:

- Website: `pnpm run build:landing` -> `dist`

The root `vercel.json` does not force a build command or output directory. The
website Vercel project owns those dashboard settings.

## Intended Future State

Target architecture:

- Website repository:
  - Contains the main website only.
  - Proxies `/errant-night` to the standalone game origin.
  - Does not contain game source or game-only dependencies.
- Game repository:
  - Contains the standalone Errant Night app.
  - Owns game assets and game-specific docs.
  - Deploys to its own Vercel project with the matching game base path.
- API:
  - Remains separately deployed on Fly.
  - Continues to serve both clients unless later split or replaced.
