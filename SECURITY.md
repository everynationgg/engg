# Security

## Environment Variables

Do not commit secrets.

Use `.env.example` files for names and placeholder values only:

- `artifacts/every-nation/.env.example`
- `artifacts/end/.env.example`

Vite variables prefixed with `VITE_` are exposed to browser clients. They must
only contain public configuration, such as public API URLs or public PayPal
client IDs.

Backend secrets belong in Fly secrets or the relevant provider dashboard, not in
the repository.

## API And Socket Routing

Current public API target:

```text
https://engg.fly.dev
```

The shared root `vercel.json` rewrites:

- `/api/*` to `https://engg.fly.dev/api/*`
- `/socket.io/*` to `https://engg.fly.dev/socket.io/*`

Do not remove these rewrites until both Vercel projects and clients have another
confirmed API/socket routing strategy.

## PayPal And Payment Safety

Frontend apps use `VITE_PAYPAL_CLIENT_ID`, which is public.

PayPal secrets and provider credentials must stay on the API server or provider
side. Do not add secret payment credentials to Vite env files or static app
configuration.

## pnpm Supply Chain Policy

`pnpm-workspace.yaml` sets:

```yaml
minimumReleaseAge: 1440
```

This means newly published npm package versions must be at least one day old
before install. Keep this enabled unless there is an explicit, reviewed security
reason to add a temporary allowlist entry.

The workspace also uses `onlyBuiltDependencies` and platform overrides. Avoid
changing those policies during unrelated feature or docs work.

## Repository Hygiene

- Keep generated build outputs out of commits unless they are intentionally
  tracked already.
- Do not stage unrelated dirty files.
- Before deleting files, search for references across the whole repo.
- Treat `attached_assets` as product media; do not prune it until the game
  extraction audit is complete.
