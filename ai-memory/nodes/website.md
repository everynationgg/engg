---
id: "website"
title: "Website"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 40
summary: "Main website ownership, routes, Hub catalog, public app boundaries, and validation."
source_files:
  - "README.md"
  - "ARCHITECTURE.md"
  - "GAME_REGISTRY.md"
  - "repo-research/website-dependency-audit.md"
related_nodes:
  - "architecture"
  - "design-system"
  - "performance"
  - "game-separation"
---

# Website

## Purpose

Orient agents around what the main website owns and what it must not absorb
from standalone games or backend systems.

## Current Facts

The website app owns the main ENGG web experience, Hub, shop/profile/auth UI,
navigation, and website routes. Hub game card metadata lives in the game
catalog. The website links to games through trusted catalog data and path-based
routing.

## Important Paths/Files

- `artifacts/every-nation/src/App.tsx`
- `artifacts/every-nation/src/pages/`
- `artifacts/every-nation/src/lib/gameCatalog.ts`
- `artifacts/every-nation/src/components/`
- `artifacts/every-nation/public/`

## Do-not-change Rules

- Do not edit UI, routes, Navbar, or public pages for memory-only work.
- Do not add game runtime code or game-only dependencies to the website.
- Do not change auth, shop, profile, messaging, sockets, or payment behavior
  unless explicitly scoped.

## Common Agent Mistakes To Avoid

- Hardcoding game links outside the catalog.
- Treating external game origins as public-facing website copy.
- Editing dirty website files while doing internal docs work.

## Validation Checklist

- For website changes, run `pnpm run typecheck` and `pnpm run build:landing`.
- For memory-only work, confirm no website files changed.
- For Hub/game links, verify the relevant docs before editing catalog data.

## Related Docs

- `GAME_REGISTRY.md`
- `repo-research/website-dependency-audit.md`
- `TESTING.md`
