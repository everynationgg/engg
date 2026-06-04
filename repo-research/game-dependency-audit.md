# Game Dependency Audit

Date: 2026-06-04

## App

Path: `artifacts/end`

Package: `@workspace/end`

## Runtime/Build

- Vite
- React
- TypeScript
- Tailwind CSS
- wouter

## Important Dependencies

From `artifacts/end/package.json`:

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
- `@workspace/api-client-react`

## Workspace Dependencies

The game imports `@workspace/api-client-react` in
`artifacts/end/src/hooks/useAuth.tsx`.

Before extracting the game, choose one:

- Copy the minimal API client helper code into the game repo.
- Generate a standalone API client from `lib/api-spec`.
- Create a clean shared package if the organization wants shared package
  maintenance across repos.

Do not leave a broken `workspace:*` dependency in a standalone repo.

## Asset Dependencies

The game Vite config defines:

```text
@assets -> attached_assets
```

Current game imports include role images/videos, landing art, join page art, and
how-to-play art from `attached_assets`.

Before extraction:

- List every `@assets` import.
- Copy only required assets into the game repo.
- Replace the alias target with a game-local assets folder.
- Verify build output still includes all media.

## Environment Dependencies

Game Vercel env:

- `BASE_PATH=/`
- `VITE_API_URL=https://engg.fly.dev`
- `VITE_API_BASE_URL=https://engg.fly.dev/api`
- `VITE_PAYPAL_CLIENT_ID=<public PayPal client id>`

Local helper env:

- `PORT`
- `API_SERVER_PORT`

## Routes To Preserve

- `/`
- `/join/:roomCode`
- `/room/:roomCode`
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

## Extraction Risks

- Missing `attached_assets` media.
- Broken `@workspace/api-client-react` dependency.
- Incorrect `BASE_PATH` causing root-domain assets to fail.
- Socket.IO path or CORS issues after domain change.
- PayPal public client ID missing in the new Vercel project.
- SEO/manifest URLs accidentally pointing back to `/end`.
