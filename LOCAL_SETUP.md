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

Errant Night is no longer part of this repository. Run it from the standalone
repo:

```powershell
cd C:\projects\errant-night
pnpm install
pnpm run dev
```

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
```

## Builds

Build the main website:

```powershell
pnpm run build:landing
```

Expected outputs:

- Website: `dist`
