# Game Architecture

ENGG is moving toward a multi-game portal model. The website owns discovery,
account-facing surfaces, and path-based proxy routes. Each game owns its own
source repository, build, Vercel project, assets, and runtime lifecycle.

## Public URL Pattern

Public game URLs should use website paths:

- `https://www.engg.online/errant-night`
- `https://www.engg.online/engraved-nether`
- `https://www.engg.online/epsilon-nine`

Do not add public game subdomains unless that is explicitly approved for a
specific game.

## Repository Pattern

Each game should be developed outside this website repo:

- `C:\projects\errant-night` -> `everynationgg/errant-night`
- `C:\projects\engraved-nether` -> `everynationgg/engraved-nether`
- `C:\projects\epsilon-nine` -> `everynationgg/epsilon-nine`

The website repo keeps only the portal, game catalog, legacy redirects, and
Vercel proxy routes. It should not contain game source after a game is
standalone.

## Current Website Pieces

- Game catalog: `artifacts/every-nation/src/lib/gameCatalog.ts`
- Hub UI: `artifacts/every-nation/src/pages/Hub.tsx`
- Website proxy routing: `vercel.json`
- API and Socket.IO origin: `https://engg.fly.dev`

## Game Runtime Expectations

Standalone Vite games should build with a matching base path:

```env
BASE_PATH=/<game-slug>/
```

The game Vercel project serves the game at that base path on its own Vercel
origin. The website then proxies the public website path to that origin.

## Boundaries

The website should not import game runtime code, game-only dependencies, or
game-specific assets unless the asset is used by the portal itself. API and
Socket.IO behavior remain on Fly unless a later architecture decision changes
that.
