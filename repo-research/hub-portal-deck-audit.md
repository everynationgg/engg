# Hub Portal Deck Audit

Date: 2026-06-05

## Current Hub Structure

- File: `artifacts/every-nation/src/pages/Hub.tsx`
- The page uses `HUDOverlay`, `useParallax`, `TacticalSlate`, `SciFiButton`,
  and `HeroSection`.
- Background is currently `/hub_bg.png` with grayscale/parallax treatment.
- Daily Tactical Briefing remains embedded in the Hub page and depends on auth
  state.
- Game selection is rendered through `HeroSection` from
  `artifacts/every-nation/src/components/ui/feature-carousel.tsx`.

## Game Catalog Structure

- File: `artifacts/every-nation/src/lib/gameCatalog.ts`
- Defines `GameStatus` and `GameCatalogItem`.
- Current fields:
  - `title`
  - `slug`
  - `subtitle`
  - `description`
  - `image`
  - `href`
  - `status`
  - `legacyPaths`
  - `externalOrigin`
- Current entries:
  - Errant Night: online, `/errant-night`, legacy `/end`
  - Engraved Nether: online, current external Vercel URL
  - Epsilon Nine: offline, locked

## Available Game Media

Website public assets:

- Errant Night: `/ERRANT.png`, `/hub_lockdown.png`, `/hub_newform.png`,
  `/hub_newform.webp`
- Engraved Nether: `/hub_engraved.webp`
- Epsilon Nine: `/hub_epsilon.webp`
- Shared Hub atmosphere: `/hub_bg.png`, `/hub_bracket.png`, `/hub_td.png`,
  `/hub_triad.png`

Attached assets:

- Errant Night richer media: `end.svg`, `Error_Newform_Detected.webp`,
  `wallpaper-landing-page.webp`, role `webp` files, role `webm` files
- Engraved Nether: `Engraved_Nether.webp`
- Epsilon Nine: `Epsilon_Nine.webp`

Do not stage or modify `attached_assets/EN_PAGE_BACKGROUND.webm`.

## Feature Carousel Assessment

`feature-carousel.tsx` can be kept as a reference or fallback, but it should not
be evolved into the Portal Deck directly. It is a centered card carousel with
hard-coded transform behavior. The Portal Deck needs active game atmosphere,
world layers, portal details, keyboard controls, and themed fragments. A new
`components/hub/PortalDeck.tsx` is cleaner and safer.

## Reusable Components To Keep

- `HUDOverlay` for global frame and page label.
- `TacticalSlate` for ENGG framed panels.
- `SciFiButton` for launch/Enter actions.
- `useParallax` for subtle background movement.
- Framer Motion for state transitions.
- Existing shadcn-style `Button` only where simple icon controls are needed.

## Do Not Touch

- `/` homepage and `Home.tsx`
- `C:\projects\errant-night`
- game proxy routing unless a routing bug is explicitly in scope
- API/server/database/auth/PayPal/Socket.IO logic
- `artifacts/every-nation/src/components/Navbar.tsx`
- `attached_assets/EN_PAGE_BACKGROUND.webm`

## Performance Risks

- Pulling in WebGL/Three.js for `/hub` would make the route heavier.
- Large `webm` previews can harm first paint if mounted eagerly.
- Portal transitions can cause CLS if card sizes are not fixed.
- Too many particles can slow mobile.
- Heavy glow/blur stacks can become expensive on lower-end devices.
- External game links should not be preloaded as critical assets.
