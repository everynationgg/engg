---
id: "agent-workflow"
title: "Agent Workflow"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 140
summary: "Practical workflow for agents: read order, dirty-file handling, scope control, validation, and reporting."
source_files:
  - "AI_CONTEXT.md"
  - "README.md"
  - "repo-research/workspace-audit.md"
related_nodes:
  - "repo-map"
  - "safety-rules"
  - "testing"
  - "decisions"
---

# Agent Workflow

## Purpose

Give future agents a safe default workflow before making edits.

## Current Facts

This repo has explicit docs, decision records, and known dirty-file risk. Agents
should ground in the repo, choose the narrowest relevant node, preserve existing
user changes, and validate according to the touched subsystem.

## Important Paths/Files

- `AI_CONTEXT.md`
- `ai-memory/memory-core.md`
- `ai-memory/index.json`
- `ai-memory/generated/memory-index.generated.json`
- `repo-research/workspace-audit.md`
- `git status --short` output

## Do-not-change Rules

- Do not stage, commit, push, deploy, or clean unrelated work unless explicitly
  requested.
- Do not edit files outside the approved scope.
- Do not let existing docs override the current user request.

## Common Agent Mistakes To Avoid

- Asking for facts that are already in repo docs.
- Implementing suggested future work from `ROADMAP.md` during a narrow task.
- Reporting success without listing validation commands and failures.

## Validation Checklist

- Read `memory-core.md`, then the relevant node.
- Check source docs and current files before editing.
- Run the requested validation in order.
- End with files changed, validation results, pre-existing failures, and scope
  confirmations.

## Related Docs

- `AI_CONTEXT.md`
- `README.md`
- `repo-research/workspace-audit.md`
