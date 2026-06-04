# Website Dependency Audit

Date: 2026-06-04

## App

Path: `artifacts/every-nation`

Package: `@workspace/every-nation`

## Runtime/Build

- Vite
- React
- TypeScript
- Tailwind CSS
- wouter

## Important Dependencies

From `artifacts/every-nation/package.json`:

- `@paypal/react-paypal-js`
- Socket.IO client
- React Three Fiber / Three.js
- Stripe JS
- Radix UI packages
- Framer Motion
- Lucide React
- React Icons
- React Hook Form
- Recharts
- Zod
- `@workspace/api-client-react`

## Website Responsibilities

The website should keep:

- Home/landing website routes.
- Hub.
- Shop UI.
- Auth/profile UI.
- Website navigation and layout.
- Same-origin game link through `/errant-night`.
- `/end` handoff behavior through deployment-level redirects.

## Game References Remaining In Website

Intentional:

- Hub Errant Night card points to `getGameUrl()`.
- `/end` and `/end/*` redirect to `/errant-night` through Vercel.
- `/errant-night` proxies to `https://errant-night.vercel.app`.
- Sitemap no longer advertises old `/end` as a website-owned route.

Before deleting game code from this repo, re-run:

```powershell
rg "/end|/errant-night|Errant Night|artifacts/end|@workspace/end"
```

## What Can Remain In Website Repo

- Website app.
- API server, if the repo remains a combined website/API repo for a while.
- Shared API client and database libs, if still needed by website/API.
- Website-specific assets and docs.
- Redirect/link docs for Errant Night.

## What Should Leave With The Game

- `artifacts/end`
- Game-only public assets.
- Game-only role media from `attached_assets`.
- Game-specific SEO/manifest files.
- Game-specific Vercel env examples and deployment docs.

## Cleanup Risks

- Removing shared API client code still used by website auth/shop/profile flows.
- Removing socket client dependencies still used by website messaging.
- Removing PayPal dependencies still used by website shop.
- Accidentally staging unrelated Navbar changes.
