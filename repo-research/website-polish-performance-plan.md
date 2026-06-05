# Website Polish And Performance Plan

Date: 2026-06-04

Status: planning only. Do not treat this document as approval to change app code.

## Purpose

This plan keeps the main website polish pass controlled, measurable, and reversible. The goal is to improve first-load performance and visual clarity without turning the work into a broad redesign or mixing it with the standalone Errant Night game extraction.

Scope is limited to the main website app:

- `artifacts/every-nation`

## Current Problems

- The website feels visually weak or unfinished in places, especially on the first homepage view.
- Homepage LCP is likely poor because the first visual layer depends on a full-screen autoplay video.
- Vercel Speed Insights may be unstable or noisy because the first load performs too much visual work.
- First load likely mounts more than it needs, including expensive visual components.
- The full-screen `/bg-video.mp4` and WebGL `AuroraShader` may be hurting first paint and main-thread stability.
- App routes appear to be eagerly imported, which likely increases the initial JavaScript bundle.
- Hub images are rendered with plain `<img>` tags and may lack explicit dimensions, loading strategy, and stable aspect ratio handling.
- Heavy visual dependencies such as Three.js may be included too early in the page lifecycle.

## Non-Goals

- Do not redesign the whole brand.
- Do not change auth.
- Do not change API, server, or database behavior.
- Do not change PayPal.
- Do not change Socket.IO.
- Do not touch game extraction work.
- Do not touch `C:\projects\errant-night`.
- Do not touch unrelated `artifacts/every-nation/src/components/Navbar.tsx`.
- Do not mix website polish with game extraction or cleanup.
- Do not make large unrelated UI rewrites.
- Do not remove dependencies unless they are proven unused and removal is separately approved.

## Performance Goals

- Improve homepage LCP.
- Reduce initial JavaScript cost.
- Reduce layout shift.
- Avoid mounting WebGL on first paint.
- Make the homepage meaningful before the video or shader loads.
- Keep the sci-fi visual identity polished, but make the first render lighter.
- Keep Vercel Speed Insights more stable by reducing early autoplay, GPU, and layout work.

## UI Goals

- Make the homepage clearer.
- Make CTAs more obvious.
- Make hub cards more readable.
- Improve mobile spacing.
- Improve contrast where text is currently too low opacity.
- Keep the sci-fi and cyberpunk identity.
- Avoid making the site generic or marketing-template-like.

## Proposed Safe Implementation Plan

1. Audit current files before editing:
   - `artifacts/every-nation/src/main.tsx`
   - `artifacts/every-nation/src/App.tsx`
   - `artifacts/every-nation/src/pages/Home.tsx`
   - `artifacts/every-nation/src/pages/Hub.tsx`
   - `artifacts/every-nation/src/components/ui/animated-shader-background.tsx`
   - `artifacts/every-nation/src/components/ui/feature-carousel.tsx`
   - `artifacts/every-nation/vite.config.ts`
   - `artifacts/every-nation/package.json`
   - public assets used by homepage and hub

2. Split routes safely:
   - Keep the homepage in the initial route.
   - Lazy-load non-home pages with `React.lazy` and `Suspense`.
   - Use a lightweight loading fallback.
   - Do not lazy-load tiny shared primitives unnecessarily.

3. Improve homepage first paint:
   - Add a lightweight static hero fallback or poster.
   - Do not rely on `/bg-video.mp4` as the first meaningful visual.
   - Delay or lazy-load the video until after initial paint, after idle time, or after first interaction.
   - Add a `poster` attribute if the video remains.
   - Keep reserved layout space so the hero does not shift when enhanced media loads.

4. Delay WebGL work:
   - Lazy-load `AuroraShader`.
   - Only mount it after first render.
   - Skip it when `prefers-reduced-motion` is enabled.
   - Skip or degrade it on low capability devices where practical.
   - Provide a CSS gradient fallback so the page still looks intentional.

5. Stabilize hub images:
   - Add explicit width and height, or stable aspect ratio containers.
   - Add `loading="lazy"` for non-priority images.
   - Add `decoding="async"`.
   - Keep the center or active game image visually sharp.
   - Avoid layout shifts when carousel state changes.

