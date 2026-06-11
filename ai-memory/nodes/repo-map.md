---
id: "repo-map"
title: "Repo Map"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 10
summary: "Fast map of the workspace, apps, shared libraries, docs, and retained artifacts."
source_files:
  - "README.md"
  - "ARCHITECTURE.md"
  - "AI_CONTEXT.md"
  - "repo-research/workspace-audit.md"
related_nodes:
  - "architecture"
  - "agent-workflow"
  - "safety-rules"
---

# Repo Map

## Purpose

Give agents a quick, repo-native map before they search or edit.

## Current Facts

This is a pnpm workspace. The main website, API server, shared libraries,
support scripts, docs, and retained artifacts live together in this repository.
Errant Night source is not owned here anymore.

## Important Paths/Files

- `artifacts/every-nation` - main website app.
- `artifacts/api-server` - Express and Socket.IO API server.
- `lib/api-client-react`, `lib/api-spec`, `lib/api-zod`, `lib/db` - shared API
  and database libraries.
- `scripts` - workspace build and support scripts.
- `attached_assets` - retained product media; do not prune casually.
- `decisions/` and `repo-research/` - decision history and working audits.
- `.gemini`, `.github/agents`, and `artifacts/brain` - existing agent or
  scratch context; leave as-is unless explicitly scoped.

## Do-not-change Rules

- Do not move folders as part of orientation work.
- Do not prune assets, docs, or agent scratch folders without a separate audit.
- Do not reintroduce standalone game source into this repository.

## Common Agent Mistakes To Avoid

- Treating `artifacts/brain` as production app code.
- Assuming `/errant-night` game code still lives in this repo.
- Editing website files while doing documentation-only work.

## Validation Checklist

- Confirm paths with `rg --files` before referencing or deleting anything.
- Check `git status --short` before edits.
- For memory-only changes, run `pnpm run memory:index` and `git diff --check`.

## Related Docs

- `README.md`
- `ARCHITECTURE.md`
- `AI_CONTEXT.md`
- `repo-research/workspace-audit.md`
