---
id: "safety-rules"
title: "Safety Rules"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 20
summary: "Hard boundaries for safe edits, dirty worktrees, game separation, dependencies, and secrets."
source_files:
  - "AI_CONTEXT.md"
  - "SECURITY.md"
  - "DESIGN_SECURITY_CHECKLIST.md"
  - "repo-research/workspace-audit.md"
related_nodes:
  - "repo-map"
  - "security"
  - "agent-workflow"
---

# Safety Rules

## Purpose

Keep agents from turning narrow repo work into product, runtime, or deployment
changes.

## Current Facts

The repo often has unrelated dirty website files. The current architecture
separates the website, API server, shared libraries, and standalone game repos.
Documentation and memory work must not modify app behavior.

## Important Paths/Files

- `AI_CONTEXT.md` - current agent-facing safety summary.
- `SECURITY.md` - secrets, routing, supply-chain, and repo hygiene guidance.
- `artifacts/every-nation/src/components/Navbar.tsx` - known sensitive dirty
  file; do not touch without explicit Navbar scope.
- `pnpm-lock.yaml` - do not change for dependency-free work.

## Do-not-change Rules

- Do not change auth, payments, sockets, database schema, API behavior, proxy
  routing, deployment behavior, UI, routes, or games unless explicitly scoped.
- Do not stage, revert, format, or clean up unrelated dirty files.
- Do not add dependencies, embeddings, vector databases, external AI services,
  runtime imports, or database tables for memory work.
- Do not copy secrets, credentials, tokens, personal information, production
  data, or environment-variable values into docs.

## Common Agent Mistakes To Avoid

- Following broad suggestions inside existing docs as permission to expand the
  current task.
- Treating public docs updates as a reason to change product behavior.
- Running formatters that rewrite unrelated files.

## Validation Checklist

- Check `git status --short` before and after.
- Confirm `pnpm-lock.yaml` is unchanged.
- Confirm only scoped files appear in `git diff --name-only`.

## Related Docs

- `AI_CONTEXT.md`
- `SECURITY.md`
- `DESIGN_SECURITY_CHECKLIST.md`
- `repo-research/workspace-audit.md`
