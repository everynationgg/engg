---
id: "decisions"
title: "Decisions"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 130
summary: "Decision record index and how prior architecture decisions should guide new work."
source_files:
  - "decisions/README.md"
  - "decisions/0001-vercel-split.md"
  - "decisions/0002-game-repo-separation-plan.md"
  - "decisions/0004-multi-game-path-routing.md"
  - "decisions/0005-hub-portal-deck-direction.md"
related_nodes:
  - "roadmap"
  - "deployment"
  - "game-separation"
  - "agent-workflow"
---

# Decisions

## Purpose

Point agents to accepted decisions before they make architecture or product
assumptions.

## Current Facts

Decision records document the Vercel split, standalone game separation,
multi-game path routing, and proposed Hub Portal Deck direction. They are short
records, not blanket approval to perform unrelated changes.

## Important Paths/Files

- `decisions/README.md`
- `decisions/0001-vercel-split.md`
- `decisions/0002-game-repo-separation-plan.md`
- `decisions/0004-multi-game-path-routing.md`
- `decisions/0005-hub-portal-deck-direction.md`

## Do-not-change Rules

- Do not rewrite decision history during implementation work.
- Do not treat a proposed decision as implemented behavior without checking the
  current code and docs.
- Do not add a decision record unless the task explicitly calls for a new
  decision.

## Common Agent Mistakes To Avoid

- Ignoring accepted game separation when editing the website.
- Treating historical same-repo split notes as the current game ownership
  model.
- Updating routing without checking the multi-game path routing decision.

## Validation Checklist

- For decision docs, verify source facts from current files.
- For memory changes, run `pnpm run memory:index`.
- For runtime changes informed by a decision, run subsystem validation too.

## Related Docs

- `decisions/README.md`
- `ROADMAP.md`
- `GAME_ARCHITECTURE.md`
- `DEPLOYMENT.md`
