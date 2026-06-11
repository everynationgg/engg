---
id: "roadmap"
title: "Roadmap"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 120
summary: "Current roadmap phases, completed game extraction, cleanup direction, and multi-game portal standards."
source_files:
  - "ROADMAP.md"
  - "repo-research/multi-game-platform-plan.md"
related_nodes:
  - "game-separation"
  - "decisions"
  - "architecture"
---

# Roadmap

## Purpose

Help agents distinguish completed architecture phases from future work that is
not automatically in scope.

## Current Facts

Documentation cleanup, standalone game repo extraction, game deployment, and
removal of old in-repo game code are recorded as complete. Cleanup and
multi-game portal standards remain ongoing directions. Future games should use
standalone repos and website paths.

## Important Paths/Files

- `ROADMAP.md`
- `repo-research/multi-game-platform-plan.md`
- `GAME_ARCHITECTURE.md`
- `GAME_REGISTRY.md`
- `decisions/`

## Do-not-change Rules

- Do not implement future roadmap items unless explicitly requested.
- Do not remove assets or dependencies just because cleanup is mentioned.
- Do not move Engraved Nether or Epsilon Nine routing without a scoped task.

## Common Agent Mistakes To Avoid

- Treating roadmap goals as immediate authorization.
- Mixing cleanup, routing, UI redesign, and game extraction in one pass.
- Updating future-game behavior without a standalone project ready.

## Validation Checklist

- For roadmap docs, run memory index validation if memory changes.
- For implementation tasks, choose validation based on the touched subsystem.
- Always report scope boundaries in the final summary.

## Related Docs

- `ROADMAP.md`
- `repo-research/multi-game-platform-plan.md`
- `decisions/README.md`
