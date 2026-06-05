# Game Onboarding

Use this checklist when adding a new ENGG game.

## 1. Name And Slug

- Choose the final public title.
- Choose a stable lowercase kebab-case slug.
- Confirm the public URL will be `https://www.engg.online/<game-slug>`.
- Avoid temporary slugs in production.

## 2. Standalone Repo

- Create a local folder such as `C:\projects\<game-slug>`.
- Create a GitHub repo under `everynationgg/<game-slug>`.
- Keep the game source, assets, tests, and docs in that repo.
- Do not put game runtime code into this website repo.

## 3. Build And Base Path

- Configure the game build command.
- Configure output directory.
- Set `BASE_PATH=/<game-slug>/`.
- Verify nested routes refresh at the game origin.

## 4. Vercel Project

- Create the Vercel project under the Everynation team.
- Use the game repo as the source.
- Keep the public user-facing URL on `www.engg.online/<game-slug>`.
- Do not attach a public game subdomain unless approved.

## 5. Website Integration

- Add the game to `artifacts/every-nation/src/lib/gameCatalog.ts`.
- Add proxy rewrites in root `vercel.json`.
- Add legacy redirects only when an old public path exists.
- Verify the Hub card links to the website path, not the Vercel origin.

## 6. QA

- Run website validation.
- Run game validation in the game repo.
- Verify direct game origin routes.
- Verify proxied website routes.
- Verify API and Socket.IO behavior.