6. Polish UI without redesigning:
   - Make homepage CTA labels clearer.
   - Make the first viewport feel more complete and intentional.
   - Improve hub card readability and contrast.
   - Tighten mobile spacing.
   - Keep changes scoped to `artifacts/every-nation`.

7. Preserve analytics and Speed Insights behavior:
   - Confirm `@vercel/speed-insights` is not initialized more than once if used.
   - Do not add duplicate analytics.
   - Do not remove analytics unless broken.
   - Add short comments only where they explain LCP or CLS decisions.

## Validation Checklist

Commands:

```bash
pnpm run typecheck
pnpm run build:landing
pnpm --filter @workspace/every-nation run typecheck
```

Build output checks:

- Confirm route chunks are split.
- Confirm Three.js is not loaded in the initial homepage path if possible.
- Confirm no broken asset paths.
- Confirm the main website build still outputs correctly.

Manual route checks:

- `/`
- `/hub`
- `/shop`
- `/login`
- `/register`
- `/profile`
- `/verify`
- `/forgot-password`
- `/reset-password`

Manual performance and UI checks:

- Mobile view.
- Console errors.
- Lighthouse or Chrome DevTools performance check.
- LCP behavior.
- CLS behavior.
- Homepage first paint before video and shader enhancement.
- Hub card image stability.

## Rollback Notes

- Use one separate commit for the polish and performance pass.
- Commit message should be:

```bash
git commit -m "Improve website performance and polish"
```

- Do not include unrelated files.
- Do not stage or commit `artifacts/every-nation/src/components/Navbar.tsx`.
- Keep visual changes reversible.
- Avoid dependency removal or broad refactors in this pass.

## Risks And Watch Points

- Vite preview and local Lighthouse may not perfectly match Vercel production metrics.
- Delaying video and WebGL may slightly change the first few seconds of the homepage experience.
- Lazy route loading can expose missing Suspense boundaries if implemented carelessly.
- Hub carousel image changes must preserve the intended active-card visual hierarchy.
- Existing unrelated working tree changes must not be staged with this work.

## Implementation Result

Date: 2026-06-04

Status: implemented as a scoped website polish and performance pass.

### LCP Strategy Used

- The homepage now has an immediate static visual layer using `/opengraph.jpg` plus lightweight CSS gradients and grid texture.
- `/bg-video.mp4` is no longer the first critical visual dependency.
- The video remains as progressive enhancement with `poster="/opengraph.jpg"` and `preload="none"`.
- Homepage copy and CTAs render immediately so the first viewport is meaningful before media enhancements load.

### Shader And Video Loading Strategy

- `AuroraShader` is lazy-loaded and only mounted after the first render path has settled.
- WebGL is skipped for reduced-motion users and low-capability device hints.
- The shader renderer now uses lower-power settings and a capped pixel ratio.
- CSS fallback layers preserve the sci-fi visual identity when video or WebGL is delayed or skipped.

### Route Splitting Changes

- The homepage remains eagerly loaded.
- Non-home routes are lazy-loaded behind a lightweight Suspense fallback:
  - `/hub`
  - `/shop`
  - `/login`
  - `/register`
  - `/profile`
  - `/verify`
  - `/forgot-password`
  - `/reset-password`
- Shared navigation/sidebar UI for non-home pages is lazy-loaded without changing its behavior.

### Image Stability Changes

- Hub carousel cards now keep stable dimensions across mobile and desktop.
- Carousel images now include explicit `width`, `height`, `sizes`, `loading`, `decoding`, and `fetchPriority` hints.
- The active card remains priority-loaded while adjacent cards are lazy-loaded.
- Text contrast, status labels, and mobile spacing were tightened without rewriting the carousel.

### Remaining Risks

- Vite preview is still only an approximation of Vercel production behavior.
- Three.js remains a large lazy chunk for routes and visual effects that still need it.
- Real LCP and CLS should be confirmed in Vercel Speed Insights or Chrome Lighthouse after deployment.
