# Testing

## Automated Validation

Run these from the repository root:

```powershell
pnpm run typecheck
pnpm run build:landing
pnpm run build:game
```

Useful focused checks:

```powershell
pnpm --filter @workspace/every-nation run typecheck
pnpm --filter @workspace/end run typecheck
```

## Build Output Checks

After `pnpm run build:landing`:

- `dist/index.html` exists.
- `dist/end` does not exist.

After `pnpm run build:game`:

- `artifacts/end/dist/public/index.html` exists.
- `artifacts/end/dist/public/assets` exists.
- Game metadata points to the game domain/root paths, not `/end`.

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

- `/hub` Errant Night opens `https://end.engg.online/`.
- `/end` opens `https://end.engg.online/`.
- `/end/join/ABC123?x=1#frag` opens
  `https://end.engg.online/join/ABC123?x=1#frag`.

## Manual Game Checks

Run the game preview:

```powershell
$env:PORT="4174"; pnpm --filter @workspace/end run serve
```

Check game routes at root:

- `/`
- `/join/ABC123`
- `/room/ABC123`

For deployed game checks, use the game domain:

- `https://end.engg.online/`
- `https://end.engg.online/join/ABC123`
- `https://end.engg.online/room/ABC123`

## API And Socket Checks

For deployed Vercel projects, confirm:

- `/api/*` routes reach `https://engg.fly.dev/api/*`.
- `/socket.io/*` routes reach `https://engg.fly.dev/socket.io/*`.
- Client env `VITE_API_URL` is set to `https://engg.fly.dev`.

Socket.IO should use path `/socket.io`.
