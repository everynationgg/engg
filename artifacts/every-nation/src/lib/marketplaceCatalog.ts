export type AppPlatform = "android" | "web" | "desktop" | "ios-pwa";

export type AppCategory = "all" | "mobile" | "games" | "ai" | "tools";

export interface AppRelease {
  version: string;
  releaseDate: string;
  apkSize: string;
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
  badge: "Featured" | "Official Release" | "Beta APK" | "Showcase Demo";
  badgeColor: string;
  currentRelease: AppRelease;
  features: string[];
  techStack: string[];
  highlights: string[];
}

export const MARKETPLACE_APPS: MarketplaceApp[] = [
  {
    id: "errant-night-mobile",
    name: "Errant Night Mobile",
    tagline: "Neural Defense & Network Infiltration Protocol",
    description:
      "ENGG's signature high-stakes tactical social deduction and digital network defense simulator, engineered for mobile. Trace anomalies through cyber nodes, isolate infected units, and coordinate real-time defense with your squad.",
    icon: "/ERRANT.png",
    bannerImage: "/images/hub/errant-night.webp",
    category: "games",
    platforms: ["android", "web"],
    badge: "Beta APK",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    currentRelease: {
      version: "v1.0.0-beta",
      releaseDate: "October 2026",
      apkSize: "101.8 MB",
      downloadUrl: "https://github.com/everynationgg/engg/releases/download/v1.0.0-beta/ErrantNight-debug.apk",
      demoUrl: "https://www.engg.online/errant-night",
      minAndroidVersion: "Android 8.0 (Oreo) or higher",
      whatsNew: [
        "Native Android container powered by Capacitor 7 & Android SDK 35",
        "Complete offline role reveal and eviction cinematic animations",
        "Low-latency real-time multiplayer room sync connected to engg.fly.dev",
        "Touch-optimized controls, safe-area layout, and responsive mobile HUD",
      ],
    },
    features: [
      "Real-time multiplayer lobbies powered by Socket.IO on Fly.io",
      "Dynamic procedural hacking terminal mini-games",
      "Instant push voice & text broadcast alerts",
      "Offline practice simulation mode with AI infiltrators",
    ],
    techStack: ["React 19", "Capacitor 7", "Android SDK 35", "Socket.IO", "TypeScript", "Tailwind CSS"],
    highlights: ["60 FPS Mobile Target", "101.8 MB Offline Cinematics", "Direct Multiplayer"],
  },
  {
    id: "visien-client-companion",
    name: "VISIEN Discovery Mobile",
    tagline: "Vision Inspired by Story and Idea",
    description:
      "Our AI-guided discovery and project-planning companion for business owners and creators. Brainstorm custom app concepts, scope architectural blueprints, calculate cost timelines, and track your ongoing software builds in real time.",
    icon: "/logo.png",
    bannerImage: "/images/home/home-dual-studio-master.jpg",
    category: "ai",
    platforms: ["android", "web"],
    badge: "Featured",
    badgeColor: "bg-[#7c3aed]/20 text-[#7c3aed] border-[#7c3aed]/30",
    currentRelease: {
      version: "v2.1.0",
      releaseDate: "October 2026",
      apkSize: "18.5 MB",
      downloadUrl: "/downloads/visien-mobile-v2.1.0.apk",
      demoUrl: "https://visien-gray.vercel.app/",
      minAndroidVersion: "Android 9.0 (Pie) or higher",
      whatsNew: [
        "Full interactive Enos AI conversational customer assistant",
        "One-tap session tracker by token or client code (e.g. 929-909)",
        "Instant export of technical architecture PDF blueprints",
        "Push notifications for project milestone transitions",
      ],
    },
    features: [
      "Enos AI interactive guide with live conversational advice",
      "Interactive Chapter progress through Concept, UX, Tech, and Budget",
      "Direct milestone updates and client feedback approvals",
      "Instant sync across web and mobile sessions",
    ],
    techStack: ["React 19", "Gemini 2.5 Flash", "Supabase", "Tailwind CSS", "Capacitor"],
    highlights: ["AI Guided", "Live Project Status", "Offline Session Cache"],
  },
  {
    id: "engg-deck-authenticator",
    name: "ENGG Portal Deck",
    tagline: "Studio Identity, Credit Vault & Unit Access Companion",
    description:
      "The official mobile companion for the Every Nation GG portal. Manage your player unit identity, redeem credits, access private game servers, verify device logins, and connect with your team allies on the go.",
    icon: "/logo.png",
    bannerImage: "/images/hub/epsilon.webp",
    category: "tools",
    platforms: ["android", "web"],
    badge: "Beta APK",
    badgeColor: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    currentRelease: {
      version: "v1.0.8-beta",
      releaseDate: "September 2026",
      apkSize: "22.1 MB",
      downloadUrl: "/downloads/engg-portal-deck-v1.0.8.apk",
      demoUrl: "/hub",
      minAndroidVersion: "Android 8.1 or higher",
      whatsNew: [
        "Biometric fingerprint / face unlock for rapid portal authorization",
        "Live ally status feed and encrypted push notifications",
        "Direct credit balance top-up via PayPal & Stripe sandbox",
        "Dark cyberpunk HUD interface with battery-saving OLED mode",
      ],
    },
    features: [
      "Fast cryptographic QR code login for desktop sessions",
      "Encrypted cloud backup for unit credentials",
      "Interactive credit transaction ledger and redemption codes",
      "Low battery consumption background listener",
    ],
    techStack: ["React 19", "Drizzle ORM", "Web Cryptography API", "Tailwind CSS"],
    highlights: ["Biometric Auth", "Instant Device Sync", "22 MB APK"],
  },
  {
    id: "engraved-nether-companion",
    name: "Engraved Nether: Tactical Deck",
    tagline: "Sub-Surface Tactical Battle & Resource Extraction",
    description:
      "Descend into ancient encrypted vaults. Collect rare extraction matter, equip mystical runes, and engage in high-strategy card duels against rivals and ancient sentinels.",
    icon: "/hub_engraved.webp",
    bannerImage: "/images/hub/engraved-nether-ruins.webp",
    category: "games",
    platforms: ["android", "web"],
    badge: "Official Release",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
    currentRelease: {
      version: "v1.1.2",
      releaseDate: "August 2026",
      apkSize: "36.4 MB",
      downloadUrl: "/downloads/engraved-nether-v1.1.2.apk",
      demoUrl: "https://triple-triad-theta.vercel.app",
      minAndroidVersion: "Android 8.0 or higher",
      whatsNew: [
        "12 new ancient Nether glyph cards and relic combinations",
        "Smooth card drag-and-drop mechanics with tactile audio effects",
        "Global rank leaderboards with seasonal rewards",
      ],
    },
    features: [
      "PvP and PvE tactical board battles",
      "Dynamic deck builder with synergies and relic bonuses",
      "Cross-platform match sync between mobile and browser",
    ],
    techStack: ["Next.js / Vite", "Framer Motion", "Tailwind CSS", "Canvas FX"],
    highlights: ["Deck Builder", "Cross-Platform Match", "36 MB APK"],
  },
  {
    id: "omniflow-pos-mobile",
    name: "OmniFlow Client & POS Engine",
    tagline: "Showcase: Custom Business Inquiries, Orders & POS App",
    description:
      "A demonstration of the bespoke mobile enterprise applications Every Nation GG engineers for clients. Features real-time stock scanning, appointment scheduling, customer inquiry routing, and offline receipt printing.",
    icon: "/logo.png",
    bannerImage: "/images/home/home-dual-studio-master.jpg",
    category: "mobile",
    platforms: ["android", "web"],
    badge: "Showcase Demo",
    badgeColor: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    currentRelease: {
      version: "v2.0.1-demo",
      releaseDate: "October 2026",
      apkSize: "16.8 MB",
      downloadUrl: "/downloads/omniflow-pos-demo-v2.0.1.apk",
      demoUrl: "/visien",
      minAndroidVersion: "Android 9.0 or higher",
      whatsNew: [
        "Camera barcode & QR code scanner integration",
        "Instant WhatsApp and Telegram order alert dispatch",
        "Automatic offline SQLite cache with cloud sync",
      ],
    },
    features: [
      "Built for retail stores, repair shops, clinics & consultation firms",
      "Self-service customer portal with order progress tracking",
      "Customizable branding, color schemes, and field editors",
    ],
    techStack: ["React 19", "SQLite / PostgreSQL", "Zod", "Tailwind CSS"],
    highlights: ["Enterprise Ready", "Bespoke Demo", "Fast & Lightweight"],
  },
];
