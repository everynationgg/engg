import { getGameUrl } from "@/lib/externalLinks";

export type GameStatus = "online" | "offline" | "coming-soon";

export type GamePortalEffect =
  | "signal-breach"
  | "nether-rune"
  | "orbital-command"
  | "default";

export type GameThemeParticle =
  | "scanline"
  | "role-card"
  | "moon"
  | "rune"
  | "orbit";

export type GameTheme = {
  accent: string;
  accentSoft: string;
  backgroundBase: string;
  backgroundImage: string;
  previewImage: string;
  portalEffect: GamePortalEffect;
  particles: readonly GameThemeParticle[];
};

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
  theme?: GameTheme;
  androidApkUrl?: string;
};

export const gameCatalog = [
  {
    title: "Errant Night",
    slug: "errant-night",
    subtitle: "Sci-Fi Social Deduction",
    description:
      "Crew vs. Alien aboard a failing deep-space vessel. Investigate roles, survive the blackout, and vote out the impostor before the ship falls.",
    image: "/ERRANT.png",
    href: getGameUrl(),
    status: "online",
    legacyPaths: ["/end"],
    androidApkUrl: "https://github.com/everynationgg/engg/releases/download/v1.0.0-beta/ErrantNight-release.apk",
    theme: {
      accent: "#22d3ee",
      accentSoft: "rgba(34, 211, 238, 0.18)",
      backgroundBase: "#010713",
      backgroundImage: "/images/hub/errant-night.webp",
      previewImage: "/ERRANT.png",
      portalEffect: "signal-breach",
      particles: ["scanline", "role-card"],
    },
  },
  {
    title: "Engraved Nether",
    slug: "engraved-nether",
    subtitle: "Tactical Card Battles",
    description:
      "Build your deck, control the grid, and outmaneuver rivals in fast-paced tactical card duels set in ancient subterranean ruins.",
    image: "/hub_engraved.webp",
    href: "https://triple-triad-theta.vercel.app",
    status: "online",
    externalOrigin: "https://triple-triad-theta.vercel.app",
    theme: {
      accent: "#d946ef",
      accentSoft: "rgba(217, 70, 239, 0.18)",
      backgroundBase: "#050207",
      backgroundImage: "/images/hub/engraved-nether-ruins.webp",
      previewImage: "/hub_engraved.webp",
      portalEffect: "nether-rune",
      particles: ["rune"],
    },
  },
  {
    title: "Epsilon Nine",
    slug: "epsilon-nine",
    subtitle: "Cooperative Station Defense",
    description:
      "Coordinate the defense of Epsilon Nine station with your squad. Manage power routing and turret batteries against incoming waves.",
    image: "/hub_epsilon.webp",
    href: "",
    status: "coming-soon",
    theme: {
      accent: "#f59e0b",
      accentSoft: "rgba(245, 158, 11, 0.18)",
      backgroundBase: "#070502",
      backgroundImage: "/images/hub/epsilon.webp",
      previewImage: "/hub_epsilon.webp",
      portalEffect: "orbital-command",
      particles: ["moon", "orbit"],
    },
  },
] as const satisfies readonly GameCatalogItem[];
