# 0004: Multi-Game Path Routing

Date: 2026-06-05

Status: Accepted

## Context

Errant Night now lives in a standalone repository and is served through the
website path `/errant-night`. The website also has Hub entries for Engraved
Nether and Epsilon Nine. Future games need a consistent path, repo, deployment,
and proxy pattern.

## Decision

ENGG games should use public website paths:

```text
https://www.engg.online/<game-slug>
```

Each game should live in its own GitHub repository and Vercel project under the
Everynation team. The website should proxy game paths to those standalone game
origins. Public game subdomains are not the default and require explicit
approval.

Game slugs must be lowercase, kebab-case, and stable once public. Old public
slugs should be preserved with server-level redirects.

## Consequences

- The website becomes the portal and routing gateway for public game paths.
- Game teams can deploy independently.
- The Hub can use a shared game catalog instead of inline hardcoded card data.
- Vercel routing must explicitly handle empty paths, trailing slashes, assets,
  nested SPA routes, and legacy redirects.
