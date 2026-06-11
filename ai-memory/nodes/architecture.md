---
id: "architecture"
title: "Architecture"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 30
summary: "Workspace architecture across the website, API server, shared libraries, and standalone games."
source_files:
  - "ARCHITECTURE.md"
  - "TECH_STACK.md"
  - "README.md"
related_nodes:
  - "repo-map"
  - "website"
  - "api-server"
  - "game-separation"
  - "deployment"
---

# Architecture

## Purpose

Summarize the repo architecture so agents know which subsystem owns which
behavior.

## Current Facts

The repo is a pnpm workspace. The website is a Vite/React app. The API server
is an Express/Socket.IO backend. Shared libraries provide API client helpers,
OpenAPI inputs, Zod schemas, and Drizzle database support. Errant Night is a
standalone game repo, reached through website routing.

## Important Paths/Files

- `artifacts/every-nation` - website package.
- `artifacts/api-server` - API/server package.
- `lib/api-client-react` - website-facing API helpers.
- `lib/api-spec` and `lib/api-zod` - API contract support.
- `lib/db` - database schema and migration support.
- `vercel.json` - website proxy and rewrite configuration.

## Do-not-change Rules

- Do not collapse the API server into the website.
- Do not put game runtime code back into the website repo.
- Do not change routing, deployment, or package ownership during memory or docs
  work.

## Common Agent Mistakes To Avoid

- Assuming every `artifacts/*` folder is deployed the same way.
- Treating shared libraries as unused because they are not page components.
- Updating root Vercel routing for non-routing tasks.

## Validation Checklist

- Use `pnpm run typecheck` for cross-workspace TypeScript validation.
- Use `pnpm run build:landing` for the website build path.
- For architecture-only docs, also run `pnpm run memory:index` if memory files
  changed.

## Related Docs

- `ARCHITECTURE.md`
- `TECH_STACK.md`
- `README.md`
