# ── Stage 1: Install & build ─────────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copy workspace config first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./

COPY artifacts/api-server/ artifacts/api-server/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

# ── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

RUN apk add --no-cache tini

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./


# Only copy the api-server package.json for production install
COPY artifacts/api-server/package.json artifacts/api-server/package.json

RUN pnpm install --frozen-lockfile --prod


# Copy built output from build stage
COPY --from=build /app/artifacts/api-server/dist artifacts/api-server/dist

WORKDIR /app/artifacts/api-server

ENV NODE_ENV=production
ENV PORT=10000
ENV TINI_SUBREAPER=1

EXPOSE 10000

# Create entrypoint script that detects the correct entry point
RUN printf '#!/bin/sh\nset -e\n\nif [ -f "dist/index.mjs" ]; then\n  exec node --enable-source-maps ./dist/index.mjs\nelif [ -f "dist/index.js" ]; then\n  exec node --enable-source-maps ./dist/index.js\nelif [ -f "index.mjs" ]; then\n  exec node --enable-source-maps ./index.mjs\nelif [ -f "index.js" ]; then\n  exec node ./index.js\nelse\n  echo "ERROR: No entry point found (dist/index.mjs, dist/index.js, index.mjs, or index.js)"\n  exit 1\nfi\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Use tini as init to handle signals properly
ENTRYPOINT ["/sbin/tini", "--", "/app/entrypoint.sh"]