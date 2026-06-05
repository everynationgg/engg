# Game Extraction Summary

Original audit date: 2026-06-04
Updated: 2026-06-05

## Current Location

Errant Night now lives in the standalone repository:

```text
everynationgg/errant-night
```

The website repository no longer owns the game source package.

## Runtime/Build

- Vite
- React
- TypeScript
- Tailwind CSS
- wouter

## Important Dependencies

The standalone game keeps its own package setup for:

- `@paypal/react-paypal-js`
- `@vercel/speed-insights`
- `socket.io-client`
- `react-icons`
- Radix UI packages
- `@tanstack/react-query`
- Framer Motion
- Lucide React
- React Hook Form
- Recharts
- Sonner
- Zod
- local API helper code copied during extraction

## Asset Dependencies

Required game media was copied into the standalone game repo. Do not move or
prune website repo media in this cleanup unless a separate asset audit confirms
it is unused by the website.

## Environment Dependencies

Standalone game Vercel env:

- `BASE_PATH=/errant-night/`
- `VITE_API_URL=https://engg.fly.dev`
- `VITE_API_BASE_URL=https://engg.fly.dev/api`
- `VITE_PAYPAL_CLIENT_ID=<public PayPal client id>`

Local helper env:

- `PORT`
- `API_SERVER_PORT`

## Routes To Preserve

- `/errant-night/`
- `/errant-night/join/:roomCode`
- `/errant-night/room/:roomCode`
- `/profile`
- `/settings`
- `/verify-email`
- `/reset-password`
- `/admin/logs`

Legacy in-game route redirects also exist and should not be removed without a
separate game-routing decision.

## API And Socket Dependencies

- HTTP API calls use `VITE_API_URL`.
- Admin logs may use `VITE_API_BASE_URL`.
- Socket.IO client uses `VITE_API_URL` and path `/socket.io`.
- Production API/socket target is `https://engg.fly.dev`.

## Resolved Extraction Risks

- Missing game media was addressed by copying required assets into the
  standalone repo.
- Workspace-only API client dependency was replaced with local standalone code.
- `BASE_PATH=/errant-night/` was verified in production.
- Socket.IO path continues to route to `https://engg.fly.dev`.
- PayPal public client ID is set in the Everynation Vercel game project.
