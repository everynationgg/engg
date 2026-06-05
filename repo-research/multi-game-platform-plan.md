# Multi-Game Platform Plan

Date: 2026-06-05

## Audit Findings

- The Hub previously kept its game list inline in
  `artifacts/every-nation/src/pages/Hub.tsx`.
- `artifacts/every-nation/src/lib/externalLinks.ts` only provides the current
  Errant Night website path helper.
- Root `vercel.json` already proxies Errant Night through `/errant-night` and
  keeps `/end` as a legacy redirect.
- Existing docs focus on the Errant Night extraction. They do not yet define a
  repeatable multi-game onboarding, registry, proxy, QA, or security pattern.
- No current doc fully covers multi-game onboarding.

## Current Game State

- Errant Night is standalone and proxied at `/errant-night`.
- Engraved Nether still links to its current external Vercel URL.
- Epsilon Nine remains locked/offline in the Hub.

## Goals

- Make the website a clean multi-game portal.
- Keep public game URLs under `https://www.engg.online/<game-slug>`.
- Keep each game in its own repository and Vercel project.
- Keep the Hub data-driven without redesigning the Hub UI.
- Preserve API and Socket.IO routing to Fly.

## Non-Goals

- Do not redesign the Hub.
- Do not move Engraved Nether or Epsilon Nine in this pass.
- Do not change auth, PayPal, API, database, or Socket.IO logic.
- Do not attach public game subdomains.
- Do not touch the standalone Errant Night repo.

## Proposed Plan

1. Add a game catalog module for Hub card data.
2. Document game architecture, registry, onboarding, deployment, routing, QA,
   and security standards.
3. When a new game is ready, create its standalone repo and Vercel project.
4. Add website proxy routes for the new slug.
5. Update the Hub catalog entry to point to the website path.
6. Verify direct game origin routes, website proxy routes, API, and sockets.

## Risks

- External Vercel origins can be protected or moved, breaking website proxy
  routes.
- Missing explicit trailing-slash routes can produce empty-path 404s.
- A game with an incorrect `BASE_PATH` can work directly but fail through the
  website proxy.
- Hub cards can drift if game copy, status, and routing live in separate files.

## Open Follow-Ups

- Decide when Engraved Nether should move behind a website path proxy.
- Decide when Epsilon Nine should get a standalone repo.
- Add production proxy checks after each new game deploy.
