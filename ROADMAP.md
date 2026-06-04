# Roadmap

## Phase 1: Documentation Cleanup

Status: complete.

Goals:

- Add a clear root documentation layer.
- Record deployment and extraction decisions.
- Document workspace dependencies and extraction risks.
- Keep all changes documentation-only.

## Phase 2: Standalone Game Repo Extraction

Status: complete.

Goals:

- Create a new repository for Errant Night.
- Move or copy `artifacts/end` into the new repo.
- Copy only required game assets from `attached_assets`.
- Resolve workspace dependencies:
  - copy minimal API client code, or
  - generate a standalone client from the API spec, or
  - publish/create a clean shared package if that becomes justified.
- Preserve game behavior.

## Phase 3: Deploy Game Repo To Vercel

Status: preview/proxy path verified.

Goals:

- Link the standalone game repo to its own Vercel project.
- Build with `pnpm run build`.
- Serve at `/errant-night/` with `BASE_PATH=/errant-night/`.
- Verify `/errant-night/`, `/errant-night/join/ABC123`, and
  `/errant-night/room/ABC123`.
- Verify API and Socket.IO still reach `https://engg.fly.dev`.

## Phase 4: Remove Game From Website Repo

Goals:

- Remove game code from the website repo only after standalone deployment is
  verified.
- Keep website `/errant-night` proxy.
- Keep `/end` as a server-level redirect to `/errant-night`.
- Remove game-only dependencies from the website repo.

## Phase 5: Cleanup Dependencies And Docs

Goals:

- Remove dead workspace package references.
- Remove unused assets from the website repo.
- Update docs in both repositories.
- Re-run full validation.
- Confirm production routes after deploy.
