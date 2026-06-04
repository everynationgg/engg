# 0002: Game Repository Separation Plan

Date: 2026-06-04

## Status

Planned.

## Context

The same-repo Vercel split is useful, but it does not fully separate ownership.
The website repo still contains game source, game media, and game dependencies.

The product target is:

- Website repo owns the main ENGG website.
- Game repo owns Errant Night.
- API remains separately hosted on Fly unless a later decision changes it.

## Decision

Prepare a standalone Errant Night repository after documentation and dependency
audits are complete.

The extraction should:

- Copy or move `artifacts/end` into a new repo.
- Copy only the game-required media from `attached_assets`.
- Replace workspace references with standalone equivalents.
- Keep API calls pointed at `https://engg.fly.dev`.
- Deploy the game at `/` on its own Vercel project/domain.
- Preserve game behavior.

## Consequences

- The game can have its own release cadence and deployment lifecycle.
- The website repo can eventually remove game-only dependencies and assets.
- Shared code decisions must be explicit: duplicate minimal code, generate a
  standalone API client, or create a clean shared package.
- Extraction should not start until route, asset, and dependency audits are
  complete.
