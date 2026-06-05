# Game Proxy Routing

The website exposes games through paths on `www.engg.online`. Vercel rewrites
send those paths to each standalone game origin.

## Routing Standard

For each game slug:

- `/<game-slug>` should be explicitly handled.
- `/<game-slug>/` should be explicitly handled.
- `/<game-slug>/:path*` should proxy nested SPA routes.
- `/<game-slug>/assets/:path*` should proxy static game assets.
- Old public slugs should redirect before rewrites.

## Errant Night Current Routes

Legacy redirects:

```json
{
  "source": "/end",
  "destination": "/errant-night",
  "permanent": false
}
```

```json
{
  "source": "/end/:path*",
  "destination": "/errant-night/:path*",
  "permanent": false
}
```

Proxy rewrites:

```json
{
  "source": "/errant-night/assets/:path*",
  "destination": "https://errant-night-yogs-projects-cee6471c.vercel.app/assets/:path*"
}
```

```json
{
  "source": "/errant-night/:path*",
  "destination": "https://errant-night-yogs-projects-cee6471c.vercel.app/errant-night/:path*"
}
```

The root `vercel.json` also explicitly handles `/errant-night` and
`/errant-night/` before the wildcard route.

## API And Socket.IO

Keep API and Socket.IO rewrites separate from game rewrites:

- `/api/:path*` -> `https://engg.fly.dev/api/:path*`
- `/socket.io/*` -> `https://engg.fly.dev/socket.io/*`

The website SPA fallback must exclude `api`, `socket.io`, and active game slugs.

## Local Testing Note

Local Vite preview does not fully simulate Vercel external rewrites. Use a
deployed preview or `vercel dev` when proxy behavior itself is under test.
