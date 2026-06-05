# Design Performance Budget

The Portal Deck should look ambitious without making `/hub` heavy or unstable.

## Budget Rules

- No WebGL in Portal Deck v1.
- No new heavy animation dependency in v1.
- Use Framer Motion and CSS transforms already present in the app.
- Keep route chunking intact.
- Do not load homepage video assets on `/hub`.
- Do not create a blank screen while game media loads.
- Do not introduce CLS from changing card or media dimensions.
- Use stable aspect ratios for portal media.
- Use non-blocking images and lazy media where possible.
- Keep decorative fragments cheap and pointer-events disabled.

## Media Rules

- Prefer existing public images for v1.
- Large videos must be opt-in, lazy, and non-critical.
- Active game preview can be eager if it is small and essential.
- Adjacent or inactive previews should be lazy.
- Provide static fallbacks for video and missing assets.

## Motion Rules

- Animate `opacity` and `transform`.
- Avoid animating layout properties such as width, height, top, or left where
  possible.
- Keep particle counts low.
- Respect `prefers-reduced-motion`.
- Mobile should use simpler motion and fewer fragments.

## Validation

After implementation:

- Confirm `/hub` renders immediately with fallback visuals.
- Confirm there is no horizontal overflow.
- Confirm Lighthouse or DevTools does not show obvious layout shift from portal
  media.
- Confirm no Three.js or React Three Fiber code is pulled into the Hub route by
  the Portal Deck.
