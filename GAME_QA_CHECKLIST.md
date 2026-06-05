# Game QA Checklist

Run this before publishing or changing a game proxy.

## Website Checks

- `/hub` renders the expected cards.
- Online games navigate to their configured `href`.
- Offline games do not navigate.
- Legacy redirects still work.
- The website SPA fallback still works for normal website routes.

## Game Origin Checks

- `/<game-slug>`
- `/<game-slug>/`
- `/<game-slug>/join/ABC123`
- `/<game-slug>/room/ABC123`
- Refresh nested routes.
- Confirm assets load from the expected path.
- Confirm the app mounts without console errors.

## Proxy Checks

- `https://www.engg.online/<game-slug>`
- `https://www.engg.online/<game-slug>/`
- `https://www.engg.online/<game-slug>/join/ABC123`
- `https://www.engg.online/<game-slug>/room/ABC123`
- Any legacy redirect path.

## Service Checks

- `/api/*` reaches `https://engg.fly.dev`.
- `/socket.io/*` reaches `https://engg.fly.dev`.
- Auth-required flows do not leak tokens in URLs.
- PayPal client configuration is present only when the game needs it.

## Website Validation Commands

```powershell
pnpm run typecheck
pnpm run build:landing
pnpm --filter @workspace/every-nation run typecheck
```
