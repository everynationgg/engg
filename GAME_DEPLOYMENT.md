# Game Deployment

Each game gets its own Vercel project under the Everynation team. The website
proxies public paths to those Vercel origins.

## Standard Vercel Settings

For Vite games:

- Root Directory: `.`
- Framework Preset: `Other`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build`
- Output Directory: `dist/public`

## Standard Environment Variables

```env
BASE_PATH=/<game-slug>/
VITE_API_URL=https://engg.fly.dev
VITE_API_BASE_URL=https://engg.fly.dev/api
VITE_PAYPAL_CLIENT_ID=<public PayPal client id if used>
```

Only expose public client-safe values through `VITE_*`. Keep secrets out of the
game repo and Vercel client environment.

## Errant Night

- Repo: `everynationgg/errant-night`
- Public website path: `/errant-night`
- Vercel origin:
  `https://errant-night-yogs-projects-cee6471c.vercel.app`
- Base path: `/errant-night/`
- Legacy website redirect: `/end` -> `/errant-night`

## Deployment Protection

The Vercel origin used by the website proxy must be publicly reachable. If a
preview deployment is protected by Vercel Authentication, do not use that
preview URL as the website proxy target.

## Production Verification

After deployment, verify:

- `/<game-slug>`
- `/<game-slug>/`
- `/<game-slug>/join/ABC123`
- `/<game-slug>/room/ABC123`
- `/<game-slug>/assets/<known-asset>`
- `/socket.io/?EIO=4&transport=polling`
