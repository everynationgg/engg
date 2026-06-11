---
id: "game-separation"
title: "Game Separation"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 60
summary: "Errant Night extraction, standalone game ownership, and multi-game repository pattern."
source_files:
  - "GAME_ARCHITECTURE.md"
  - "GAME_DEPLOYMENT.md"
  - "GAME_PROXY_ROUTING.md"
  - "GAME_REGISTRY.md"
  - "decisions/0002-game-repo-separation-plan.md"
  - "decisions/0004-multi-game-path-routing.md"
related_nodes:
  - "architecture"
  - "deployment"
  - "website"
  - "decisions"
---

# Game Separation

## Purpose

Prevent agents from mixing standalone game source back into the website repo.

## Current Facts

Errant Night is owned by a standalone repository. The website repo owns the
portal, catalog, proxy routing, and legacy redirects. Future games should follow
the same standalone repo and website path pattern.

## Important Paths/Files

- `GAME_ARCHITECTURE.md`
- `GAME_DEPLOYMENT.md`
- `GAME_PROXY_ROUTING.md`
- `GAME_REGISTRY.md`
- `artifacts/every-nation/src/lib/gameCatalog.ts`
- `vercel.json`

## Do-not-change Rules

- Do not edit the standalone Errant Night repo from this repo.
- Do not add game runtime code back into `artifacts/every-nation`.
- Do not change game proxy routing unless routing is explicitly scoped.
- Do not add public game subdomains unless a decision record approves it.

## Common Agent Mistakes To Avoid

- Treating `/end` as current game ownership instead of a legacy redirect.
- Adding game assets to website public files when the game should own them.
- Updating Hub catalog behavior before a standalone game deployment exists.

## Validation Checklist

- Check `GAME_PROXY_ROUTING.md` before routing work.
- Check `GAME_REGISTRY.md` before catalog work.
- For memory-only work, confirm no game runtime or proxy files changed.

## Related Docs

- `GAME_ARCHITECTURE.md`
- `GAME_DEPLOYMENT.md`
- `GAME_PROXY_ROUTING.md`
- `GAME_REGISTRY.md`
- `decisions/0002-game-repo-separation-plan.md`
- `decisions/0004-multi-game-path-routing.md`
