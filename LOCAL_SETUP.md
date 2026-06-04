# Local Setup

## Prerequisites

- Node.js compatible with the workspace lockfile.
- pnpm.
- Access to any required environment values for the flows you are testing.

The root `preinstall` script enforces pnpm. Do not use npm or yarn for installs.

## Install

From the repository root:

```powershell
pnpm install
```

## Environment Files

Use the example files as starting points:

- `artifacts/every-nation/.env.example`
- `artifacts/end/.env.example`

Do not commit real secrets. Vite `VITE_*` values are exposed to the browser and
must be treated as public configuration.

## Run The Main Website

```powershell
pnpm --filter @workspace/every-nation run dev
```

The default Vite dev port is controlled by the app's Vite config. If a port is
busy, set `PORT` before running the command.

Example:

```powershell
$env:PORT="5173"; pnpm --filter @workspace/every-nation run dev
```

## Run The Game

Use a different port from the website:

```powershell
$env:PORT="5174"; pnpm --filter @workspace/end run dev
```

For local API proxying, the game Vite config proxies `/api` and `/socket.io` to
`API_SERVER_PORT` or `8080` by default.

## Run The API Server

```powershell
pnpm --filter @workspace/api-server run dev
```

The API server requires backend secrets such as database, JWT, and provider
credentials. See [artifacts/api-server/DEPLOY.md](./artifacts/api-server/DEPLOY.md)
for production-oriented configuration.

## Typecheck

```powershell
pnpm run typecheck
pnpm --filter @workspace/every-nation run typecheck
pnpm --filter @workspace/end run typecheck
```

## Builds

Build the main website:

```powershell
pnpm run build:landing
```

Build the game:

```powershell
$env:BASE_PATH="/"; pnpm run build:game
```

Expected outputs:

- Website: `dist`
- Game: `artifacts/end/dist/public`
