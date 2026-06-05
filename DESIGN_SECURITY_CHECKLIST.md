# Design Security Checklist

Use this checklist when implementing the Portal Deck or similar high-impact UI.

## Data And Links

- Game links must come from trusted catalog data.
- Do not allow user-controlled URLs in portal navigation.
- Offline games must not navigate.
- External origins are internal deployment context, not user-facing copy.
- Do not add raw HTML injection.

## Product Boundaries

- Do not change auth behavior.
- Do not change payment behavior.
- Do not change API, database, or Socket.IO behavior.
- Do not change Vercel proxy routes unless routing is explicitly in scope.
- Do not expose secrets through client-side environment variables.

## Errors And States

- Do not show raw API errors in the Portal Deck.
- Keep locked/offline states explicit and non-clickable.
- Keep focus states visible.
- Keep reduced-motion fallback usable.

## Assets

- Use local trusted assets or approved game origins.
- Do not hotlink unknown third-party media.
- Do not stage unrelated binary asset changes.
- Large media should not block first paint.
