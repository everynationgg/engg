# ENGG AI Memory Core

The AI Memory Core is an internal repo knowledge system for coding assistants
working in this repository. It is for Codex, Gemini, Antigravity, and future
agents that need fast, safe orientation before editing.

This is not a product feature. It is not a public route, UI surface, API,
runtime import, game feature, embedding store, vector database, or external AI
service.

## How Agents Should Use It

1. Read `ai-memory/memory-core.md` before editing.
2. Use `ai-memory/index.json` or
   `ai-memory/generated/memory-index.generated.json` to find the focused node
   for the task.
3. Read the related source docs listed in the node frontmatter.
4. Check the dirty worktree before touching files.
5. Keep edits scoped to the task and run the validation commands documented in
   the relevant node.

## Memory Layout

- `memory-core.md` is the start-here summary.
- `index.json` is the static machine-readable index.
- `nodes/*.md` are focused memory nodes.
- `schemas/memory-node.schema.json` describes node metadata.
- `generated/memory-index.generated.json` is produced from node frontmatter.

## Maintenance

Update memory nodes when the source docs, decisions, or repository shape change
materially. Then run:

```powershell
pnpm run memory:index
```

Keep generated output deterministic. Rerunning the index command should not
produce a diff when node metadata has not changed.

Do not copy secrets, environment-variable values, credentials, tokens, personal
information, or production data into memory files.
