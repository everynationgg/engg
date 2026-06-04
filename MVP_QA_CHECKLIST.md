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

- [ ] Game root `/` loads on the game domain.
- [ ] `/join/ABC123` loads at root.
- [ ] `/room/ABC123` loads at root.
- [ ] Room creation/join flow works.
- [ ] Socket.IO connects to the Fly API.
- [ ] Game media loads.
- [ ] Lobby music path works.
- [ ] PayPal UI still initializes with the public client ID.

## Deployment Checks

- [ ] Main project build command is `pnpm run build:landing`.
- [ ] Main project output directory is `dist`.
- [ ] Main build output does not contain `dist/end`.
- [ ] Game project build command is `pnpm run build:game`.
- [ ] Game project output directory is `artifacts/end/dist/public`.
- [ ] Game project env includes `BASE_PATH=/`.
- [ ] Both projects use `pnpm install --frozen-lockfile`.

## Redirect Checks

- [ ] Main `/hub` Errant Night card opens `https://end.engg.online/`.
- [ ] Main `/end` opens `https://end.engg.online/`.
- [ ] Main `/end/join/ABC123?x=1#frag` opens
      `https://end.engg.online/join/ABC123?x=1#frag`.
- [ ] Website does not serve old bundled game files from `/end`.

## API And Socket Checks

- [ ] `/api/*` reaches `https://engg.fly.dev/api/*`.
- [ ] `/socket.io/*` reaches `https://engg.fly.dev/socket.io/*`.
- [ ] Main website auth/profile/shop API calls still work.
- [ ] Game auth/profile/stats/game API calls still work.
