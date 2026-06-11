---
id: "api-server"
title: "API Server"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 50
summary: "Express and Socket.IO server ownership, shared schema dependencies, and server-side caution areas."
source_files:
  - "ARCHITECTURE.md"
  - "TECH_STACK.md"
  - "SECURITY.md"
  - "DEPLOYMENT.md"
related_nodes:
  - "architecture"
  - "security"
  - "deployment"
  - "testing"
---

# API Server

## Purpose

Identify what the API server owns and where agents must be careful around
server behavior.

## Current Facts

The API server is an Express and Socket.IO backend. It serves account, profile,
friends, stats, shop, chat, game-adjacent, and socket behavior. It depends on
shared API validation and database packages. It deploys separately from the
static website.

## Important Paths/Files

- `artifacts/api-server/src/`
- `artifacts/api-server/src/modules/core/routes/`
- `artifacts/api-server/src/modules/core/sockets/`
- `artifacts/api-server/src/modules/games/`
- `artifacts/api-server/DEPLOY.md`
- `lib/api-zod` and `lib/db`

## Do-not-change Rules

- Do not change API behavior, auth, payments, sockets, database schema, or
  server deployment for memory-only work.
- Do not copy backend secret values into documentation.
- Do not run database migrations unless explicitly requested.

## Common Agent Mistakes To Avoid

- Treating socket routing as frontend-only.
- Changing server schemas without updating shared API contract files.
- Editing game-specific server modules during website or docs work.

## Validation Checklist

- Use `pnpm run typecheck` for workspace validation.
- For API runtime changes, read `artifacts/api-server/DEPLOY.md` and the
  relevant route or socket module first.
- For memory-only work, confirm `artifacts/api-server` is unchanged.

## Related Docs

- `ARCHITECTURE.md`
- `TECH_STACK.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
