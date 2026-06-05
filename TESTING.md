# Testing

## Automated Validation

Run these from the repository root:

```powershell
pnpm run typecheck
pnpm run build:landing
```

Useful focused checks:

```powershell
pnpm --filter @workspace/every-nation run typecheck
```

## Build Output Checks

After `pnpm run build:landing`:

- `dist/index.html` exists.
- No bundled game output is produced in `dist`.

## Manual Website Checks

Run the website preview:

```powershell
$env:PORT="4173"; pnpm --filter @workspace/every-nation run serve
```

Check:

- `/`
- `/hub`
- `/shop`
- `/login`
- `/profile`
- `/verify`

Website split checks:

- `/hub` Errant Night opens `/errant-night`.
- `/end` redirects to `/errant-night`.
- `/end/join/ABC123?x=1#frag` opens
  `/errant-night/join/ABC123?x=1`.
- `/errant-night/join/ABC123` serves the standalone game through the website
  proxy after Vercel deploy.

## Manual Game Checks

Run the game from the standalone repo:

```powershell
cd C:\projects\errant-night
pnpm run serve
```

Check game routes under the path base:

- `/errant-night/`
- `/errant-night/join/ABC123`
- `/errant-night/room/ABC123`

For deployed standalone game checks, use the public game origin:

- `https://errant-night-yogs-projects-cee6471c.vercel.app/errant-night/`
- `https://errant-night-yogs-projects-cee6471c.vercel.app/errant-night/join/ABC123`
- `https://errant-night-yogs-projects-cee6471c.vercel.app/errant-night/room/ABC123`

## API And Socket Checks

For deployed Vercel projects, confirm:

- `/api/*` routes reach `https://engg.fly.dev/api/*`.
- `/socket.io/*` routes reach `https://engg.fly.dev/socket.io/*`.
- Client env `VITE_API_URL` is set to `https://engg.fly.dev`.

Socket.IO should use path `/socket.io`.
