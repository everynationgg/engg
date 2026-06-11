---
id: "performance"
title: "Performance"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 90
summary: "Performance budgets for the website and Hub, especially media, motion, route loading, and layout stability."
source_files:
  - "DESIGN_PERFORMANCE_BUDGET.md"
  - "repo-research/website-polish-performance-plan.md"
  - "TESTING.md"
related_nodes:
  - "website"
  - "design-system"
  - "testing"
---

# Performance

## Purpose

Keep agents aware of known performance constraints before changing the website
or Hub.

## Current Facts

The website should keep first paint meaningful, route loading controlled, media
non-blocking, and layout stable. The Portal Deck direction calls for cheap
motion first, reduced-motion support, and stable aspect ratios.

## Important Paths/Files

- `DESIGN_PERFORMANCE_BUDGET.md`
- `repo-research/website-polish-performance-plan.md`
- `artifacts/every-nation/src/pages/Home.tsx`
- `artifacts/every-nation/src/pages/Hub.tsx`
- `artifacts/every-nation/src/components/ui/`

## Do-not-change Rules

- Do not add heavy dependencies for performance-sensitive work without explicit
  approval.
- Do not mount expensive visual effects on unrelated routes.
- Do not change app performance behavior for memory-only work.

## Common Agent Mistakes To Avoid

- Loading large videos or game media eagerly.
- Animating layout properties instead of transform and opacity.
- Creating layout shift by omitting stable dimensions.

## Validation Checklist

- For website performance changes, run `pnpm run typecheck` and
  `pnpm run build:landing`.
- Manually inspect affected routes when UI is in scope.
- For memory-only work, confirm no app source files changed.

## Related Docs

- `DESIGN_PERFORMANCE_BUDGET.md`
- `repo-research/website-polish-performance-plan.md`
- `TESTING.md`
