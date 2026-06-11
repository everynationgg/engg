---
id: "security"
title: "Security"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 100
summary: "Secrets, env handling, supply-chain policy, payment caution, routing safety, and repo hygiene."
source_files:
  - "SECURITY.md"
  - "DESIGN_SECURITY_CHECKLIST.md"
  - "GAME_SECURITY_CHECKLIST.md"
  - "pnpm-workspace.yaml"
related_nodes:
  - "safety-rules"
  - "api-server"
  - "deployment"
  - "testing"
---

# Security

## Purpose

Keep security-sensitive repo behavior visible to agents before they edit.

## Current Facts

Secrets do not belong in the repository. Browser-exposed variables must only be
public configuration names and must not include secret values in docs. The pnpm
workspace uses supply-chain controls. Payment, auth, API, Socket.IO, and routing
changes require explicit scope.

## Important Paths/Files

- `SECURITY.md`
- `DESIGN_SECURITY_CHECKLIST.md`
- `GAME_SECURITY_CHECKLIST.md`
- `pnpm-workspace.yaml`
- `.env.example` files
- `vercel.json`

## Do-not-change Rules

- Do not commit secrets, credentials, tokens, personal information, production
  data, or environment-variable values.
- Do not weaken pnpm supply-chain policy without explicit security review.
- Do not change payment, auth, API, socket, or proxy behavior for unrelated
  tasks.

## Common Agent Mistakes To Avoid

- Confusing public variable names with safe-to-copy values.
- Adding provider credentials to Vite-facing config.
- Staging lockfile changes for dependency-free tasks.

## Validation Checklist

- Check `git diff --name-only` for accidental lockfile or env changes.
- Run `git diff --check`.
- For runtime security changes, run the relevant focused validation in addition
  to workspace checks.

## Related Docs

- `SECURITY.md`
- `DESIGN_SECURITY_CHECKLIST.md`
- `GAME_SECURITY_CHECKLIST.md`
- `pnpm-workspace.yaml`
