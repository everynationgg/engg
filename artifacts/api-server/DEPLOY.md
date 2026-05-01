# Fly.io Deployment Guide

## Prerequisites

- [flyctl CLI](https://fly.io/docs/flyctl/install/) installed
- Fly.io account authenticated (`fly auth login`)
- External Redis and PostgreSQL instances provisioned

## Quick Start

### 1. Launch the app (first time only)

```bash
# From the repository root
fly launch --no-deploy
```

When prompted, accept the detected `fly.toml` configuration. Update the app
name in `fly.toml` if you chose a different name during launch.

### 2. Set secrets

```bash
fly secrets set \
  JWT_SECRET="your-jwt-secret" \
  REDIS_URL="redis://user:password@host:port" \
  DATABASE_URL="postgresql://user:password@host:port/dbname" \
  OPENAI_API_KEY="sk-proj-..." \
  NODE_ENV="production"
```

### 3. Deploy

From the **repository root**, run the following command (using the workspace-level script):

```bash
pnpm run deploy:api
```

Alternatively, run fly directly:

```bash
fly deploy -c artifacts/api-server/fly.toml --dockerfile artifacts/api-server/Dockerfile
```

On first start the server automatically runs a schema migration (CREATE TABLE
IF NOT EXISTS) to create the `game_chats` and `session_snapshots` tables.
No manual `drizzle-kit push` step is required for these core tables.

For a full database setup (users, achievements, friends, etc.) run
`drizzle-kit push` once after the database is provisioned:

```bash
cd lib/db
DATABASE_URL="<your-db-url>" pnpm run push
```

## Configuration Summary

| Setting        | Value                |
| -------------- | -------------------- |
| Region         | `sin` (Singapore)    |
| Internal port  | `10000`              |
| Health check   | `GET /health`        |
| Force HTTPS    | `true`               |
| Min machines   | `1`                  |
| VM memory      | `512 MB`             |

## Environment Variables

| Variable        | Description                            | Source       |
| --------------- | -------------------------------------- | ------------ |
| `PORT`          | Server listen port (default `10000`)   | `fly.toml`   |
| `NODE_ENV`      | Runtime environment                    | Fly secret   |
| `JWT_SECRET`    | JWT signing key                        | Fly secret   |
| `REDIS_URL`     | Redis connection string                | Fly secret   |
| `DATABASE_URL`  | PostgreSQL connection string           | Fly secret   |
| `OPENAI_API_KEY`| OpenAI API key for TTS (`/api/tts`)    | Fly secret   |
| `CORS_ORIGIN`   | Allowed CORS origin (optional)         | Fly secret   |

## Server Configuration

The server binds to `0.0.0.0` on the configured port:

```ts
const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, "0.0.0.0");
```

## WebSocket / Socket.IO

- The Fly.io HTTP service handles WebSocket upgrade automatically over
  ports 80/443.
- The server uses `@socket.io/redis-adapter` for multi-instance pub/sub,
  so no sticky sessions are required.
- Fly.io's Anycast routing is compatible with this setup.

## Useful Commands

```bash
# View logs
fly logs

# SSH into a running machine
fly ssh console

# Check app status
fly status

# Scale machines
fly scale count 2

# View secrets
fly secrets list
```
