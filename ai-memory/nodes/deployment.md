---
id: "deployment"
title: "Deployment"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 70
summary: "Website, API, and standalone game deployment shape without changing routing or environment values."
source_files:
  - "DEPLOYMENT.md"
  - "GAME_DEPLOYMENT.md"
  - "GAME_PROXY_ROUTING.md"
  - "vercel.json"
related_nodes:
  - "architecture"
  - "game-separation"
  - "security"
  - "testing"
---

# Deployment

## Purpose

Summarize deployment ownership and validation without turning memory work into
deployment work.

## Current Facts

The website builds to root `dist` through the landing build command. The API and
Socket.IO server deploy separately. The root Vercel config owns website-level
rewrites, redirects, and game proxy rules. Standalone games deploy from their
own repos and are proxied through website paths.

## Important Paths/Files

- `DEPLOYMENT.md`
- `GAME_DEPLOYMENT.md`
- `GAME_PROXY_ROUTING.md`
- `vercel.json`
- `scripts/build-workspace.mjs`
- `artifacts/api-server/DEPLOY.md`

## Do-not-change Rules

- Do not edit `vercel.json` unless proxy or deployment routing is explicitly
  in scope.
- Do not deploy, push, or change provider settings during repo memory work.
- Do not copy environment-variable values into memory files.

## Common Agent Mistakes To Avoid

- Assuming local Vite preview fully tests Vercel external rewrites.
- Changing output directories or build commands during documentation work.
- Using protected preview origins as durable proxy targets.

## Validation Checklist

- For memory work: `pnpm run memory:index`, then confirm no deployment files
  changed.
- For website deploy safety: `pnpm run build:landing`.
- For routing work: read `GAME_PROXY_ROUTING.md` and verify deployed behavior
  separately.

## Related Docs

- `DEPLOYMENT.md`
- `GAME_DEPLOYMENT.md`
- `GAME_PROXY_ROUTING.md`
- `TESTING.md`
