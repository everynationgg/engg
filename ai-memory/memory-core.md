# ENGG AI Memory Core

Read this first when working in `everynationgg/engg`.

## What ENGG Is

ENGG is a product workspace for the main ENGG website, a Fly-hosted API and
Socket.IO server, shared API/database libraries, and documentation for the
multi-game portal direction.

The current product direction is a main website that acts as the portal and
routing gateway for games. Errant Night is no longer owned by this repository;
it lives in the standalone `everynationgg/errant-night` repo and is reached
through the website path proxy.

## Current Repo Shape

- `artifacts/every-nation` - main Vite/React website app.
- `artifacts/api-server` - Express and Socket.IO API server.
- `lib/api-client-react` - React API client helpers.
- `lib/api-spec` - OpenAPI/orval source.
- `lib/api-zod` - shared API validation schemas.
- `lib/db` - Drizzle schema and database support.
- `attached_assets` - retained media assets; do not prune without a separate
  asset audit.
- `decisions/` - short decision records.
- `repo-research/` - practical audits and working plans.
- `.gemini`, `.github/agents`, and `artifacts/brain` - existing agent-related
  or scratch context; leave in place unless explicitly asked to audit them.

## Deployment Shape

- The main website builds with `pnpm run build:landing` and outputs to root
  `dist`.
- The API and Socket.IO server remain deployed separately on Fly.
- The website Vercel config keeps shared rewrites for API, sockets, game
  proxying, legacy game redirects, and the website SPA fallback.
- Errant Night is served from a standalone game deployment behind the website
  path `/errant-night`.
- Future games should use stable website paths such as `/engraved-nether` and
  `/epsilon-nine`, backed by separate game repos and deployments.

Read `DEPLOYMENT.md`, `GAME_DEPLOYMENT.md`, and `GAME_PROXY_ROUTING.md` for
current concrete deployment details. Do not copy environment-variable values or
secrets into memory files.

## Safety Boundaries

Do not change these without an explicit request:

- Website behavior, routes, UI, Navbar, or public pages.
- Game behavior or game runtime code.
- Auth, payments, sockets, database schema, API server behavior, proxy routing,
  deployment behavior, or lockfiles.
- The standalone Errant Night repo.
- Existing dirty files, especially unrelated changes under
  `artifacts/every-nation`.

Do not add embeddings, vector databases, external AI services, runtime imports,
database tables, or new dependencies for this memory system.

## Validation Commands

For this memory system:

```powershell
pnpm run memory:index
pnpm run memory:index
git diff --check
```

For product-safe repository validation:

```powershell
pnpm run typecheck
pnpm run build:landing
```

If typecheck or build fails because of unrelated application code, report the
exact failure and do not fix unrelated runtime code.

## Task Read Map

- Repo orientation: `nodes/repo-map.md`
- Safety boundaries: `nodes/safety-rules.md`
- Website work: `nodes/website.md`
- API/server work: `nodes/api-server.md`
- Game routing or separation: `nodes/game-separation.md`
- Vercel/Fly deployment: `nodes/deployment.md`
- Hub and visual standards: `nodes/design-system.md`
- Performance-sensitive UI: `nodes/performance.md`
- Security-sensitive changes: `nodes/security.md`
- Validation and checks: `nodes/testing.md`
- Future direction: `nodes/roadmap.md`
- Decision history: `nodes/decisions.md`
- Agent process: `nodes/agent-workflow.md`
