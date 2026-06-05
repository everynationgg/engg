# Hub Portal Deck Plan

This is the concrete implementation plan for the ENGG Portal Deck. It stops
short of code changes until approved.

## Current State

- `/hub` is owned by `artifacts/every-nation/src/pages/Hub.tsx`.
- Hub game data comes from `artifacts/every-nation/src/lib/gameCatalog.ts`.
- The visible game selector is `artifacts/every-nation/src/components/ui/feature-carousel.tsx`.
- The page already uses Framer Motion, `HUDOverlay`, `TacticalSlate`,
  `SciFiButton`, and `useParallax`.
- The homepage `/` is video-led and is not part of this work.

## Recommended Shape

Build a new Hub component:

```text
artifacts/every-nation/src/components/hub/PortalDeck.tsx
```

Optional supporting files:

```text
artifacts/every-nation/src/components/hub/PortalCard.tsx
artifacts/every-nation/src/components/hub/PortalAtmosphere.tsx
artifacts/every-nation/src/components/hub/PortalFragments.tsx
```

Keep `feature-carousel.tsx` in place for now. It is useful reference code, but
the Portal Deck wants a different layout and should not be forced into the old
carousel component.

## Implementation Steps

1. Extend `gameCatalog.ts` with optional `theme` metadata.
2. Add theme entries for Errant Night, Engraved Nether, and Epsilon Nine.
3. Create `components/hub/PortalDeck.tsx`.
4. Let Portal Deck own active game selection.
5. Render a layered background based on active game theme.
6. Render a dominant active portal card with preview media.
7. Render adjacent game selectors as smaller deck items.
8. Add an Enter button that navigates only when the active game is online.
9. Keep Epsilon Nine locked and non-navigating.
10. Add reduced-motion and mobile fallbacks.
11. Replace the old `HeroSection` usage in `Hub.tsx` with `PortalDeck`.

## v1 Behavior

- Selected game changes the full-page background.
- Active card becomes portal-like and visually dominant.
- Preview image appears inside active card.
- Themed fragments float around the active portal.
- Previous/next or click selection changes active game.
- Enter launches only online games.
- Offline games show a locked state.
- Mobile uses a vertical or simplified stacked deck.
- Reduced-motion uses fades and static fragments.

## Assets To Use First

Use existing website public assets first:

- Errant Night: `/ERRANT.png`
- Engraved Nether: `/hub_engraved.webp`
- Epsilon Nine: `/hub_epsilon.webp`
- Shared background fallback: `/hub_bg.png`

Potential richer assets exist in `attached_assets`, but do not stage or modify
binary assets during the first implementation unless a specific asset is
approved.

## Files Allowed In v1

- `artifacts/every-nation/src/pages/Hub.tsx`
- `artifacts/every-nation/src/lib/gameCatalog.ts`
- new files under `artifacts/every-nation/src/components/hub/`

Do not touch homepage, Navbar, routing, API, auth, PayPal, Socket.IO, package
files, or the standalone game repo.

## Validation

Run:

```powershell
pnpm run typecheck
pnpm run build:landing
pnpm --filter @workspace/every-nation run typecheck
```

Manual checks:

- `/hub` desktop
- `/hub` mobile
- Errant Night enters `/errant-night`
- Engraved Nether behavior unchanged
- Epsilon Nine remains locked
- keyboard focus reaches selection and Enter controls
- reduced-motion fallback exists
- no horizontal overflow
- `/` homepage unchanged
