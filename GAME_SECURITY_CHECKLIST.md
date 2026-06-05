# Game Security Checklist

Use this checklist when adding or changing a game integration.

## Repositories

- Keep each game in its own GitHub repo.
- Do not copy website auth, database, or server code into a game repo unless it
  is explicitly needed and reviewed.
- Do not commit build output, `.env`, `.vercel`, logs, or secrets.

## Environment Variables

- Store secrets only in server-side environments.
- Use `VITE_*` only for values that are safe in browser bundles.
- Confirm `VITE_PAYPAL_CLIENT_ID` is the public client ID, not a secret.
- Keep API targets pointed at trusted origins.

## Routing

- Do not expose private Vercel preview URLs through the website proxy.
- Confirm Vercel Authentication does not block the origin used by production
  rewrites.
- Keep `/api/*` and `/socket.io/*` routed to the Fly API unless a later
  decision changes that.
- Preserve legacy redirects to avoid broken public links.

## Browser Behavior

- Avoid putting tokens in query strings.
- Avoid storing secrets in local storage.
- Confirm third-party scripts are required before adding them.
- Check console output for unexpected auth, payment, or socket errors.

## Supply Chain

- Use `pnpm install --frozen-lockfile` in Vercel.
- Avoid new dependencies unless they are necessary.
- Review any game dependency that touches auth, payments, sockets, storage, or
  runtime code execution.
