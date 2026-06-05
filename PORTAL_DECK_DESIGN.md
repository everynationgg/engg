# ENGG Portal Deck Design

The ENGG Portal Deck is the target direction for `/hub`: a futuristic game
launcher where the selected game owns the atmosphere and the card becomes a
threshold into that world.

## Core Concept

- The selected game controls the full-page atmosphere.
- The active card is a portal or door, not just a thumbnail.
- Game-specific background layers change when selection changes.
- Preview media lives inside the active portal card.
- Themed fragments can flow out from the card into the page.
- Game details update around the active portal.
- The Enter action should feel like crossing into the game.
- The UI must stay readable, keyboard-accessible, and usable on mobile.

## Visual Language

The Deck should feel like a console-quality game library with diegetic ENGG
interfaces layered over game worlds.

Use:

- layered world previews
- disciplined glow
- CSS perspective and Framer Motion transitions
- framed portal cards
- game-specific color atmospheres
- subtle particles and fragments
- readable labels, status, and launch affordances

Avoid:

- generic SaaS cards
- random neon dashboard grids
- unreadable tiny cyberpunk text
- excessive bloom or over-glow
- heavy WebGL in the first version
- homepage visual language duplication

## Game Theme Metadata

Extend `artifacts/every-nation/src/lib/gameCatalog.ts` with optional theme
metadata after the design pass is approved:

```ts
type GameTheme = {
  accent: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  previewImage?: string;
  previewVideo?: string;
  portalEffect?: "signal-breach" | "nether-rune" | "orbital-command" | "default";
  particles?: Array<"scanline" | "role-card" | "moon" | "rune" | "orbit">;
};
```

Then add:

```ts
theme?: GameTheme;
```

Keep this optional so existing game entries remain valid during migration.

## Current Game Direction

- Errant Night
  - Effect: `signal-breach`
  - Particles: `scanline`, `role-card`
  - Portal feel: breach into a defensive network operation.
- Engraved Nether
  - Effect: `nether-rune`
  - Particles: `rune`
  - Portal feel: descent into a subterranean extraction field.
- Epsilon Nine
  - Effect: `orbital-command`
  - Particles: `moon`, `orbit`
  - Portal feel: locked orbital command station.

## Motion Rules

- Use 2.5D first: Framer Motion, CSS transforms, perspective, layered
  backgrounds, and parallax.
- Respect `prefers-reduced-motion`.
- Reduced-motion users should see static or gently faded state changes.
- Do not mount React Three Fiber or WebGL in v1.
- Make active card transitions quick and legible, not disorienting.

## Interaction Rules

- Errant Night enters `/errant-night`.
- Engraved Nether behavior remains unchanged for now.
- Epsilon Nine remains offline and locked.
- Offline games must never navigate.
- Keyboard focus must reach game selection controls and the Enter action.
- The Enter action must use trusted catalog `href` data only.
