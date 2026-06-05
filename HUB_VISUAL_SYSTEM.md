# Hub Visual System

The Portal Deck visual system should make each selected game feel like it is
temporarily taking over the Hub.

## Layers

1. Base world layer
   - A full-page image or gradient tied to the active game.
   - Must have a fallback when media is still loading.
2. Atmosphere layer
   - Subtle color wash, vignette, scanline, or fog.
   - Should make the game world recognizable without overpowering text.
3. Portal card layer
   - The active card uses CSS perspective and framed media.
   - The portal frame is the main action surface.
4. Fragment layer
   - Small themed particles or fragments drift outward.
   - These are decorative and must not intercept clicks.
5. Interface layer
   - Game title, status, description, and Enter action.
   - Must remain readable at all times.

## Effects By Game

### Errant Night

- Accent: cyan/electric blue.
- Background: `/hub_bg.png` or `/ERRANT.png` treatment.
- Portal effect: signal breach.
- Fragments: scanlines, role-card silhouettes, data shards.

### Engraved Nether

- Accent: violet/magenta or subterranean ember.
- Background: `/hub_engraved.webp`.
- Portal effect: nether rune.
- Fragments: rune marks, dust, fractured glyphs.

### Epsilon Nine

- Accent: amber/white with cold orbital blue.
- Background: `/hub_epsilon.webp`.
- Portal effect: orbital command.
- Fragments: moons, orbit paths, targeting ticks.
- Status: locked/offline.

## Layout Rules

- Keep the active portal visually dominant on desktop.
- Keep adjacent games visible as selectors, not competing cards.
- Use a stable aspect ratio for portal media.
- Avoid horizontal overflow on mobile.
- On mobile, stack details below the portal and make controls easy to hit.
- Use readable text sizes; do not rely on ultra-small labels for meaning.

## Motion Rules

- Use Framer Motion and CSS transforms.
- Keep background crossfades smooth.
- Use `transform` and `opacity` rather than layout-changing animation.
- Disable or simplify movement for reduced-motion users.
- Do not add WebGL in v1.
