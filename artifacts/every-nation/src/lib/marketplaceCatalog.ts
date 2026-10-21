export type AppPlatform = "android" | "web" | "desktop" | "ios-pwa";

export type AppCategory = "all" | "games" | "mobile" | "tools";

export type ReleaseAvailability = "apk-available" | "web-live" | "coming-soon";

export interface AppRelease {
  version: string;
  releaseDate: string;
  apkSize: string;
  availability: ReleaseAvailability;
  downloadUrl?: string;
  demoUrl?: string;
  minAndroidVersion?: string;
  whatsNew: string[];
}

export interface MarketplaceApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  bannerImage: string;
  category: AppCategory;
  platforms: AppPlatform[];
  badge: "Featured" | "Official Release" | "Beta APK" | "Web App";
  badgeColor: string;
  currentRelease: AppRelease;
  features: string[];
  techStack: string[];
  highlights: string[];
}

export const MARKETPLACE_APPS: MarketplaceApp[] = [
  {
    id: "errant-night-mobile",
    name: "Errant Night",
    tagline: "Multiplayer Sci-Fi Social Deduction — Crew vs. Alien",
    description:
      "Every Nation's signature multiplayer social deduction game for Android and Web. Step aboard a failing deep-space vessel, use your role abilities during the blackout phase, debate with the crew, and vote out the Alien before the ship falls.",
    icon: "/ERRANT.png",
    bannerImage: "/images/hub/errant-night.webp",
    category: "games",
    platforms: ["android", "web"],
    badge: "Beta APK",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    currentRelease: {
      version: "v1.0.0-beta",
      releaseDate: "October 2026",
      apkSize: "100.8 MB",
      availability: "apk-available",
      downloadUrl: "https://github.com/everynationgg/engg/releases/download/v1.0.0-beta/ErrantNight-release.apk",
      demoUrl: "/errant-night",
      minAndroidVersion: "Android 8.0 (Oreo) or higher",
      whatsNew: [
        "Native Android package powered by Capacitor 7 & Android SDK 35",
        "Complete role reveal and airlock ejection animations",
        "Low-latency real-time multiplayer lobbies via Socket.IO",
        "Touch-optimized ship controls, safe-area layout, and solo practice bots",
      ],
    },
    features: [
      "Real-time multiplayer lobbies with private room codes",
      "12+ unique Crew, Alien, and Chaotic roles with night-phase abilities",
      "Live ship system sabotage, repair tasks, and emergency voting",
      "Solo practice mode with crewmate bots",
    ],
    techStack: ["React 19", "Capacitor 7", "Android SDK 35", "Socket.IO", "TypeScript", "Tailwind CSS"],
    highlights: ["60 FPS Mobile Target", "Cross-Play Web & Android", "Real-Time Lobbies"],
  },
  {
    id: "engraved-nether-companion",
    name: "Engraved Nether",
    tagline: "Fast-Paced Tactical Grid Card Battles",
    description:
      "Build a custom deck of elemental rune cards and challenge players or solo guardians on a 3x3 tactical grid. Capture adjacent cards through directional power comparisons, chain elemental combos, and climb the leaderboard.",
    icon: "/hub_engraved.webp",
    bannerImage: "/images/hub/engraved-nether-ruins.webp",
    category: "games",
    platforms: ["web", "android"],
    badge: "Official Release",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
    currentRelease: {
      version: "v1.1.2",
      releaseDate: "August 2026",
      apkSize: "Web App (Android APK Soon)",
      availability: "web-live",
      demoUrl: "https://triple-triad-theta.vercel.app",
      minAndroidVersion: "Playable in any mobile or desktop browser",
      whatsNew: [
        "12 new Nether glyph cards and relic synergies",
        "Smooth card placement physics and tactile sound design",
        "Ranked match progression and custom deck loadouts",
      ],
    },
    features: [
      "Strategic 3x3 grid card battles with elemental modifiers",
      "Custom deck builder with card rarity tiers",
      "Instant browser play on desktop and mobile devices",
    ],
    techStack: ["React", "Framer Motion", "Tailwind CSS", "Canvas FX"],
    highlights: ["Instant Web Play", "Deck Builder", "Tactical Grid Combat"],
  },
  {
    id: "visien-client-companion",
    name: "Project Scoper & Client Portal",
    tagline: "Interactive Software Scoping, Roadmaps & Build Tracker",
    description:
      "Our studio's interactive project planning and client portal. Map out web or mobile application requirements, generate technical specifications, estimate delivery milestones, and follow active development progress in real time.",
    icon: "/logo.png",
    bannerImage: "/images/home/home-dual-studio-master.jpg",
    category: "tools",
    platforms: ["web", "android"],
    badge: "Featured",
    badgeColor: "bg-[#7c3aed]/20 text-[#7c3aed] border-[#7c3aed]/30",
    currentRelease: {
      version: "v2.1.0",
      releaseDate: "October 2026",
      apkSize: "Web Portal",
      availability: "web-live",
      demoUrl: "https://visien-gray.vercel.app/",
      minAndroidVersion: "Web application (Desktop & Mobile browsers)",
      whatsNew: [
        "Guided project scoping across product goals, UX flows, and architecture",
        "Session lookup by project reference code",
        "Exportable technical specification & milestone summary",
        "Live milestone tracking for active studio clients",
      ],
    },
    features: [
      "Step-by-step interactive project scoping workflow",
      "Clear breakdown of scope, features, tech stack, and timeline",
      "Direct milestone review and client sign-off",
      "Responsive across desktop and mobile browsers",
    ],
    techStack: ["React 19", "TypeScript", "Supabase", "Tailwind CSS"],
    highlights: ["Project Blueprints", "Live Build Tracker", "Client Portal"],
  },
  {
    id: "engg-deck-authenticator",
    name: "Every Nation Player Hub",
    tagline: "Account Profile, Match History, Friends & Daily Rewards",
    description:
      "Your central Every Nation player dashboard. Manage your studio profile, track match statistics across Errant Night, connect with friends, claim daily login credits, and launch directly into live game lobbies.",
    icon: "/logo.png",
    bannerImage: "/images/hub/epsilon.webp",
    category: "tools",
    platforms: ["web", "android"],
    badge: "Web App",
    badgeColor: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    currentRelease: {
      version: "v1.0.8",
      releaseDate: "September 2026",
      apkSize: "Web App (Android Companion Soon)",
      availability: "web-live",
      demoUrl: "/hub",
      minAndroidVersion: "Web application (Android companion in development)",
      whatsNew: [
        "Unified account sign-in across the studio website and Errant Night",
        "Real-time friends list and direct messaging",
        "Daily login credit rewards and match history tracking",
        "Instant one-click launch into live games",
      ],
    },
    features: [
      "Single sign-on identity across Every Nation games",
      "Real-time friends list and direct chat",
      "Credit balance, daily rewards, and achievement tracking",
      "Direct game launcher for Errant Night and Engraved Nether",
    ],
    techStack: ["React 19", "Drizzle ORM", "Socket.IO", "Tailwind CSS"],
    highlights: ["Unified Profile", "Friends & Chat", "Daily Rewards"],
  },
  {
    id: "omniflow-pos-mobile",
    name: "OmniFlow Operations & POS Suite",
    tagline: "Studio Showcase: Custom Inventory, Orders & Retail POS",
    description:
      "A live architecture showcase of the custom business software Every Nation builds for retail and service clients. Demonstrates real-time inventory scanning, appointment booking, order routing, and receipt generation.",
    icon: "/logo.png",
    bannerImage: "/images/home/home-dual-studio-master.jpg",
    category: "mobile",
    platforms: ["web", "android"],
    badge: "Web App",
    badgeColor: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    currentRelease: {
      version: "v2.0.1-demo",
      releaseDate: "October 2026",
      apkSize: "Client Showcase",
      availability: "coming-soon",
      demoUrl: "https://visien-gray.vercel.app/",
      minAndroidVersion: "Custom client deployment",
      whatsNew: [
        "Barcode & QR inventory lookup workflow",
        "Automated customer order status notifications",
        "Offline-first local caching with PostgreSQL cloud sync",
      ],
    },
    features: [
      "Tailored for retail shops, service centers, clinics, and studios",
      "Self-service customer order status portal",
      "Custom branding, role permissions, and reporting exports",
    ],
    techStack: ["React 19", "PostgreSQL", "Zod", "Tailwind CSS"],
    highlights: ["Custom Software Showcase", "Retail & Service Ready", "Fast & Reliable"],
  },
];
export const ERRAT_NIGHT_APK_RELEASE = MARKETPLACE_APPS[0].currentRelease;
