---
id: "testing"
title: "Testing"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 110
summary: "Repository validation commands, build checks, manual route checks, and memory index validation."
source_files:
  - "TESTING.md"
  - "MVP_QA_CHECKLIST.md"
  - "GAME_QA_CHECKLIST.md"
  - "AI_CONTEXT.md"
related_nodes:
  - "deployment"
  - "website"
  - "api-server"
  - "agent-workflow"
---

# Testing

## Purpose

Give agents the expected validation order for memory, docs, website, and
deployment-sensitive work.

## Current Facts

The repo uses root commands for cross-workspace typechecking and landing build
validation. Manual route checks are documented for website and game proxy work.
The AI memory index has its own deterministic generation command.

## Important Paths/Files

- `TESTING.md`
- `MVP_QA_CHECKLIST.md`
- `GAME_QA_CHECKLIST.md`
- `scripts/build-workspace.mjs`
- `scripts/ai-memory-index.mjs`

## Do-not-change Rules

- Do not fix unrelated app failures during scoped memory work.
- Do not treat local preview as full proof of Vercel proxy behavior.
- Do not skip reporting exact failures when validation fails.

## Common Agent Mistakes To Avoid

- Running broad checks before generating derived memory output.
- Hiding pre-existing failures instead of reporting exact command output.
- Assuming a successful typecheck means the built website is safe.

## Validation Checklist

- Memory: `pnpm run memory:index` twice and confirm no second-run diff.
- Product-safe checks: `pnpm run typecheck` and `pnpm run build:landing`.
- Repo hygiene: `git diff --check`, `git diff --name-only`,
  `git diff --stat`, and `git status --short`.

## Related Docs

- `TESTING.md`
- `MVP_QA_CHECKLIST.md`
- `GAME_QA_CHECKLIST.md`
- `AI_CONTEXT.md`
