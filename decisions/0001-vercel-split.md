# 0001: Vercel Same-Repo Split

Date: 2026-06-04

## Status

Accepted.

## Context

The main website and Errant Night game were already separate workspace apps in a
pnpm workspace:

- `artifacts/every-nation`
- the old in-repo Errant Night app

The original root build bundled both apps into one output and served the game
under `/end`. The product needed the main website and game to deploy as separate
Vercel projects without doing a risky file extraction first.

## Decision

Keep the workspace structure and split the Vercel builds first:

- Main website: `pnpm run build:landing` -> `dist`
- Game: standalone repo build -> `dist/public`
- Root `vercel.json` does not force one shared `buildCommand` or
  `outputDirectory`.
- Main website originally linked to the game through a configurable external
  URL; this was later replaced by the `/errant-night` website proxy after the
  standalone game repo was verified.
- Game deploys from `everynationgg/errant-night` with
  `BASE_PATH=/errant-night/`.

This was committed as:

```text
7587310 Split website and game Vercel builds
```

## Consequences

- Lower risk than moving files immediately.
- Vercel projects can be configured separately while the repo stays intact.
- This decision is now historical; the game has moved to its standalone
  repository and the old in-repo app has been removed.
