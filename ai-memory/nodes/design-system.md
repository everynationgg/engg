---
id: "design-system"
title: "Design System"
type: "memory_node"
status: "active"
last_reviewed: "2026-06-11"
priority: 80
summary: "Hub visual system, Portal Deck direction, UI standards, and design safety constraints."
source_files:
  - "HUB_VISUAL_SYSTEM.md"
  - "PORTAL_DECK_DESIGN.md"
  - "UI_STANDARDS.md"
  - "DESIGN_SECURITY_CHECKLIST.md"
related_nodes:
  - "website"
  - "performance"
  - "security"
---

# Design System

## Purpose

Point agents to the current design direction without authorizing UI changes for
unrelated work.

## Current Facts

The Hub direction is the Portal Deck: a game launcher where the selected game
controls the atmosphere and active portal. UI standards emphasize responsive,
readable, mobile-safe layouts. Design security rules keep navigation data
trusted and offline states non-navigating.

## Important Paths/Files

- `HUB_VISUAL_SYSTEM.md`
- `PORTAL_DECK_DESIGN.md`
- `UI_STANDARDS.md`
- `DESIGN_SECURITY_CHECKLIST.md`
- `artifacts/every-nation/src/components/hub/`
- `artifacts/every-nation/src/pages/Hub.tsx`

## Do-not-change Rules

- Do not add UI, routes, animations, or components for memory-only work.
- Do not change Hub behavior unless the task explicitly scopes Hub work.
- Do not use untrusted or user-controlled URLs for game navigation.

## Common Agent Mistakes To Avoid

- Treating design docs as approval to redesign public pages.
- Adding heavy animation or WebGL where the docs call for a lighter first pass.
- Making offline games clickable.

## Validation Checklist

- For design work, validate mobile layout, keyboard focus, reduced motion, and
  no horizontal overflow.
- For memory work, confirm no UI files changed.
- Run `pnpm run build:landing` after actual website UI changes.

## Related Docs

- `HUB_VISUAL_SYSTEM.md`
- `PORTAL_DECK_DESIGN.md`
- `UI_STANDARDS.md`
- `DESIGN_SECURITY_CHECKLIST.md`
