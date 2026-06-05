import { getGameUrl } from "@/lib/externalLinks";

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
  },
] as const satisfies readonly GameCatalogItem[];
