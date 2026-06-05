# Game Registry

The source of truth for Hub game cards is:

```text
artifacts/every-nation/src/lib/gameCatalog.ts
```

## Catalog Shape

```ts
export type GameStatus = "online" | "offline" | "coming-soon";

export type GameCatalogItem = {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  status: GameStatus;
  legacyPaths?: string[];
  externalOrigin?: string;
};
```

## Current Entries

- Errant Night
  - Slug: `errant-night`
  - Public path: `/errant-night`
  - Status: `online`
  - Legacy path: `/end`
- Engraved Nether
  - Slug: `engraved-nether`
  - Current href: `https://triple-triad-theta.vercel.app`
  - Status: `online`
  - Next step: move behind the website path proxy when it gets a standalone
    Everynation Vercel project.
- Epsilon Nine
  - Slug: `epsilon-nine`
  - Status: `offline`
  - Next step: keep locked until a project exists.

## Slug Rules

- Use lowercase kebab-case.
- Keep slugs stable once public.
- Avoid vague short slugs such as `/end`.
- Do not use spaces, underscores, punctuation, or special characters.
- When a public slug changes, preserve the old path with a server-level
  redirect.

## Catalog Rules

- `href` is the link used by the Hub card.
- Online internal games should link to the website path, such as
  `/errant-night`.
- External origins are recorded for deployment context, not shown to users.
- Offline games can keep an empty `href` and should not navigate.
- Keep card copy and imagery in the catalog unless the Hub UI needs a broader
  design change.
