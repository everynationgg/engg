import { useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, Play } from "lucide-react";
import type { GameCatalogItem, GameTheme, GameThemeParticle } from "@/lib/gameCatalog";
import { cn } from "@/lib/utils";

type PortalDeckProps = {
  games: readonly GameCatalogItem[];
};

const fallbackTheme: GameTheme = {
  accent: "#22d3ee",
  accentSoft: "rgba(34, 211, 238, 0.16)",
  backgroundImage: "/hub_bg.png",
  previewImage: "/hub_bg.png",
  portalEffect: "default",
  particles: ["scanline"],
};

const statusCopy: Record<GameCatalogItem["status"], string> = {
  online: "Online",
  offline: "Locked",
  "coming-soon": "Coming Soon",
};

function getTheme(game: GameCatalogItem): GameTheme {
  return {
    ...fallbackTheme,
    ...game.theme,
    previewImage: game.theme?.previewImage || game.image || fallbackTheme.previewImage,
    backgroundImage: game.theme?.backgroundImage || game.image || fallbackTheme.backgroundImage,
  };
}

function getLaunchLabel(game: GameCatalogItem): string {
  if (game.status === "offline") return "Access Locked";
  if (game.status === "coming-soon") return "Signal Pending";
  return "Enter Portal";
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href);
}

