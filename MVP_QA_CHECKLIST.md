# MVP QA Checklist

## Website Checks

- [ ] Home page loads.
- [ ] Hub page loads.
- [ ] Shop page loads.
- [ ] Login/register pages load.
- [ ] Profile page loads for authenticated users.
- [ ] Existing SEO metadata still renders.
- [ ] Analytics scripts still load where expected.
- [ ] Navbar behavior is unchanged.

## Game Checks

- [ ] Game `/errant-night/` loads on the game domain.
- [ ] `/errant-night/join/ABC123` loads.
- [ ] `/errant-night/room/ABC123` loads.
- [ ] Room creation/join flow works.
- [ ] Socket.IO connects to the Fly API.
- [ ] Game media loads.
- [ ] Lobby music path works.
- [ ] PayPal UI still initializes with the public client ID.

## Deployment Checks

- [ ] Main project build command is `pnpm run build:landing`.
- [ ] Main project output directory is `dist`.
- [ ] Main build output does not contain `dist/end`.
- [ ] Standalone game project build command is `pnpm run build`.
- [ ] Standalone game project output directory is `dist/public`.
- [ ] Standalone game project env includes `BASE_PATH=/errant-night/`.
- [ ] Both projects use `pnpm install --frozen-lockfile`.

## Redirect Checks

- [ ] Main `/hub` Errant Night card opens `/errant-night`.
- [ ] Main `/end` redirects to `/errant-night`.
- [ ] Main `/end/join/ABC123?x=1#frag` opens
      `/errant-night/join/ABC123?x=1`.
- [ ] Website does not serve old bundled game files from `/end`.
- [ ] Website `/errant-night/*` proxies to `https://errant-night.vercel.app`.

## API And Socket Checks

- [ ] `/api/*` reaches `https://engg.fly.dev/api/*`.
- [ ] `/socket.io/*` reaches `https://engg.fly.dev/socket.io/*`.
- [ ] Main website auth/profile/shop API calls still work.
- [ ] Game auth/profile/stats/game API calls still work.
