# 0005: Hub Portal Deck Direction

Date: 2026-06-05

Status: Proposed

## Context

The Hub currently renders games as a carousel. ENGG now has a multi-game
architecture and needs `/hub` to feel like a premium game launcher, not a
generic neon dashboard. The homepage remains video-led and is not part of this
decision.

## Decision

The next Hub direction is the ENGG Portal Deck: a 2.5D game launcher where the
selected game controls the page atmosphere and the active card becomes a portal
into that game.

The first implementation should use Framer Motion, CSS transforms, layered
backgrounds, existing images, and reduced-motion fallbacks. It should not use
WebGL, React Three Fiber, GSAP, or new heavy dependencies in v1.

## Consequences

- The Hub should get a new `components/hub/PortalDeck.tsx` component instead of
  stretching the existing carousel into a different design.
- `gameCatalog.ts` should gain optional theme metadata so future games can be
  added cleanly.
- Errant Night continues to enter `/errant-night`.
- Engraved Nether behavior remains unchanged for now.
- Epsilon Nine remains locked/offline.
- Implementation must stay scoped to `/hub`.
