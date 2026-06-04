# Workspace Audit

Date: 2026-06-04

## Workspace Definition

`pnpm-workspace.yaml` includes:

- `artifacts/*`
- `lib/*`
- `lib/integrations/*`
- `scripts`

Root scripts:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run build:landing`
- `pnpm run build:game`
- `pnpm run deploy:api`

## Artifact Packages

- `artifacts/every-nation` - main website.
- `artifacts/end` - Errant Night game.
- `artifacts/api-server` - Fly API and Socket.IO backend.
- `artifacts/brain` - present, not part of current split.
- `artifacts/mockup-sandbox` - present, not part of current split.

## Shared Libraries

- `lib/api-client-react`
- `lib/api-spec`
- `lib/api-zod`
- `lib/db`

## Deployment-Relevant Files

- `scripts/build-workspace.mjs` controls root build modes.
- `vercel.json` controls shared Vercel rewrites.
- `artifacts/every-nation/.env.example` documents website public env.
- `artifacts/end/.env.example` documents game public env.
- `artifacts/api-server/DEPLOY.md` documents Fly API deployment.

## Dirty Worktree Observation

`artifacts/every-nation/src/components/Navbar.tsx` has an unrelated pre-existing
unstaged change. It should not be included in documentation or deployment-split
commits.

Several files may appear modified in `git status` from line-ending/stat noise.
Use `git diff --name-only` to confirm actual content changes.

## Extraction Notes

Do not delete or move `artifacts/end` until:

- The standalone game repo has been created.
- Game assets have been copied.
- Workspace dependencies have been resolved.
- Game deployment has been verified.
- Website links and redirects have been verified.
