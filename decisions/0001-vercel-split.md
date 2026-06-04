# 0001: Vercel Same-Repo Split

Date: 2026-06-04

## Status

Accepted.

## Context

The main website and Errant Night game were already separate workspace apps in a
pnpm workspace:

- `artifacts/every-nation`
- `artifacts/end`

The original root build bundled both apps into one output and served the game
under `/end`. The product needed the main website and game to deploy as separate
Vercel projects without doing a risky file extraction first.

## Decision

Keep the workspace structure and split the Vercel builds first:

- Main website: `pnpm run build:landing` -> `dist`
- Game: `pnpm run build:game` -> `artifacts/end/dist/public`
- Root `vercel.json` does not force one shared `buildCommand` or
  `outputDirectory`.
- Main website originally linked to the game through a configurable external
  URL; this was later replaced by the `/errant-night` website proxy after the
  standalone game repo was verified.
- Game deploys at `/` with `BASE_PATH=/`.

This was committed as:

```text
7587310 Split website and game Vercel builds
```

## Consequences

- Lower risk than moving files immediately.
- Vercel projects can be configured separately while the repo stays intact.
- The game still remains in the website repo for now.
- A later extraction pass is still required to make the game a truly standalone
  repository.