function PortalFragments({
  particles,
  accent,
  reducedMotion,
}: {
  particles: readonly GameThemeParticle[];
  accent: string;
  reducedMotion: boolean;
}) {
  if (reducedMotion) {
    return (
      <div
        className="absolute inset-0 rounded-[2rem] border border-white/10 opacity-60"
        style={{ boxShadow: `inset 0 0 45px ${accent}22` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.includes("scanline") && (
        <motion.div
          className="absolute left-8 right-8 top-1/2 h-[1px]"
          style={{ backgroundColor: accent, boxShadow: `0 0 18px ${accent}` }}
          animate={{ y: [-120, 160], opacity: [0, 0.8, 0] }}
          transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {particles.includes("role-card") &&
        ["CMD", "SCAN", "WARD"].map((label, index) => (
          <motion.div
            key={label}
            className={cn(
              "absolute hidden border bg-black/35 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.24em] text-white/60 backdrop-blur-sm sm:block",
              index === 0 && "left-2 top-10",
              index === 1 && "right-4 top-1/3",
              index === 2 && "bottom-14 left-8",
            )}
            style={{ borderColor: `${accent}55` }}
            animate={{
              opacity: [0.15, 0.72, 0.2],
              y: [0, -10, 0],
              rotate: index % 2 === 0 ? [0, -2, 0] : [0, 2, 0],
            }}
            transition={{ duration: 4 + index, repeat: Infinity, delay: index * 0.5 }}
          >
            {label}
          </motion.div>
        ))}

      {particles.includes("rune") &&
        ["I", "II", "III", "IV", "V"].map((label, index) => (
          <motion.div
            key={label}
            className="absolute border border-white/10 bg-black/30 px-2 py-1 font-mono text-[9px] text-white/55"
            style={{
              borderColor: `${accent}4d`,
              left: `${18 + index * 15}%`,
              top: `${18 + (index % 3) * 20}%`,
            }}
            animate={{ y: [0, -14, 0], opacity: [0.15, 0.8, 0.15] }}
            transition={{ duration: 3.5 + index * 0.35, repeat: Infinity, delay: index * 0.25 }}
          >
            {label}
          </motion.div>
        ))}

      {particles.includes("moon") && (
        <motion.div
          className="absolute right-10 top-10 h-14 w-14 rounded-full border bg-white/5"
          style={{ borderColor: `${accent}66`, boxShadow: `0 0 36px ${accent}33` }}
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      )}

      {particles.includes("orbit") && (
        <motion.div
          className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-50"
          style={{ borderColor: accent }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

export default function PortalDeck({ games }: PortalDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  const activeGame = games[activeIndex] ?? games[0];
  const activeTheme = useMemo(() => getTheme(activeGame), [activeGame]);
  const isLaunchable = activeGame.status === "online" && Boolean(activeGame.href);

  const setWrappedIndex = (nextIndex: number) => {
    const total = games.length;
    setActiveIndex((nextIndex + total) % total);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setWrappedIndex(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setWrappedIndex(activeIndex + 1);
    }
    if (event.key === "Enter" && isLaunchable && event.currentTarget === event.target) {
      window.location.assign(activeGame.href);
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden py-4 sm:py-8"
      aria-label="ENGG Portal Deck"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ "--portal-accent": activeTheme.accent } as CSSProperties}
    >
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[#020408]" aria-hidden="true" />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeGame.slug}
          className="absolute inset-0 -z-10 rounded-[2rem] bg-cover bg-center"
          style={{ backgroundImage: `url(${activeTheme.backgroundImage})` }}
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.04 }}
          animate={{ opacity: 0.38, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.45 }}
          aria-hidden="true"
        />
      </AnimatePresence>

      <div
        className="absolute inset-0 -z-10 rounded-[2rem]"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${activeTheme.accentSoft}, transparent 44%), linear-gradient(180deg, rgba(2,4,8,0.35), rgba(2,4,8,0.96))`,
        }}
        aria-hidden="true"
      />

      <div className="grid min-h-[680px] grid-cols-1 items-center gap-6 px-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)] lg:gap-10 lg:px-4">
        <div className="relative mx-auto flex w-full max-w-[560px] flex-col items-center">
          <div className="pointer-events-none absolute inset-0 -m-8 overflow-visible" aria-hidden="true">
            <PortalFragments
              particles={activeTheme.particles}
              accent={activeTheme.accent}
              reducedMotion={Boolean(reducedMotion)}
            />
          </div>

          <motion.div
            key={`portal-${activeGame.slug}`}
            className="relative w-full max-w-[420px] [perspective:1400px]"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35 }}
          >
            <div
              className="relative aspect-[4/5] w-full overflow-hidden border bg-black/45 shadow-2xl backdrop-blur-sm"
              style={{
                borderColor: `${activeTheme.accent}99`,
                boxShadow: `0 0 50px ${activeTheme.accent}30, inset 0 0 40px ${activeTheme.accent}18`,
                clipPath:
                  "polygon(0 0, calc(100% - 42px) 0, 100% 42px, 100% 100%, 42px 100%, 0 calc(100% - 42px))",
              }}
            >
              <motion.img
                key={activeTheme.previewImage}
                src={activeTheme.previewImage}
                alt={`${activeGame.title} portal preview`}
                width={840}
                height={1050}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-cover"
                initial={{ scale: reducedMotion ? 1 : 1.08, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.55 }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              <div className="absolute inset-x-8 top-8 h-[1px]" style={{ backgroundColor: activeTheme.accent }} />
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-4">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/60">
                    {activeTheme.portalEffect.replace("-", "_")}
                  </span>
                  <h3 className="mt-2 font-orbitron text-xl font-black uppercase tracking-[0.18em] text-white sm:text-2xl">
                    {activeGame.title}
                  </h3>
                </div>
                <span
                  className="border bg-black/45 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em]"
                  style={{ borderColor: `${activeTheme.accent}66`, color: activeTheme.accent }}
                >
                  {statusCopy[activeGame.status]}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="mt-6 flex w-full max-w-[520px] items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setWrappedIndex(activeIndex - 1)}
              className="grid h-11 w-11 shrink-0 place-items-center border border-white/10 bg-black/35 text-white/70 transition hover:border-white/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
              aria-label="Previous game"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 flex-1 justify-center gap-2 overflow-hidden">
              {games.map((game, index) => {
                const theme = getTheme(game);
                const isActive = index === activeIndex;
                return (
                  <button
                    key={game.slug}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "min-h-12 min-w-0 flex-1 border bg-black/35 px-2 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300/60",
                      isActive ? "border-white/30" : "border-white/10 opacity-70 hover:opacity-100",
                    )}
                    style={isActive ? { boxShadow: `0 0 18px ${theme.accent}33` } : undefined}
                    aria-pressed={isActive}
                  >
                    <span className="block truncate font-orbitron text-[9px] font-bold uppercase tracking-[0.16em] text-white sm:text-[10px]">
                      {game.title}
                    </span>
                    <span
                      className="mt-1 block truncate font-mono text-[7px] uppercase tracking-[0.2em]"
                      style={{ color: isActive ? theme.accent : "rgba(255,255,255,0.35)" }}
                    >
                      {statusCopy[game.status]}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setWrappedIndex(activeIndex + 1)}
              className="grid h-11 w-11 shrink-0 place-items-center border border-white/10 bg-black/35 text-white/70 transition hover:border-white/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
              aria-label="Next game"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <motion.div
          key={`details-${activeGame.slug}`}
          className="relative w-full border border-white/10 bg-black/45 p-5 backdrop-blur-md sm:p-7"
          style={{ boxShadow: `0 0 36px ${activeTheme.accent}18` }}
          initial={{ opacity: 0, x: reducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <span className="font-mono text-[8px] uppercase tracking-[0.42em] text-white/35">
              ENGG Portal Deck
            </span>
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: activeTheme.accent, boxShadow: `0 0 18px ${activeTheme.accent}` }}
              aria-hidden="true"
            />
          </div>

          <p className="font-mono text-[9px] uppercase tracking-[0.34em]" style={{ color: activeTheme.accent }}>
            {activeGame.subtitle}
          </p>
          <h2 className="mt-3 font-orbitron text-3xl font-black uppercase leading-tight tracking-[0.16em] text-white sm:text-4xl">
            {activeGame.title}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/68 sm:text-base">
            {activeGame.description}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="border border-white/10 bg-white/[0.03] p-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30">Path</span>
              <span className="mt-2 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-white/65">
                {activeGame.href || `/${activeGame.slug}`}
              </span>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30">State</span>
              <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: activeTheme.accent }}>
                {statusCopy[activeGame.status]}
              </span>
            </div>
          </div>

          <div className="mt-8">
            {isLaunchable ? (
              <a
                href={activeGame.href}
                className="group relative inline-flex min-h-12 w-full items-center justify-center overflow-hidden border px-6 py-3 font-orbitron text-[11px] font-black uppercase tracking-[0.32em] text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-300/60 sm:w-auto"
                style={{
                  borderColor: `${activeTheme.accent}88`,
                  background: `linear-gradient(135deg, ${activeTheme.accentSoft}, rgba(255,255,255,0.03))`,
                }}
                aria-label={`Enter ${activeGame.title}`}
                rel={isExternalHref(activeGame.href) ? "noopener noreferrer" : undefined}
              >
                <Play className="mr-3 h-4 w-4" />
                {getLaunchLabel(activeGame)}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-12 w-full items-center justify-center border border-white/10 bg-white/[0.03] px-6 py-3 font-orbitron text-[11px] font-black uppercase tracking-[0.32em] text-white/35 sm:w-auto"
                aria-label={`${activeGame.title} is locked`}
              >
                <Lock className="mr-3 h-4 w-4" />
                {getLaunchLabel(activeGame)}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
