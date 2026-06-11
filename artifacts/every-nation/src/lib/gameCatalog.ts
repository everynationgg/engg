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
};

export const gameCatalog = [
  {
    title: "Errant Night",
    slug: "errant-night",
    subtitle: "Neural Defense Protocol",
    description:
      "A high-stakes network defense simulator. Trace the anomaly through the digital ether before system-wide compromise.",
    image: "/ERRANT.png",
    href: getGameUrl(),
    status: "online",
    legacyPaths: ["/end"],
    externalOrigin: "https://errant-night-yogs-projects-cee6471c.vercel.app",
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
    subtitle: "Sub-Surface Extraction",
    description:
      "Descend into the encrypted depths of the Nether. Harvest exotic matter while evading the ancient sentinels of the deep.",
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
    subtitle: "Orbital Command",
    description:
      "Coordinate the defense of the Epsilon Nine station. Manage energy grids and orbital batteries against incoming threats.",
    image: "/hub_epsilon.webp",
    href: "",
    status: "offline",
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
