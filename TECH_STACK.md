# Tech Stack

## Workspace

- pnpm workspace
- TypeScript
- Vite
- React
- Tailwind CSS
- wouter for frontend routing

## Main Website

Path: `artifacts/every-nation`

Relevant packages include:

- React
- Vite
- Tailwind CSS
- wouter
- Framer Motion
- Radix UI
- React Three Fiber / Three.js
- Socket.IO client
- PayPal React SDK
- `@workspace/api-client-react`

## Errant Night Game

Path: `artifacts/end`

Relevant packages include:

- React
- Vite
- Tailwind CSS
- wouter
- Framer Motion
- Radix UI
- Socket.IO client
- PayPal React SDK
- React Query
- `@workspace/api-client-react`

The game imports media from `attached_assets` through the `@assets` Vite alias.

## API Server

Path: `artifacts/api-server`

Relevant packages include:

- Express
- Socket.IO
- Drizzle ORM
- PostgreSQL
- Zod
- bcryptjs
- jsonwebtoken
- helmet
- express-rate-limit
- pino
- PayPal/Stripe-related server integrations

Deployment target: Fly.

## Shared Packages

- `@workspace/api-client-react`
- `@workspace/api-spec`
- `@workspace/api-zod`
- `@workspace/db`

## Deployment

- Vercel for static frontend apps.
- Fly for API and Socket.IO backend.
- `https://engg.fly.dev` is the current public API/socket host.

## Payments And Analytics

- PayPal is used in frontend payment UI and server payment routes.
- Stripe-related packages/routes are present and should not be changed during
  repository organization work.
- Umami and Vercel Speed Insights packages are present.
