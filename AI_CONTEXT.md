# AI Context

This file is for future AI agents working in this repository. Read it before
editing code.

## Current Architecture

This is a pnpm workspace. The main product pieces are:

- `artifacts/every-nation` - main website app.
- `artifacts/end` - Errant Night game app.
- `artifacts/api-server` - Express/Socket.IO API server deployed to Fly.
- `lib/api-client-react` - shared API client helpers used by the frontend apps.
- `lib/api-zod` and `lib/db` - backend schemas and database support.
- `attached_assets` - shared media assets currently imported by the game.

The website and game are currently still in one repository, but the Vercel build
split is already committed as `7587310 Split website and game Vercel builds`.
The main site build uses `pnpm run build:landing`; the game build uses
`pnpm run build:game`.

## Current Deployment Shape

- Main website Vercel project:
  - Build command: `pnpm run build:landing`
  - Output directory: `dist`
  - Proxies `/errant-night` to `https://errant-night.vercel.app`
  - Redirects legacy `/end` paths to `/errant-night`
- Game Vercel project:
  - Standalone repo: `everynationgg/errant-night`
  - Public origin: `https://errant-night.vercel.app`
  - Path base: `/errant-night/`
- API and Socket.IO remain on `https://engg.fly.dev`.

## Safety Rules

- Do not change app behavior during documentation or organization passes.
- Do not change game logic unless explicitly requested.
- Do not change auth, PayPal, sockets, database, API server, or Navbar unless
  explicitly requested.
- Do not delete or move `artifacts/end` yet.
- Do not delete the old in-repo game until the website path proxy is deployed
  and verified.
- Search the whole repo before removing references, routes, assets, or packages.
- Keep changes minimal and reversible.
- Avoid new dependencies unless the user explicitly approves them.

## Known Dirty Worktree Note

`artifacts/every-nation/src/components/Navbar.tsx` has an unrelated pre-existing
unstaged change. Do not stage, commit, revert, or edit it unless the user
explicitly asks for Navbar work.

Some files may appear modified in `git status` because of Windows line-ending or
stat noise. Check `git diff --name-only` before treating them as real content
changes.

## Preferred Validation

For product-safe changes, run:

```powershell
pnpm run typecheck
pnpm run build:landing
pnpm run build:game
```

For the split specifically, also verify:

- Main build produces `dist` without `dist/end`.
- Game build produces `artifacts/end/dist/public`.
- Main `/hub` opens `/errant-night`.
- Main `/end/*` redirects to `/errant-night/*`.
- Website `/errant-night/*` proxies to `https://errant-night.vercel.app`.
