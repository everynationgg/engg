import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, Play } from "lucide-react";
import type { GameCatalogItem, GameTheme, GameThemeParticle } from "@/lib/gameCatalog";
import { cn } from "@/lib/utils";

type PortalDeckProps = {
  games: readonly GameCatalogItem[];
  motionProfile: MotionProfile;
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

const entryTransitionMs = 720;
const entryStreakCount = 14;
const worldParticleCount = 30;
const sceneStarCount = 86;
const portalLeakCount = 26;
const portalStreamCount = 12;

type PortalDeckStyle = CSSProperties & {
  "--portal-accent": string;
  "--portal-drift-x": string;
  "--portal-drift-y": string;
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

function isLaunchableGame(game: GameCatalogItem): boolean {
  return game.status === "online" && Boolean(game.href);
}

type WorldSceneKind = "space-anomaly" | "nether-depths" | "orbital-lock" | "default";
type MotionProfile = "reduced" | "mobile" | "desktop" | null;

type WorldEntityKind =
  | "probe"
  | "drone"
  | "satellite"
  | "debris"
  | "rune-shard"
  | "ember"
  | "station"
  | "relic"
  | "stone-fragment"
  | "mech"
  | "alien"
  | "laser"
  | "smoke"
  | "spark";

type WorldEntity = {
  id: string;
  kind: WorldEntityKind;
  left: string;
  top: string;
  size: number;
  driftX: string;
  driftY: string;
  delay: number;
  duration: number;
  rotate: number;
  opacity: number;
};

function getSceneKind(theme: GameTheme): WorldSceneKind {
  if (theme.portalEffect === "signal-breach") return "space-anomaly";
  if (theme.portalEffect === "nether-rune") return "nether-depths";
  if (theme.portalEffect === "orbital-command") return "orbital-lock";
  return "default";
}

function getWorldBaseBackground(theme: GameTheme): string {
  const sceneKind = getSceneKind(theme);
  if (sceneKind === "space-anomaly") {
    return `radial-gradient(circle at 75% 20%, rgba(79,70,229,0.26), transparent 28%), radial-gradient(circle at 32% 48%, ${theme.accentSoft}, transparent 34%), radial-gradient(circle at 50% 92%, rgba(5,12,24,0.4), transparent 32%), linear-gradient(180deg, #01040b 0%, #020617 46%, #00030a 100%)`;
  }
  if (sceneKind === "nether-depths") {
    return `radial-gradient(circle at 50% 92%, rgba(217,70,239,0.24), transparent 34%), radial-gradient(circle at 32% 32%, rgba(245,158,11,0.14), transparent 31%), radial-gradient(circle at 75% 24%, rgba(88,28,135,0.22), transparent 28%), linear-gradient(180deg, #030105 0%, #120614 42%, #070209 72%, #010102 100%)`;
  }
  if (sceneKind === "orbital-lock") {
    return `radial-gradient(circle at 22% 52%, rgba(34,211,238,0.18), transparent 32%), radial-gradient(circle at 72% 34%, rgba(245,158,11,0.24), transparent 30%), radial-gradient(circle at 50% 90%, rgba(127,29,29,0.26), transparent 34%), linear-gradient(180deg, #03050a 0%, #090b12 44%, #110806 78%, #010204 100%)`;
  }
  return `radial-gradient(circle at 72% 18%, ${theme.accentSoft}, transparent 32%), radial-gradient(circle at 50% 92%, rgba(245,158,11,0.18), transparent 34%), linear-gradient(180deg, #05060b 0%, #0b0d12 52%, #010204 100%)`;
}

function WorldSceneLayer({
  children,
  className,
  style,
  name,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  name: string;
}) {
  return (
    <div data-world-scene-layer={name} className={cn("absolute inset-0", className)} style={style} aria-hidden="true">
      {children}
    </div>
  );
}

function AmbientEntity({
  entity,
  accent,
  reducedMotion,
}: {
  entity: WorldEntity;
  accent: string;
  reducedMotion: boolean;
}) {
  const animationStyle = reducedMotion
    ? {}
    : {
      "--entity-x": entity.driftX,
      "--entity-y": entity.driftY,
      "--entity-rotate": `${entity.rotate}deg`,
      animation: `engg-world-entity ${entity.duration}s ease-in-out ${entity.delay}s infinite`,
    };

  if (entity.kind === "probe" || entity.kind === "drone") {
    return (
      <motion.div
        data-world-entity
        data-world-entity-kind={entity.kind}
        className="absolute will-change-transform"
        style={{
          left: entity.left,
          top: entity.top,
          width: entity.size,
          height: entity.size * 0.62,
          opacity: entity.opacity,
          ...animationStyle,
        } as CSSProperties}
        aria-hidden="true"
      >
        <span
          className="absolute left-1/2 top-1/2 h-[42%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border bg-black/70"
          style={{ borderColor: `${accent}8a`, boxShadow: `0 0 18px ${accent}66, inset 0 0 12px ${accent}33` }}
        />
        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2" style={{ backgroundColor: `${accent}88` }} />
        <span
          className="absolute right-0 top-1/2 h-[2px] w-[34%] -translate-y-1/2"
          style={{ background: `linear-gradient(90deg, ${accent}, transparent)`, boxShadow: `0 0 12px ${accent}` }}
        />
        <span className="absolute left-[16%] top-[18%] h-[64%] w-[2px]" style={{ backgroundColor: `${accent}55` }} />
        <span className="absolute right-[20%] top-[18%] h-[64%] w-[2px]" style={{ backgroundColor: `${accent}55` }} />
      </motion.div>
    );
  }

  if (entity.kind === "satellite" || entity.kind === "station") {
    return (
      <motion.div
        data-world-entity
        data-world-entity-kind={entity.kind}
        className="absolute will-change-transform"
        style={{
          left: entity.left,
          top: entity.top,
          width: entity.size,
          height: entity.size * 0.46,
          opacity: entity.opacity,
          ...animationStyle,
        } as CSSProperties}
        aria-hidden="true"
      >
        <span
          className="absolute left-1/2 top-1/2 h-[54%] w-[16%] -translate-x-1/2 -translate-y-1/2 border bg-black/75"
          style={{ borderColor: `${accent}7a`, boxShadow: `0 0 18px ${accent}44` }}
        />
        <span className="absolute left-0 top-[28%] h-[44%] w-[38%] border" style={{ borderColor: `${accent}55` }} />
        <span className="absolute right-0 top-[28%] h-[44%] w-[38%] border" style={{ borderColor: `${accent}55` }} />
        <span className="absolute left-[9%] right-[9%] top-1/2 h-px -translate-y-1/2" style={{ backgroundColor: `${accent}66` }} />
      </motion.div>
    );
  }

  if (entity.kind === "mech") {
    return (
      <motion.div
        data-world-entity
        data-world-entity-kind={entity.kind}
        className="absolute will-change-transform"
        style={{
          left: entity.left,
          top: entity.top,
          width: entity.size,
          height: entity.size * 1.25,
          opacity: entity.opacity,
          ...animationStyle,
        } as CSSProperties}
        aria-hidden="true"
      >
        <span
          className="absolute left-[28%] top-[18%] h-[36%] w-[38%] border bg-black/80"
          style={{ borderColor: `${accent}88`, boxShadow: `0 0 24px ${accent}55, inset 0 0 16px ${accent}25` }}
        />
        <span
          className="absolute left-[37%] top-[4%] h-[16%] w-[20%] border bg-black/85"
          style={{ borderColor: `${accent}66`, boxShadow: `0 0 14px ${accent}44` }}
        />
        <span className="absolute left-[8%] top-[30%] h-[7%] w-[42%]" style={{ backgroundColor: `${accent}75`, boxShadow: `0 0 18px ${accent}` }} />
        <span className="absolute right-[5%] top-[25%] h-[4%] w-[48%]" style={{ background: `linear-gradient(90deg, ${accent}, transparent)`, boxShadow: `0 0 18px ${accent}` }} />
        <span className="absolute bottom-[12%] left-[28%] h-[34%] w-[8%] bg-black/80" style={{ boxShadow: `0 0 10px ${accent}44` }} />
        <span className="absolute bottom-[8%] right-[31%] h-[36%] w-[8%] bg-black/80" style={{ boxShadow: `0 0 10px ${accent}44` }} />
        <span className="absolute bottom-0 left-[18%] h-[9%] w-[22%] border-t" style={{ borderColor: `${accent}66` }} />
        <span className="absolute bottom-0 right-[22%] h-[9%] w-[22%] border-t" style={{ borderColor: `${accent}66` }} />
      </motion.div>
    );
  }

  if (entity.kind === "alien") {
    return (
      <motion.div
        data-world-entity
        data-world-entity-kind={entity.kind}
        className="absolute will-change-transform"
        style={{
          left: entity.left,
          top: entity.top,
          width: entity.size,
          height: entity.size * 0.82,
          opacity: entity.opacity,
          ...animationStyle,
        } as CSSProperties}
        aria-hidden="true"
      >
        <span
          className="absolute inset-x-[12%] top-[18%] h-[54%] rounded-[55%_45%_48%_52%] bg-black/82"
          style={{
            border: `1px solid ${accent}66`,
            boxShadow: `0 0 28px ${accent}4f, inset 0 0 18px ${accent}2d`,
            clipPath: "polygon(8% 46%, 28% 10%, 72% 8%, 96% 45%, 74% 90%, 28% 92%)",
          }}
        />
        <span className="absolute left-[22%] top-[37%] h-1.5 w-5 rounded-full" style={{ backgroundColor: `${accent}d9`, boxShadow: `0 0 16px ${accent}` }} />
        <span className="absolute right-[24%] top-[37%] h-1.5 w-5 rounded-full" style={{ backgroundColor: `${accent}d9`, boxShadow: `0 0 16px ${accent}` }} />
        <span className="absolute bottom-[4%] left-[12%] h-[38%] w-[18%] origin-top rotate-12 border-l" style={{ borderColor: `${accent}80` }} />
        <span className="absolute bottom-[3%] right-[14%] h-[36%] w-[18%] origin-top -rotate-12 border-r" style={{ borderColor: `${accent}80` }} />
        <span className="absolute bottom-[2%] left-[43%] h-[32%] w-[14%] border-l border-r" style={{ borderColor: `${accent}5e` }} />
      </motion.div>
    );
  }

  if (entity.kind === "laser") {
    return (
      <motion.span
        data-world-entity
        data-world-entity-kind={entity.kind}
        className="absolute h-[2px] origin-left rounded-full will-change-transform"
        style={{
          left: entity.left,
          top: entity.top,
          width: entity.size * 3.2,
          opacity: entity.opacity,
          background: `linear-gradient(90deg, transparent, ${accent}, rgba(255,255,255,0.85), transparent)`,
          boxShadow: `0 0 18px ${accent}, 0 0 34px ${accent}66`,
          ...animationStyle,
        } as CSSProperties}
        aria-hidden="true"
      />
    );
  }

  if (entity.kind === "smoke") {
    return (
      <motion.span
        data-world-entity
        data-world-entity-kind={entity.kind}
        className="absolute rounded-full blur-xl will-change-transform"
        style={{
          left: entity.left,
          top: entity.top,
          width: entity.size,
          height: entity.size * 0.72,
          opacity: entity.opacity,
          background: `radial-gradient(circle, rgba(255,255,255,0.13), ${accent}24 38%, transparent 72%)`,
          ...animationStyle,
        } as CSSProperties}
        aria-hidden="true"
      />
    );
  }

  if (entity.kind === "rune-shard") {
    return (
      <motion.span
        data-world-entity
        data-world-entity-kind={entity.kind}
        className="absolute border bg-black/35 font-mono text-[9px] text-white/60 will-change-transform"
        style={{
          left: entity.left,
          top: entity.top,
          width: entity.size,
          height: entity.size * 1.7,
          borderColor: `${accent}70`,
          color: accent,
          clipPath: "polygon(50% 0, 100% 68%, 58% 100%, 0 72%)",
          boxShadow: `0 0 18px ${accent}55`,
          opacity: entity.opacity,
          ...animationStyle,
        } as CSSProperties}
        aria-hidden="true"
      />
    );
  }

  if (entity.kind === "relic" || entity.kind === "stone-fragment") {
    return (
      <motion.span
        data-world-entity
        data-world-entity-kind={entity.kind}
        className="absolute border bg-black/50 will-change-transform"
        style={{
          left: entity.left,
          top: entity.top,
          width: entity.size,
          height: entity.kind === "relic" ? entity.size * 1.18 : entity.size * 0.82,
          borderColor: entity.kind === "relic" ? `${accent}88` : "rgba(255,255,255,0.18)",
          background:
            entity.kind === "relic"
              ? `linear-gradient(180deg, rgba(0,0,0,0.72), ${accent}1f)`
              : "linear-gradient(180deg, rgba(28,20,15,0.86), rgba(0,0,0,0.72))",
          boxShadow: entity.kind === "relic" ? `0 0 26px ${accent}5a, inset 0 0 18px ${accent}28` : `0 0 14px ${accent}26`,
          clipPath:
            entity.kind === "relic"
              ? "polygon(50% 0, 92% 26%, 78% 100%, 22% 100%, 8% 26%)"
              : "polygon(10% 12%, 94% 0, 100% 72%, 62% 100%, 0 78%)",
          opacity: entity.opacity,
          ...animationStyle,
        } as CSSProperties}
        aria-hidden="true"
      >
        {entity.kind === "relic" && (
          <span
            className="absolute left-1/2 top-[18%] h-[56%] w-px -translate-x-1/2"
            style={{ backgroundColor: `${accent}aa`, boxShadow: `0 0 14px ${accent}` }}
            aria-hidden="true"
          />
        )}
      </motion.span>
    );
  }

  return (
    <motion.span
      data-world-entity
      data-world-entity-kind={entity.kind}
      className="absolute rounded-sm will-change-transform"
      style={{
        left: entity.left,
        top: entity.top,
        width: entity.size,
        height: entity.kind === "ember" || entity.kind === "spark" ? entity.size : entity.size * 1.6,
        backgroundColor: entity.kind === "ember" || entity.kind === "spark" ? accent : "rgba(0,0,0,0.72)",
        border: entity.kind === "debris" ? `1px solid ${accent}55` : undefined,
        boxShadow: `0 0 16px ${accent}66`,
        clipPath: entity.kind === "ember" || entity.kind === "spark" ? "circle(50%)" : "polygon(12% 0, 100% 22%, 72% 100%, 0 78%)",
        opacity: entity.opacity,
        ...animationStyle,
      } as CSSProperties}
      aria-hidden="true"
    />
  );
}

interface PaintElement {
  id: string;
  left: string;
  top: string;
  delay: number;
  size?: number;
  width?: number;
  rotate?: number;
  color: string;
  xDest?: number;
  yDest?: number;
  char?: string;
}

// World Paint Transition overlay rendering custom particles and wave reveals
function WorldPaintOverlay({
  fromGame,
  toGame,
  motionProfile,
}: {
  fromGame: GameCatalogItem | null;
  toGame: GameCatalogItem;
  motionProfile: MotionProfile;
}) {
  const theme = getTheme(toGame);
  const isMobile = motionProfile === "mobile";
  const sceneKind = getSceneKind(theme);

  const elements = useMemo<PaintElement[]>(() => {
    if (sceneKind === "space-anomaly") {
      return Array.from({ length: isMobile ? 8 : 16 }, (_, i) => {
        const xDest = ((i * 73) % 81) - 40;
        const yDest = ((i * 109) % 81) - 40;
        const char = (i * 17) % 2 === 0 ? "1" : "0";
        return {
          id: `errant-paint-${i}`,
          left: `${45 + Math.cos((i * Math.PI) / 8) * (20 + (i % 3) * 15)}%`,
          top: `${45 + Math.sin((i * Math.PI) / 8) * (20 + (i % 3) * 15)}%`,
          delay: i * 0.03,
          size: 2 + (i % 3) * 2,
          color: i % 2 === 0 ? "#22d3ee" : "#3b82f6",
          xDest,
          yDest,
          char,
        };
      });
    } else if (sceneKind === "nether-depths") {
      return Array.from({ length: isMobile ? 6 : 12 }, (_, i) => {
        const yDest = -70 - ((i * 31) % 51);
        return {
          id: `nether-paint-${i}`,
          left: `${42 + Math.cos((i * Math.PI) / 6) * (18 + (i % 2) * 12)}%`,
          top: `${45 + Math.sin((i * Math.PI) / 6) * (18 + (i % 2) * 12)}%`,
          delay: i * 0.04,
          size: 3 + (i % 4) * 3,
          color: i % 2 === 0 ? "#c084fc" : "#fbbf24",
          yDest,
        };
      });
    } else {
      return Array.from({ length: isMobile ? 8 : 14 }, (_, i) => {
        const rotateVal = (i * 360) / 7 + (i % 2) * 15;
        const rad = (rotateVal * Math.PI) / 180;
        const xDest = Math.cos(rad) * 120;
        const yDest = Math.sin(rad) * 120;
        return {
          id: `epsilon-paint-${i}`,
          left: `${48 + Math.cos((i * Math.PI) / 7) * (22 + (i % 3) * 10)}%`,
          top: `${40 + Math.sin((i * Math.PI) / 7) * (22 + (i % 3) * 10)}%`,
          delay: i * 0.025,
          width: 15 + (i % 3) * 20,
          rotate: rotateVal,
          color: i % 2 === 0 ? "#f97316" : "#22d3ee",
          xDest,
          yDest,
        };
      });
    }
  }, [sceneKind, isMobile]);

  return (
    <div className="fixed inset-0 z-[15] overflow-hidden pointer-events-none">
      {/* Expanding radial wash ring from center */}
      <motion.div
        className="fixed left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{
          borderColor: theme.accent,
          boxShadow: `0 0 50px ${theme.accent}, inset 0 0 30px ${theme.accent}`,
          width: "100px",
          height: "100px",
        }}
        initial={{ scale: 0.1, opacity: 0.8 }}
        animate={{ scale: isMobile ? 12 : 26, opacity: 0 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      {/* Mobile-specific expanding radial wash filled overlay */}
      {isMobile && (
        <motion.div
          className="fixed inset-0 z-[14]"
          style={{
            background: `radial-gradient(circle at 50% 42%, ${theme.accent} 0%, ${theme.accent}22 35%, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.8, 2.5] }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      )}

      {sceneKind === "space-anomaly" && (
        <>
          {isMobile ? (
            /* Smooth GPU-accelerated scanline sweep */
            <motion.div
              className="fixed left-0 w-full h-[6px] bg-cyan-400/95 shadow-[0_0_24px_#22d3ee] z-[16]"
              style={{ top: 0 }}
              initial={{ y: "-10vh" }}
              animate={{ y: "110vh" }}
              transition={{ duration: 0.95, ease: "easeInOut" }}
            />
          ) : (
            <motion.div
              className="fixed left-0 w-full h-[5px] bg-cyan-400/90 shadow-[0_0_20px_rgba(34,211,238,1)]"
              initial={{ top: "-10%" }}
              animate={{ top: "110%" }}
              transition={{ duration: 0.95, ease: "easeInOut" }}
            />
          )}

          {elements.map((el) => (
            <motion.div
              key={el.id}
              className="absolute rounded-sm font-mono text-[9px] flex items-center justify-center"
              style={{
                left: el.left,
                top: el.top,
                backgroundColor: el.color,
                color: "#ffffff",
                width: `${(el.size ?? 4) * 3.5}px`,
                height: `${(el.size ?? 4) * 1.5}px`,
                boxShadow: `0 0 10px ${el.color}`,
              }}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.3, 0], opacity: [0, 1, 0], x: [0, el.xDest ?? 0], y: [0, el.yDest ?? 0] }}
              transition={{ duration: 0.8, delay: el.delay, ease: "easeOut" }}
            >
              {el.char}
            </motion.div>
          ))}
        </>
      )}

      {sceneKind === "nether-depths" && (
        <>
          {isMobile ? (
            /* Ash glow wash */
            <motion.div
              className="fixed inset-0 bg-gradient-to-b from-[#120614]/80 via-[#070209]/95 to-black pointer-events-none z-[13]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.95, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          ) : (
            /* Full-screen cave darkness expansion */
            <motion.div
              className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(18,6,20,0.85)_100%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 1.1 }}
            />
          )}

          <motion.div
            className="fixed left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 border border-purple-500/40 rounded-full flex items-center justify-center font-orbitron text-[8px] sm:text-[10px] text-purple-300/60 uppercase tracking-[0.3em] z-[16]"
            style={{ width: "200px", height: "200px" }}
            initial={{ scale: 0.1, rotate: 0, opacity: 0.9 }}
            animate={{ scale: isMobile ? 4 : 10, rotate: 180, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            <span className="border border-yellow-500/20 rounded-full w-[80%] h-[80%] absolute" />
            RUNE_SEAL
          </motion.div>

          {elements.map((el) => (
            <motion.div
              key={el.id}
              className="absolute rounded-full"
              style={{
                left: el.left,
                top: el.top,
                backgroundColor: el.color,
                width: `${el.size ?? 4}px`,
                height: `${el.size ?? 4}px`,
                boxShadow: `0 0 12px ${el.color}`,
              }}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.4, 0], opacity: [0, 0.85, 0], y: [0, el.yDest ?? -70] }}
              transition={{ duration: 1.1, delay: el.delay, ease: "easeOut" }}
            />
          ))}
        </>
      )}

      {sceneKind === "orbital-lock" && (
        <>
          {isMobile ? (
            <>
              {/* Tactical grid overlay */}
              <motion.div
                className="fixed inset-0 bg-[linear-gradient(rgba(249,115,22,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.05)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none z-[13]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.0 }}
              />
              {/* Tactical laser line sweep */}
              <motion.div
                className="fixed left-0 w-full h-[3px] bg-orange-500/90 shadow-[0_0_18px_#f97316] z-[16]"
                style={{ top: 0 }}
                initial={{ y: "-10vh" }}
                animate={{ y: "110vh" }}
                transition={{ duration: 0.95, ease: "easeInOut" }}
              />
              {/* Tactical haze wash */}
              <motion.div
                className="fixed inset-0 bg-gradient-to-b from-orange-950/20 via-transparent to-orange-950/30 pointer-events-none z-[13]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
              />
            </>
          ) : (
            <>
              <motion.div
                className="fixed inset-0 bg-[linear-gradient(rgba(249,115,22,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.06)_1px,transparent_1px)] bg-[size:40px_40px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.0 }}
              />
              <motion.div
                className="fixed left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-t from-orange-950/20 via-transparent to-transparent pointer-events-none rounded-full blur-3xl"
                style={{ width: "280px", height: "280px" }}
                initial={{ scale: 0.1, opacity: 0.8 }}
                animate={{ scale: 7, opacity: 0 }}
                transition={{ duration: 1.0, ease: "easeOut" }}
              />
            </>
          )}

          {elements.map((el) => (
            <motion.div
              key={el.id}
              className="absolute rounded-full"
              style={{
                left: el.left,
                top: el.top,
                backgroundColor: el.color,
                width: `${el.width ?? 15}px`,
                height: "2px",
                rotate: `${el.rotate ?? 0}deg`,
                boxShadow: `0 0 8px ${el.color}`,
              }}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.6, 0], opacity: [0, 0.9, 0], x: [0, el.xDest ?? 0], y: [0, el.yDest ?? 0] }}
              transition={{ duration: 0.8, delay: el.delay, ease: "easeOut" }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function WorldCanvasTransition({
  activeGame,
  activeTheme,
  activeIndex,
  games,
  motionProfile,
}: {
  activeGame: GameCatalogItem;
  activeTheme: GameTheme;
  activeIndex: number;
  games: readonly GameCatalogItem[];
  motionProfile: MotionProfile;
}) {
  const [prevGame, setPrevGame] = useState<GameCatalogItem | null>(null);
  const [prevTheme, setPrevTheme] = useState<GameTheme | null>(null);
  const [currentGame, setCurrentGame] = useState<GameCatalogItem>(activeGame);
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(activeTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(false);
  const prevIndexRef = useRef(activeIndex);

  useEffect(() => {
    let timer: number | null = null;
    let rafId: number | null = null;
    if (prevIndexRef.current !== activeIndex) {
      const oldGame = games[prevIndexRef.current];
      setPrevGame(oldGame);
      setPrevTheme(getTheme(oldGame));
      setCurrentGame(activeGame);
      setCurrentTheme(activeTheme);
      setIsTransitioning(true);
      setTransitionProgress(false);
      prevIndexRef.current = activeIndex;

      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          setTransitionProgress(true);
        });
      });

      timer = window.setTimeout(() => {
        setIsTransitioning(false);
        setPrevGame(null);
        setPrevTheme(null);
        setTransitionProgress(false);
      }, 1250); // clean transition end independent of child animation complete events
    }
    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [activeIndex, activeGame, activeTheme, games]);

  const clipPaths = useMemo(() => {
    const kind = getSceneKind(getTheme(currentGame));
    if (kind === "space-anomaly") {
      // Errant Night: horizontal signal tear/rift
      return {
        initial: "polygon(0% 42%, 20% 41%, 40% 43%, 60% 41%, 80% 42%, 100% 41%, 100% 42%, 80% 43%, 60% 42%, 40% 44%, 20% 42%, 0% 43%)",
        animate: "polygon(0% 0%, 20% 0%, 40% 0%, 60% 0%, 80% 0%, 100% 0%, 100% 100%, 80% 100%, 60% 100%, 40% 100%, 20% 100%, 0% 100%)",
      };
    } else if (kind === "nether-depths") {
      // Engraved Nether: jagged diagonal rune cracks
      return {
        initial: "polygon(0% 42%, 30% 20%, 50% 65%, 70% 30%, 100% 42%, 100% 43%, 70% 31%, 50% 66%, 30% 21%, 0% 43%)",
        animate: "polygon(0% 0%, 0% 0%, 50% 0%, 100% 0%, 100% 100%, 100% 100%, 75% 100%, 50% 100%, 0% 100%, 0% 100%)",
      };
    } else {
      // Epsilon Nine: expanding hexagonal/tactical breach (non-degenerate initial state to prevent browser GPU flicker)
      return {
        initial: "polygon(50% 41.9%, 50.1% 41.9%, 50.1% 42.1%, 50% 42.1%, 49.9% 42.1%, 49.9% 41.9%, 50% 41.9%, 50% 41.9%)",
        animate: "polygon(50% -50%, 150% 0%, 150% 150%, 50% 250%, -50% 150%, -50% 0%, 50% -50%, 50% -50%)",
      };
    }
  }, [currentGame]);

  const isReduced = motionProfile === "reduced" || motionProfile === null;
  const useOpacityTransition = motionProfile === "mobile";
  const canvasBackground = getWorldBaseBackground(currentTheme);

  if (isReduced) {
    return (
      <PortalWorldScene
        game={activeGame}
        theme={activeTheme}
        motionProfile={motionProfile}
        isTransitionActive={false}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black" style={{ background: canvasBackground }}>
      {/* 1. Previous Base Layer */}
      {isTransitioning && prevGame && prevTheme && (
        <PortalWorldScene
          game={prevGame}
          theme={prevTheme}
          motionProfile={motionProfile}
          isTransitionActive={true}
        />
      )}

      {/* 2. Next Paint-Reveal Layer */}
      {isTransitioning ? (
        useOpacityTransition ? (
          <motion.div
            key={`paint-target-${currentGame.slug}`}
            className="fixed inset-0 z-[1]"
            initial={{ opacity: 0.001 }}
            animate={{ opacity: transitionProgress ? 1 : 0.001 }}
            transition={{ duration: 0.95, ease: "easeOut" }}
          >
            <PortalWorldScene
              game={currentGame}
              theme={currentTheme}
              motionProfile={motionProfile}
              isTransitionActive={true}
            />
          </motion.div>
        ) : (
          <div
            key={`paint-target-${currentGame.slug}`}
            className="fixed inset-0 z-[1]"
            style={{
              clipPath: transitionProgress ? clipPaths.animate : clipPaths.initial,
              opacity: transitionProgress ? 1 : 0.1,
              transition: "clip-path 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <PortalWorldScene
              game={currentGame}
              theme={currentTheme}
              motionProfile={motionProfile}
              isTransitionActive={true}
            />
          </div>
        )
      ) : (
        <PortalWorldScene
          game={currentGame}
          theme={currentTheme}
          motionProfile={motionProfile}
          isTransitionActive={false}
        />
      )}

      {/* 3. Paint Wave & Particle Overlay */}
      {isTransitioning && (
        <WorldPaintOverlay
          fromGame={prevGame}
          toGame={currentGame}
          motionProfile={motionProfile}
        />
      )}
    </div>
  );
}

function PortalWorldScene({
  game,
  theme,
  motionProfile,
  isTransitionActive = false,
}: {
  game: GameCatalogItem;
  theme: GameTheme;
  motionProfile: MotionProfile;
  isTransitionActive?: boolean;
}) {
  const isMobile = motionProfile === "mobile";
  const reducedMotion = motionProfile === "reduced" || motionProfile === null;
  const sceneKind = getSceneKind(theme);
  const isSpace = sceneKind === "space-anomaly";
  const isNether = sceneKind === "nether-depths";
  const isOrbital = sceneKind === "orbital-lock";

  const stars = useMemo(
    () =>
      Array.from({ length: isMobile ? 15 : sceneStarCount }, (_, index) => ({
        id: `${game.slug}-star-${index}`,
        left: `${(index * 37) % 100}%`,
        top: `${(index * 53) % 100}%`,
        size: 1 + (index % 4) * 0.55,
        opacity: 0.22 + (index % 5) * 0.12,
        delay: index * 0.04,
        drift: index % 2 === 0 ? "18px" : "-18px",
      })),
    [game.slug, isMobile],
  );
  const particles = useMemo(
    () =>
      Array.from({ length: isMobile ? 8 : worldParticleCount }, (_, index) => ({
        id: `${game.slug}-particle-${index}`,
        left: `${-8 + ((index * 29) % 116)}%`,
        top: `${4 + ((index * 41) % 92)}%`,
        width: 22 + (index % 7) * 18,
        delay: index * 0.12,
        drift: index % 2 === 0 ? "44vw" : "-44vw",
        lift: index % 3 === 0 ? "-20vh" : "16vh",
        opacity: 0.16 + (index % 4) * 0.1,
      })),
    [game.slug, isMobile],
  );
  const ruinRunes = useMemo(
    () =>
      ["I", "II", "III", "IV", "V", "VI", "IX", "XI", "SEAL", "WARD", "RELIC", "ASH"].map((label, index) => ({
        id: `${game.slug}-ruin-rune-${index}`,
        label,
        left: `${10 + ((index * 19) % 80)}%`,
        top: `${13 + ((index * 23) % 68)}%`,
        size: 18 + (index % 4) * 4,
        delay: index * 0.16,
      })),
    [game.slug],
  );
  const ruinFragments = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        id: `${game.slug}-ruin-fragment-${index}`,
        left: `${-2 + ((index * 17) % 104)}%`,
        top: `${18 + ((index * 29) % 70)}%`,
        width: 26 + (index % 5) * 18,
        height: 18 + (index % 4) * 14,
        rotate: -28 + index * 9,
        delay: index * 0.18,
        opacity: 0.16 + (index % 5) * 0.08,
      })),
    [game.slug],
  );
  const battleLasers = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: `${game.slug}-battle-laser-${index}`,
        left: `${-12 + ((index * 23) % 118)}%`,
        top: `${15 + ((index * 17) % 70)}%`,
        width: 140 + (index % 5) * 42,
        rotate: index % 2 === 0 ? -16 - (index % 3) * 8 : 14 + (index % 4) * 5,
        delay: index * 0.13,
      })),
    [game.slug],
  );
  const battleSmoke = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => ({
        id: `${game.slug}-battle-smoke-${index}`,
        left: `${4 + ((index * 21) % 86)}%`,
        bottom: `${-4 + (index % 4) * 9}%`,
        size: 130 + (index % 4) * 54,
        delay: index * 0.35,
      })),
    [game.slug],
  );
  const entities = useMemo<WorldEntity[]>(() => {
    if (isSpace) {
      return [
        { id: `${game.slug}-probe-a`, kind: "probe", left: "7%", top: "24%", size: 86, driftX: "9vw", driftY: "-4vh", delay: 0.1, duration: 8.5, rotate: -12, opacity: 0.72 },
        { id: `${game.slug}-drone-b`, kind: "drone", left: "78%", top: "18%", size: 72, driftX: "-7vw", driftY: "6vh", delay: 0.6, duration: 9.8, rotate: 10, opacity: 0.62 },
        { id: `${game.slug}-debris-c`, kind: "debris", left: "16%", top: "72%", size: 24, driftX: "12vw", driftY: "-8vh", delay: 0.3, duration: 7.2, rotate: 24, opacity: 0.64 },
        { id: `${game.slug}-satellite-d`, kind: "satellite", left: "70%", top: "68%", size: 116, driftX: "-10vw", driftY: "-5vh", delay: 1, duration: 11, rotate: -18, opacity: 0.5 },
        { id: `${game.slug}-debris-e`, kind: "debris", left: "49%", top: "84%", size: 18, driftX: "-8vw", driftY: "-10vh", delay: 1.4, duration: 6.5, rotate: 44, opacity: 0.56 },
      ];
    }

    if (isNether) {
      return [
        { id: `${game.slug}-rune-a`, kind: "rune-shard", left: "16%", top: "22%", size: 34, driftX: "2vw", driftY: "-8vh", delay: 0.2, duration: 7.6, rotate: -16, opacity: 0.72 },
        { id: `${game.slug}-rune-b`, kind: "rune-shard", left: "76%", top: "32%", size: 28, driftX: "-4vw", driftY: "7vh", delay: 0.8, duration: 8.8, rotate: 18, opacity: 0.62 },
        { id: `${game.slug}-relic-c`, kind: "relic", left: "7%", top: "58%", size: 44, driftX: "3vw", driftY: "-5vh", delay: 0.4, duration: 8.2, rotate: -9, opacity: 0.68 },
        { id: `${game.slug}-relic-d`, kind: "relic", left: "83%", top: "55%", size: 38, driftX: "-3vw", driftY: "-6vh", delay: 0.7, duration: 7.8, rotate: 12, opacity: 0.6 },
        { id: `${game.slug}-stone-e`, kind: "stone-fragment", left: "21%", top: "82%", size: 42, driftX: "4vw", driftY: "-4vh", delay: 0.3, duration: 9.6, rotate: 20, opacity: 0.58 },
        { id: `${game.slug}-stone-f`, kind: "stone-fragment", left: "67%", top: "13%", size: 34, driftX: "-4vw", driftY: "5vh", delay: 1.1, duration: 8.9, rotate: -26, opacity: 0.52 },
        { id: `${game.slug}-ember-c`, kind: "ember", left: "28%", top: "70%", size: 10, driftX: "5vw", driftY: "-18vh", delay: 0.1, duration: 5.4, rotate: 0, opacity: 0.74 },
        { id: `${game.slug}-ember-d`, kind: "ember", left: "64%", top: "78%", size: 12, driftX: "-6vw", driftY: "-16vh", delay: 0.5, duration: 5.9, rotate: 0, opacity: 0.68 },
      ];
    }

    if (isOrbital) {
      return [
        { id: `${game.slug}-mech-a`, kind: "mech", left: "8%", top: "47%", size: 104, driftX: "3vw", driftY: "-2vh", delay: 0.2, duration: 9.8, rotate: -5, opacity: 0.72 },
        { id: `${game.slug}-mech-b`, kind: "mech", left: "74%", top: "58%", size: 82, driftX: "-3vw", driftY: "-3vh", delay: 0.8, duration: 10.5, rotate: 8, opacity: 0.58 },
        { id: `${game.slug}-alien-c`, kind: "alien", left: "66%", top: "24%", size: 118, driftX: "-5vw", driftY: "3vh", delay: 0.5, duration: 9.4, rotate: 11, opacity: 0.72 },
        { id: `${game.slug}-alien-d`, kind: "alien", left: "18%", top: "20%", size: 74, driftX: "5vw", driftY: "4vh", delay: 0.9, duration: 8.7, rotate: -13, opacity: 0.52 },
        { id: `${game.slug}-drone-e`, kind: "drone", left: "39%", top: "16%", size: 62, driftX: "8vw", driftY: "5vh", delay: 0.2, duration: 7.2, rotate: -8, opacity: 0.68 },
        { id: `${game.slug}-laser-f`, kind: "laser", left: "29%", top: "43%", size: 82, driftX: "10vw", driftY: "-2vh", delay: 0.1, duration: 2.8, rotate: -18, opacity: 0.76 },
        { id: `${game.slug}-smoke-g`, kind: "smoke", left: "56%", top: "72%", size: 160, driftX: "-4vw", driftY: "-6vh", delay: 0.4, duration: 11, rotate: 0, opacity: 0.36 },
        { id: `${game.slug}-debris-h`, kind: "debris", left: "52%", top: "79%", size: 26, driftX: "-10vw", driftY: "-5vh", delay: 0.6, duration: 8, rotate: 40, opacity: 0.52 },
        { id: `${game.slug}-spark-i`, kind: "spark", left: "47%", top: "35%", size: 8, driftX: "6vw", driftY: "8vh", delay: 0.3, duration: 4.8, rotate: 0, opacity: 0.84 },
      ];
    }

    return [
      { id: `${game.slug}-default-probe`, kind: "probe", left: "18%", top: "28%", size: 76, driftX: "5vw", driftY: "-3vh", delay: 0.2, duration: 9, rotate: -8, opacity: 0.58 },
      { id: `${game.slug}-default-debris`, kind: "debris", left: "76%", top: "68%", size: 24, driftX: "-6vw", driftY: "-6vh", delay: 0.4, duration: 8, rotate: 14, opacity: 0.54 },
    ];
  }, [game.slug, isNether, isOrbital, isSpace]);
  const fragments = useMemo(
    () =>
      (isSpace
        ? ["SIG", "TRACE", "NULL", "A1", "DRIFT", "ECHO", "SCAN", "LOST"]
        : isNether
          ? ["RUNE", "SEAL", "RELIC", "GATE", "ALTAR", "WARD", "ASH", "DEEP"]
          : isOrbital
            ? ["MECH", "DRONE", "ALIEN", "FIRE", "BREACH", "E-9", "SPARK", "LOCK"]
            : ["ORBIT", "GRID", "LOCK", "BAY", "SYNC"]
      ).map((label, index) => ({
        id: `${game.slug}-data-${label}-${index}`,
        label,
        left: `${8 + ((index * 13) % 84)}%`,
        top: `${14 + ((index * 17) % 72)}%`,
        delay: index * 0.42,
      })),
    [game.slug, isNether, isOrbital, isSpace],
  );

  const baseBackground = getWorldBaseBackground(theme);

  if (reducedMotion) {
    return (
      <div
        data-portal-world
        data-world-scene={sceneKind}
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
        style={{ background: baseBackground }}
        aria-hidden="true"
      />
    );
  }

  if (isMobile) {
    return (
      <div
        data-portal-world
        data-world-scene={sceneKind}
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
        aria-hidden="true"
      >
        <style>
          {`
            @keyframes engg-world-star {
              0%, 100% { transform: translate3d(0, 0, 0); opacity: var(--star-low); }
              50% { transform: translate3d(var(--star-x), var(--star-y), 0); opacity: var(--star-high); }
            }

            @keyframes engg-world-entity {
              0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--entity-rotate)); opacity: 0.44; }
              50% { transform: translate3d(var(--entity-x), var(--entity-y), 0) rotate(calc(var(--entity-rotate) + 10deg)); opacity: 0.92; }
            }

            @keyframes engg-world-data {
              0%, 100% { transform: translate3d(var(--data-start), 0, 0); opacity: 0; }
              42%, 58% { opacity: 0.62; }
              50% { transform: translate3d(var(--data-end), 0, 0); }
            }

            @keyframes engg-world-scanline {
              0%, 100% { transform: translate3d(-16vw, 0, 0); opacity: 0; }
              45% { opacity: 0.72; }
              65% { transform: translate3d(18vw, 0, 0); opacity: 0; }
            }

            @keyframes engg-world-particle {
              0%, 100% { transform: translate3d(0, 0, 0); opacity: 0; }
              50% { transform: translate3d(var(--particle-x), var(--particle-y), 0); opacity: var(--particle-opacity); }
            }

            @keyframes engg-ruin-rune {
              0%, 100% { transform: translate3d(0, 0, 0) scale(0.9); opacity: 0.18; filter: blur(0.2px); }
              48% { transform: translate3d(0, -12px, 0) scale(1.08); opacity: 0.86; filter: blur(0); }
            }

            @keyframes engg-ruin-fragment {
              0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--fragment-rotate)); opacity: var(--fragment-low); }
              50% { transform: translate3d(var(--fragment-x), -18px, 0) rotate(calc(var(--fragment-rotate) + 8deg)); opacity: var(--fragment-high); }
            }

            @keyframes engg-arcane-beam {
              0%, 100% { transform: translate3d(-10vw, 0, 0) rotate(var(--beam-rotate)); opacity: 0; }
              45% { opacity: 0.72; }
              68% { transform: translate3d(10vw, -3vh, 0) rotate(var(--beam-rotate)); opacity: 0; }
            }

            @keyframes engg-battle-laser {
              0%, 100% { transform: translate3d(var(--laser-start), 0, 0) rotate(var(--laser-rotate)); opacity: 0; }
              18%, 36% { opacity: 0.86; }
              52% { transform: translate3d(var(--laser-end), -2vh, 0) rotate(var(--laser-rotate)); opacity: 0; }
            }

            @keyframes engg-smoke-drift {
              0%, 100% { transform: translate3d(0, 0, 0) scale(0.95); opacity: 0.18; }
              50% { transform: translate3d(3vw, -5vh, 0) scale(1.12); opacity: 0.38; }
            }

            @keyframes engg-battle-spark {
              0%, 100% { transform: translate3d(0, 0, 0) scaleX(0.25); opacity: 0; }
              42% { transform: translate3d(var(--spark-x), var(--spark-y), 0) scaleX(1); opacity: 0.9; }
              70% { opacity: 0; }
            }
          `}
        </style>
        <div className="absolute inset-0">
          <WorldSceneLayer name="base" style={{ background: baseBackground }}>
            {null}
          </WorldSceneLayer>

          <WorldSceneLayer name={isSpace ? "starfield" : isNether ? "cave-dust" : "battlefield-sparks"}>
            {stars.map((star, index) => (
              <motion.span
                data-world-star
                key={star.id}
                className={cn(
                  "absolute rounded-full",
                  isSpace ? "bg-white" : isNether ? "blur-[1px]" : "blur-[0.5px]",
                )}
                style={{
                  left: star.left,
                  top: star.top,
                  width: isSpace ? star.size : isNether ? star.size * 1.4 : star.size * 1.8,
                  height: isSpace ? star.size : isNether ? star.size * 1.4 : star.size * 0.65,
                  opacity: star.opacity,
                  backgroundColor: isSpace ? undefined : isNether ? "rgba(245,158,11,0.58)" : index % 2 ? "rgba(34,211,238,0.62)" : "rgba(245,158,11,0.7)",
                  boxShadow: isSpace
                    ? "0 0 10px rgba(180,230,255,0.75)"
                    : isNether
                      ? `0 0 10px rgba(245,158,11,0.42), 0 0 18px ${theme.accent}3d`
                      : `0 0 10px ${index % 2 ? "rgba(34,211,238,0.65)" : `${theme.accent}77`}`,
                  "--star-x": isSpace ? star.drift : isNether ? (index % 2 ? "5px" : "-5px") : (index % 2 ? "18px" : "-18px"),
                  "--star-y": isSpace ? "28px" : isNether ? "-26px" : index % 2 ? "16px" : "-16px",
                  "--star-low": `${star.opacity * (isSpace ? 0.45 : 0.22)}`,
                  "--star-high": `${star.opacity * (isSpace ? 1 : 0.7)}`,
                  animation: `engg-world-star ${isNether ? 7.4 : isSpace ? 5.8 + (star.size % 2) : 3.8 + (index % 4) * 0.3}s ease-in-out ${star.delay}s infinite`,
                } as CSSProperties}
              />
            ))}
          </WorldSceneLayer>

          <WorldSceneLayer name="entities">
            {entities.map((entity) => (
              <AmbientEntity key={entity.id} entity={entity} accent={theme.accent} reducedMotion={reducedMotion} />
            ))}
          </WorldSceneLayer>

          <WorldSceneLayer name="data-fragments">
            {fragments.map((fragment, index) => (
              <motion.span
                data-world-data
                key={fragment.id}
                className="absolute font-mono text-[8px] uppercase tracking-[0.34em]"
                style={{
                  left: fragment.left,
                  top: fragment.top,
                  color: theme.accent,
                  textShadow: `0 0 16px ${theme.accent}`,
                  "--data-start": index % 2 ? "3vw" : "-3vw",
                  "--data-end": index % 2 ? "-7vw" : "7vw",
                  animation: `engg-world-data ${3.2 + (index % 3)}s ease-in-out ${fragment.delay}s infinite`,
                } as CSSProperties}
              >
                {fragment.label}
              </motion.span>
            ))}
          </WorldSceneLayer>
        </div>
      </div>
    );
  }

  return (
    <div
      data-portal-world
      data-world-scene={sceneKind}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes engg-world-star {
            0%, 100% { transform: translate3d(0, 0, 0); opacity: var(--star-low); }
            50% { transform: translate3d(var(--star-x), var(--star-y), 0); opacity: var(--star-high); }
          }

          @keyframes engg-world-entity {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--entity-rotate)); opacity: 0.44; }
            50% { transform: translate3d(var(--entity-x), var(--entity-y), 0) rotate(calc(var(--entity-rotate) + 10deg)); opacity: 0.92; }
          }

          @keyframes engg-world-data {
            0%, 100% { transform: translate3d(var(--data-start), 0, 0); opacity: 0; }
            42%, 58% { opacity: 0.62; }
            50% { transform: translate3d(var(--data-end), 0, 0); }
          }

          @keyframes engg-world-scanline {
            0%, 100% { transform: translate3d(-16vw, 0, 0); opacity: 0; }
            45% { opacity: 0.72; }
            65% { transform: translate3d(18vw, 0, 0); opacity: 0; }
          }

          @keyframes engg-world-particle {
            0%, 100% { transform: translate3d(0, 0, 0); opacity: 0; }
            50% { transform: translate3d(var(--particle-x), var(--particle-y), 0); opacity: var(--particle-opacity); }
          }

          @keyframes engg-ruin-rune {
            0%, 100% { transform: translate3d(0, 0, 0) scale(0.9); opacity: 0.18; filter: blur(0.2px); }
            48% { transform: translate3d(0, -12px, 0) scale(1.08); opacity: 0.86; filter: blur(0); }
          }

          @keyframes engg-ruin-fragment {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--fragment-rotate)); opacity: var(--fragment-low); }
            50% { transform: translate3d(var(--fragment-x), -18px, 0) rotate(calc(var(--fragment-rotate) + 8deg)); opacity: var(--fragment-high); }
          }

          @keyframes engg-arcane-beam {
            0%, 100% { transform: translate3d(-10vw, 0, 0) rotate(var(--beam-rotate)); opacity: 0; }
            45% { opacity: 0.72; }
            68% { transform: translate3d(10vw, -3vh, 0) rotate(var(--beam-rotate)); opacity: 0; }
          }

          @keyframes engg-battle-laser {
            0%, 100% { transform: translate3d(var(--laser-start), 0, 0) rotate(var(--laser-rotate)); opacity: 0; }
            18%, 36% { opacity: 0.86; }
            52% { transform: translate3d(var(--laser-end), -2vh, 0) rotate(var(--laser-rotate)); opacity: 0; }
          }

          @keyframes engg-smoke-drift {
            0%, 100% { transform: translate3d(0, 0, 0) scale(0.95); opacity: 0.18; }
            50% { transform: translate3d(3vw, -5vh, 0) scale(1.12); opacity: 0.38; }
          }

          @keyframes engg-battle-spark {
            0%, 100% { transform: translate3d(0, 0, 0) scaleX(0.25); opacity: 0; }
            42% { transform: translate3d(var(--spark-x), var(--spark-y), 0) scaleX(1); opacity: 0.9; }
            70% { opacity: 0; }
          }
        `}
      </style>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`world-scene-${game.slug}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
        >
          <WorldSceneLayer name="base" style={{ background: baseBackground }}>
            {null}
          </WorldSceneLayer>

          <WorldSceneLayer name={isSpace ? "starfield" : isNether ? "cave-dust" : "battlefield-sparks"}>
            {stars.map((star, index) => (
              <motion.span
                data-world-star
                key={star.id}
                className={cn(
                  "absolute rounded-full",
                  isSpace ? "bg-white" : isNether ? "blur-[1px]" : "blur-[0.5px]",
                )}
                style={{
                  left: star.left,
                  top: star.top,
                  width: isSpace ? star.size : isNether ? star.size * 1.4 : star.size * 1.8,
                  height: isSpace ? star.size : isNether ? star.size * 1.4 : star.size * 0.65,
                  opacity: star.opacity,
                  backgroundColor: isSpace ? undefined : isNether ? "rgba(245,158,11,0.58)" : index % 2 ? "rgba(34,211,238,0.62)" : "rgba(245,158,11,0.7)",
                  boxShadow: isSpace
                    ? "0 0 10px rgba(180,230,255,0.75)"
                    : isNether
                      ? `0 0 10px rgba(245,158,11,0.42), 0 0 18px ${theme.accent}3d`
                      : `0 0 10px ${index % 2 ? "rgba(34,211,238,0.65)" : `${theme.accent}77`}`,
                  "--star-x": isSpace ? star.drift : isNether ? (index % 2 ? "5px" : "-5px") : (index % 2 ? "18px" : "-18px"),
                  "--star-y": isSpace ? "28px" : isNether ? "-26px" : index % 2 ? "16px" : "-16px",
                  "--star-low": `${star.opacity * (isSpace ? 0.45 : 0.22)}`,
                  "--star-high": `${star.opacity * (isSpace ? 1 : 0.7)}`,
                  animation: reducedMotion || isTransitionActive
                    ? undefined
                    : `engg-world-star ${isNether ? 7.4 : isSpace ? 5.8 + (star.size % 2) : 3.8 + (index % 4) * 0.3}s ease-in-out ${star.delay}s infinite`,
                } as CSSProperties}
              />
            ))}
          </WorldSceneLayer>

          {motionProfile === "desktop" && isSpace && (
            <WorldSceneLayer name="space-anomaly">
              <motion.div
                data-world-planet
                className="absolute left-1/2 bottom-[-38vh] h-[58vh] w-[138vw] -translate-x-1/2 rounded-[50%_50%_0_0] border-t"
                style={{
                  borderColor: `${theme.accent}55`,
                  background: `radial-gradient(ellipse at 50% 0%, ${theme.accent}30, transparent 34%), linear-gradient(180deg, rgba(8,22,40,0.88), rgba(0,3,10,0.98) 58%)`,
                  boxShadow: `0 -34px 120px ${theme.accent}24`,
                }}
                animate={reducedMotion || isTransitionActive ? undefined : { y: ["1vh", "-1vh", "1vh"], opacity: [0.78, 0.92, 0.78] }}
                transition={{ duration: 8, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
              />
              <motion.div
                data-world-anomaly
                className="absolute left-1/2 top-[8vh] h-[42vh] w-[min(54vw,640px)] -translate-x-1/2 opacity-45 blur-[1px]"
                animate={reducedMotion || isTransitionActive ? undefined : { y: ["0vh", "1.8vh", "0vh"], scale: [1, 1.025, 1] }}
                transition={{ duration: 7.5, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
              >
                <span
                  className="absolute left-1/2 top-0 h-[72%] w-[36%] -translate-x-1/2 rounded-[48%] bg-black/70"
                  style={{ boxShadow: `0 0 80px rgba(0,0,0,0.9), inset 0 0 44px ${theme.accent}18` }}
                />
                <span className="absolute left-[43%] top-[26%] h-2 w-7 rounded-full" style={{ backgroundColor: `${theme.accent}8a`, boxShadow: `0 0 22px ${theme.accent}` }} />
                <span className="absolute right-[43%] top-[26%] h-2 w-7 rounded-full" style={{ backgroundColor: `${theme.accent}8a`, boxShadow: `0 0 22px ${theme.accent}` }} />
                <span className="absolute bottom-0 left-1/2 h-[42%] w-[78%] -translate-x-1/2 rounded-t-full bg-black/55 blur-xl" />
              </motion.div>
            </WorldSceneLayer>
          )}

          {motionProfile === "desktop" && isNether && (
            <WorldSceneLayer name="nether-depths">
              <div
                data-world-ruin-cavern
                className="absolute inset-0 opacity-80"
                style={{
                  background: `radial-gradient(ellipse at 50% 38%, ${theme.accent}20, transparent 30%), radial-gradient(ellipse at 50% 88%, rgba(245,158,11,0.17), transparent 36%), linear-gradient(90deg, rgba(0,0,0,0.72), transparent 30%, transparent 70%, rgba(0,0,0,0.72))`,
                }}
              />
              <div data-world-cave-shell className="absolute inset-0" aria-hidden="true">
                <span
                  data-world-cave-ceiling
                  className="absolute left-1/2 top-[-18vh] h-[34vh] w-[116vw] -translate-x-1/2 bg-black/80"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% 50%, 86% 63%, 76% 48%, 66% 70%, 55% 45%, 44% 64%, 32% 46%, 22% 68%, 10% 50%, 0 64%)",
                    boxShadow: `0 30px 90px rgba(0,0,0,0.86), inset 0 -18px 52px ${theme.accent}17`,
                  }}
                />
                <span
                  data-world-cave-wall="left"
                  className="absolute bottom-[-6vh] left-[-12vw] h-[98vh] w-[32vw] bg-black/72"
                  style={{
                    clipPath: "polygon(0 0, 64% 0, 82% 18%, 62% 34%, 86% 54%, 58% 74%, 70% 100%, 0 100%)",
                    boxShadow: `22px 0 80px rgba(0,0,0,0.72), inset -18px 0 38px ${theme.accent}12`,
                  }}
                />
                <span
                  data-world-cave-wall="right"
                  className="absolute bottom-[-6vh] right-[-12vw] h-[98vh] w-[32vw] bg-black/72"
                  style={{
                    clipPath: "polygon(36% 0, 100% 0, 100% 100%, 30% 100%, 42% 76%, 14% 54%, 38% 34%, 18% 18%)",
                    boxShadow: `-22px 0 80px rgba(0,0,0,0.72), inset 18px 0 38px ${theme.accent}12`,
                  }}
                />
                {[8, 22, 39, 57, 73, 88].map((left, index) => (
                  <span
                    data-world-stalactite
                    key={`${game.slug}-stalactite-${left}`}
                    className="absolute top-[5vh] bg-black/75"
                    style={{
                      left: `${left}%`,
                      width: `${28 + (index % 3) * 18}px`,
                      height: `${80 + (index % 4) * 36}px`,
                      clipPath: "polygon(0 0, 100% 0, 54% 100%)",
                      boxShadow: `0 10px 24px rgba(0,0,0,0.7), inset 0 -12px 18px ${theme.accent}14`,
                      transform: `rotate(${-5 + index * 2}deg)`,
                    }}
                  />
                ))}
                {[18, 30, 42, 57, 69, 82].map((left, index) => (
                  <span
                    data-world-engraved-wall
                    key={`${game.slug}-engraved-wall-${left}`}
                    className="absolute h-[1px] w-[18vw] max-w-[220px]"
                    style={{
                      left: `${left}%`,
                      top: `${23 + (index % 4) * 13}%`,
                      background: `linear-gradient(90deg, transparent, rgba(245,158,11,0.26), ${theme.accent}55, transparent)`,
                      boxShadow: `0 0 16px ${theme.accent}33`,
                      transform: `rotate(${-16 + index * 7}deg)`,
                    }}
                  />
                ))}
              </div>
              <motion.div
                data-world-ruin-gate
                className="absolute left-1/2 top-[13vh] h-[68vh] w-[min(104vw,860px)] -translate-x-1/2"
                animate={reducedMotion || isTransitionActive ? undefined : { y: ["0vh", "-1.2vh", "0vh"], opacity: [0.78, 0.98, 0.78] }}
                transition={{ duration: 7.4, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
              >
                <span
                  data-world-ruin-arch
                  className="absolute left-1/2 top-0 h-[76%] w-[58%] -translate-x-1/2 border-t border-l border-r"
                  style={{
                    borderColor: `${theme.accent}59`,
                    borderTopLeftRadius: "48% 34%",
                    borderTopRightRadius: "48% 34%",
                    boxShadow: `0 -16px 80px ${theme.accent}33, inset 0 0 48px rgba(245,158,11,0.08)`,
                    background: `radial-gradient(ellipse at 50% 36%, transparent 28%, ${theme.accent}10 42%, rgba(0,0,0,0.64) 78%)`,
                  }}
                />
                <span
                  data-world-ruin-arch
                  className="absolute left-1/2 top-[8%] h-[62%] w-[40%] -translate-x-1/2 border-t border-l border-r"
                  style={{
                    borderColor: "rgba(245,158,11,0.35)",
                    borderTopLeftRadius: "50% 38%",
                    borderTopRightRadius: "50% 38%",
                    boxShadow: `0 0 56px ${theme.accent}2e`,
                  }}
                />
                {[
                  { side: "left", left: "6%", height: "70%", top: "22%", lean: "-7deg" },
                  { side: "left", left: "18%", height: "86%", top: "9%", lean: "4deg" },
                  { side: "left", left: "29%", height: "58%", top: "34%", lean: "-4deg" },
                  { side: "right", left: "85%", height: "72%", top: "20%", lean: "7deg" },
                  { side: "right", left: "72%", height: "84%", top: "11%", lean: "-3deg" },
                  { side: "right", left: "60%", height: "54%", top: "38%", lean: "4deg" },
                ].map((pillar, index) => (
                  <span
                    data-world-ruin-pillar={pillar.side}
                    key={`${game.slug}-pillar-${index}`}
                    className="absolute w-[clamp(24px,4vw,46px)] border bg-black/55"
                    style={{
                      left: pillar.left,
                      top: pillar.top,
                      height: pillar.height,
                      borderColor: index % 2 ? `${theme.accent}44` : "rgba(245,158,11,0.24)",
                      boxShadow: `0 0 30px ${theme.accent}20, inset 0 0 18px rgba(245,158,11,0.07)`,
                      transform: `rotate(${pillar.lean})`,
                      clipPath: "polygon(18% 0, 86% 0, 100% 100%, 0 100%)",
                    }}
                  >
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
                    <span
                      className="absolute left-0 right-0 top-[26%] h-px"
                      style={{ backgroundColor: index % 2 ? `${theme.accent}5c` : "rgba(245,158,11,0.42)" }}
                    />
                    <span
                      className="absolute left-0 right-0 top-[58%] h-px"
                      style={{ backgroundColor: index % 2 ? `${theme.accent}48` : "rgba(245,158,11,0.32)" }}
                    />
                  </span>
                ))}
                <motion.span
                  data-world-ritual-ring
                  className="absolute left-1/2 top-[47%] h-[min(32vw,220px)] w-[min(32vw,220px)] -translate-x-1/2 -translate-y-1/2 rounded-full border"
                  style={{
                    borderColor: `${theme.accent}70`,
                    boxShadow: `0 0 56px ${theme.accent}4a, inset 0 0 42px rgba(245,158,11,0.12)`,
                  }}
                  animate={reducedMotion || isTransitionActive ? undefined : { rotate: 360, scale: [0.96, 1.04, 0.96] }}
                  transition={{
                    rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                    scale: { duration: 5.8, repeat: Infinity, ease: "easeInOut" },
                  }}
                />
                <span
                  data-world-ritual-ring
                  className="absolute left-1/2 top-[47%] h-[min(18vw,132px)] w-[min(18vw,132px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
                  style={{ borderColor: "rgba(245,158,11,0.42)", boxShadow: `0 0 36px ${theme.accent}30` }}
                />
              </motion.div>

              {ruinRunes.map((rune) => (
                <span
                  data-world-rune
                  key={rune.id}
                  className="absolute font-mono font-bold uppercase tracking-[0.18em] text-white/70"
                  style={{
                    left: rune.left,
                    top: rune.top,
                    fontSize: rune.size,
                    color: rune.label.length > 3 ? "rgba(245,158,11,0.82)" : theme.accent,
                    textShadow: `0 0 18px ${theme.accent}, 0 0 34px rgba(245,158,11,0.35)`,
                    animation: reducedMotion || isTransitionActive ? undefined : `engg-ruin-rune ${3.4 + (rune.size % 5)}s ease-in-out ${rune.delay}s infinite`,
                  }}
                >
                  {rune.label}
                </span>
              ))}

              {ruinFragments.map((fragment, index) => (
                <span
                  data-world-ruin-fragment
                  key={fragment.id}
                  className="absolute border bg-black/45"
                  style={{
                    left: fragment.left,
                    top: fragment.top,
                    width: fragment.width,
                    height: fragment.height,
                    borderColor: index % 3 === 0 ? "rgba(245,158,11,0.28)" : `${theme.accent}3d`,
                    boxShadow: `0 0 18px ${theme.accent}24`,
                    clipPath: "polygon(8% 20%, 88% 0, 100% 68%, 58% 100%, 0 76%)",
                    "--fragment-rotate": `${fragment.rotate}deg`,
                    "--fragment-x": index % 2 ? "-3vw" : "3vw",
                    "--fragment-low": `${fragment.opacity}`,
                    "--fragment-high": `${fragment.opacity + 0.28}`,
                    animation: reducedMotion || isTransitionActive ? undefined : `engg-ruin-fragment ${6.2 + (index % 4)}s ease-in-out ${fragment.delay}s infinite`,
                  } as CSSProperties}
                />
              ))}

              {[-16, -7, 5, 14].map((rotate, index) => (
                <span
                  data-world-arcane-beam
                  key={`${game.slug}-arcane-beam-${rotate}`}
                  className="absolute left-[12%] top-[24%] h-[2px] w-[78vw] origin-center rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(245,158,11,0.42), ${theme.accent}b8, transparent)`,
                    boxShadow: `0 0 22px ${theme.accent}66`,
                    "--beam-rotate": `${rotate}deg`,
                    animation: reducedMotion || isTransitionActive ? undefined : `engg-arcane-beam ${3.8 + index * 0.42}s ease-in-out ${index * 0.38}s infinite`,
                  } as CSSProperties}
                />
              ))}

              <motion.div
                data-world-chasm
                className="absolute -bottom-[24vh] left-1/2 h-[46vh] w-[120vw] -translate-x-1/2 rounded-[50%_50%_0_0]"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${theme.accent}40, transparent 30%), linear-gradient(180deg, rgba(30,4,38,0.85), rgba(3,1,5,0.98))`,
                  boxShadow: `0 -26px 110px ${theme.accent}2e`,
                }}
                animate={reducedMotion || isTransitionActive ? undefined : { y: ["0vh", "-1.4vh", "0vh"], opacity: [0.76, 0.96, 0.76] }}
                transition={{ duration: 6.8, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
              />
            </WorldSceneLayer>
          )}

          {motionProfile === "desktop" && isOrbital && (
            <WorldSceneLayer name="orbital-lock">
              <div
                data-world-battlefield
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, rgba(8,47,73,0.28), transparent 38%, rgba(127,29,29,0.22)), radial-gradient(ellipse at 50% 70%, ${theme.accent}18, transparent 36%)`,
                }}
              />
              <div data-world-battle-terrain className="absolute inset-0" aria-hidden="true">
                <span
                  data-world-outpost-silhouette
                  className="absolute bottom-[20vh] left-[6vw] h-[34vh] w-[34vw] max-w-[470px] bg-black/70"
                  style={{
                    clipPath: "polygon(0 100%, 0 42%, 10% 42%, 10% 24%, 18% 24%, 18% 54%, 30% 54%, 30% 12%, 40% 12%, 40% 60%, 54% 60%, 54% 32%, 64% 32%, 64% 100%)",
                    boxShadow: "18px 0 70px rgba(0,0,0,0.72), inset 0 0 24px rgba(34,211,238,0.12)",
                  }}
                />
                <span
                  data-world-outpost-silhouette
                  className="absolute bottom-[18vh] right-[2vw] h-[30vh] w-[36vw] max-w-[520px] bg-black/72"
                  style={{
                    clipPath: "polygon(26% 100%, 26% 48%, 34% 48%, 34% 30%, 44% 30%, 44% 60%, 56% 60%, 56% 16%, 67% 16%, 67% 42%, 76% 42%, 76% 100%)",
                    boxShadow: "-18px 0 70px rgba(0,0,0,0.72), inset 0 0 24px rgba(245,158,11,0.12)",
                  }}
                />
                {[
                  { left: "14%", bottom: "15%", width: "18vw", rotate: "-8deg" },
                  { left: "42%", bottom: "13%", width: "24vw", rotate: "5deg" },
                  { left: "68%", bottom: "16%", width: "18vw", rotate: "-4deg" },
                ].map((beam, index) => (
                  <span
                    data-world-wreckage-beam
                    key={`${game.slug}-wreckage-beam-${index}`}
                    className="absolute h-[12px] bg-black/82"
                    style={{
                      left: beam.left,
                      bottom: beam.bottom,
                      width: beam.width,
                      rotate: beam.rotate,
                      borderTop: `1px solid ${index % 2 ? theme.accent : "rgba(34,211,238,0.5)"}`,
                      boxShadow: `0 0 22px ${index % 2 ? theme.accent : "rgba(34,211,238,0.38)"}`,
                    }}
                  />
                ))}
              </div>
              <motion.div
                data-world-breach-line
                className="absolute left-1/2 top-[12vh] h-[78vh] w-px -translate-x-1/2"
                style={{
                  background: `linear-gradient(180deg, transparent, ${theme.accent}aa, rgba(34,211,238,0.42), transparent)`,
                  boxShadow: `0 0 42px ${theme.accent}66, 0 0 90px rgba(34,211,238,0.26)`,
                }}
                animate={reducedMotion || isTransitionActive ? undefined : { scaleY: [0.84, 1.08, 0.84], opacity: [0.38, 0.86, 0.38] }}
                transition={{ duration: 3.8, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
              />

              {battleLasers.map((laser, index) => (
                <span
                  data-world-laser
                  key={laser.id}
                  className="absolute h-[2px] origin-left rounded-full"
                  style={{
                    left: laser.left,
                    top: laser.top,
                    width: laser.width,
                    background:
                      index % 2 === 0
                        ? "linear-gradient(90deg, transparent, rgba(34,211,238,0.95), rgba(255,255,255,0.86), transparent)"
                        : `linear-gradient(90deg, transparent, ${theme.accent}, rgba(255,255,255,0.72), transparent)`,
                    boxShadow:
                      index % 2 === 0
                        ? "0 0 18px rgba(34,211,238,0.88), 0 0 34px rgba(34,211,238,0.42)"
                        : `0 0 18px ${theme.accent}, 0 0 34px ${theme.accent}66`,
                    "--laser-rotate": `${laser.rotate}deg`,
                    "--laser-start": index % 2 === 0 ? "-10vw" : "8vw",
                    "--laser-end": index % 2 === 0 ? "18vw" : "-18vw",
                    animation: reducedMotion || isTransitionActive ? undefined : `engg-battle-laser ${2.2 + (index % 4) * 0.34}s ease-out ${laser.delay}s infinite`,
                  } as CSSProperties}
                />
              ))}

              <motion.div
                data-world-mech-army
                className="absolute left-[-4vw] bottom-[10vh] h-[36vh] w-[36vw] max-w-[460px]"
                animate={reducedMotion || isTransitionActive ? undefined : { x: ["0vw", "1.4vw", "0vw"], opacity: [0.72, 0.95, 0.72] }}
                transition={{ duration: 5.8, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
              >
                <span
                  data-world-mech
                  className="absolute bottom-0 left-[18%] h-[82%] w-[36%] border bg-black/78"
                  style={{
                    borderColor: "rgba(34,211,238,0.42)",
                    clipPath: "polygon(26% 0, 70% 0, 86% 38%, 78% 100%, 18% 100%, 10% 38%)",
                    boxShadow: "0 0 42px rgba(34,211,238,0.24), inset 0 0 24px rgba(34,211,238,0.14)",
                  }}
                />
                <span className="absolute bottom-[54%] left-[46%] h-[7%] w-[50%]" style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.95), transparent)", boxShadow: "0 0 18px rgba(34,211,238,0.75)" }} />
                <span className="absolute bottom-0 left-[28%] h-[38%] w-[8%] bg-black/90" style={{ boxShadow: "0 0 14px rgba(34,211,238,0.34)" }} />
                <span className="absolute bottom-0 left-[54%] h-[42%] w-[8%] bg-black/90" style={{ boxShadow: "0 0 14px rgba(34,211,238,0.34)" }} />
              </motion.div>

              <motion.div
                data-world-alien-front
                className="absolute right-[-5vw] top-[17vh] h-[38vh] w-[39vw] max-w-[520px]"
                animate={reducedMotion || isTransitionActive ? undefined : { x: ["0vw", "-1.8vw", "0vw"], y: ["0vh", "1.1vh", "0vh"], opacity: [0.72, 0.96, 0.72] }}
                transition={{ duration: 5.2, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
              >
                <span
                  data-world-alien
                  className="absolute right-[18%] top-[16%] h-[64%] w-[48%] border bg-black/78"
                  style={{
                    borderColor: `${theme.accent}69`,
                    clipPath: "polygon(10% 48%, 24% 8%, 70% 0, 98% 36%, 82% 86%, 30% 100%)",
                    boxShadow: `0 0 48px ${theme.accent}38, inset 0 0 26px ${theme.accent}1f`,
                  }}
                />
                <span className="absolute right-[42%] top-[43%] h-2 w-8 rounded-full" style={{ backgroundColor: theme.accent, boxShadow: `0 0 20px ${theme.accent}` }} />
                <span className="absolute right-[24%] top-[46%] h-2 w-8 rounded-full" style={{ backgroundColor: theme.accent, boxShadow: `0 0 20px ${theme.accent}` }} />
                <span className="absolute right-[54%] top-[72%] h-[34%] w-[2px] origin-top rotate-[28deg]" style={{ backgroundColor: `${theme.accent}75`, boxShadow: `0 0 14px ${theme.accent}` }} />
                <span className="absolute right-[18%] top-[70%] h-[36%] w-[2px] origin-top -rotate-[24deg]" style={{ backgroundColor: `${theme.accent}75`, boxShadow: `0 0 14px ${theme.accent}` }} />
              </motion.div>

              {battleSmoke.map((smoke) => (
                <span
                  data-world-smoke
                  key={smoke.id}
                  className="absolute rounded-full blur-2xl"
                  style={{
                    left: smoke.left,
                    bottom: smoke.bottom,
                    width: smoke.size,
                    height: smoke.size * 0.58,
                    background: "radial-gradient(circle, rgba(255,255,255,0.16), rgba(245,158,11,0.13) 32%, rgba(0,0,0,0) 72%)",
                    animation: reducedMotion || isTransitionActive ? undefined : `engg-smoke-drift ${7.5 + (smoke.size % 5)}s ease-in-out ${smoke.delay}s infinite`,
                  }}
                />
              ))}

              {[18, 32, 48, 63, 76].map((top, index) => (
                <span
                  data-world-battle-spark
                  key={`${game.slug}-battle-spark-${index}`}
                  className="absolute h-[2px] w-20 origin-left rounded-full"
                  style={{
                    left: `${17 + index * 14}%`,
                    top: `${top}%`,
                    background: `linear-gradient(90deg, ${theme.accent}, rgba(255,255,255,0.7), transparent)`,
                    boxShadow: `0 0 18px ${theme.accent}`,
                    rotate: `${-30 + index * 14}deg`,
                    "--spark-x": index % 2 ? "-12vw" : "12vw",
                    "--spark-y": index % 2 ? "8vh" : "-7vh",
                    animation: reducedMotion || isTransitionActive ? undefined : `engg-battle-spark ${2.6 + index * 0.2}s ease-out ${index * 0.24}s infinite`,
                  } as CSSProperties}
                />
              ))}

              <motion.div
                data-world-wreckage
                className="absolute left-1/2 bottom-[-20vh] h-[40vh] w-[120vw] -translate-x-1/2 rounded-[50%_50%_0_0] border-t"
                style={{
                  borderColor: `${theme.accent}4f`,
                  background: `radial-gradient(ellipse at 35% 0%, rgba(34,211,238,0.15), transparent 30%), radial-gradient(ellipse at 64% 0%, ${theme.accent}24, transparent 34%), linear-gradient(180deg, rgba(35,19,12,0.82), rgba(2,2,4,0.98))`,
                  boxShadow: `0 -26px 100px ${theme.accent}20`,
                }}
                animate={reducedMotion || isTransitionActive ? undefined : { y: ["0vh", "-1.1vh", "0vh"], opacity: [0.76, 0.94, 0.76] }}
                transition={{ duration: 6.8, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut" }}
              />
            </WorldSceneLayer>
          )}

          <WorldSceneLayer name="entities">
            {entities.map((entity) => (
              <AmbientEntity key={entity.id} entity={entity} accent={theme.accent} reducedMotion={reducedMotion || isTransitionActive} />
            ))}
          </WorldSceneLayer>

          <WorldSceneLayer name="data-fragments">
            {fragments.map((fragment, index) => (
              <motion.span
                data-world-data
                key={fragment.id}
                className="absolute font-mono text-[8px] uppercase tracking-[0.34em]"
                style={{
                  left: fragment.left,
                  top: fragment.top,
                  color: theme.accent,
                  textShadow: `0 0 16px ${theme.accent}`,
                  "--data-start": index % 2 ? "3vw" : "-3vw",
                  "--data-end": index % 2 ? "-7vw" : "7vw",
                  animation: reducedMotion || isTransitionActive
                    ? undefined
                    : `engg-world-data ${3.2 + (index % 3)}s ease-in-out ${fragment.delay}s infinite`,
                } as CSSProperties}
              >
                {fragment.label}
              </motion.span>
            ))}
          </WorldSceneLayer>

          {motionProfile === "desktop" && (isSpace || isOrbital) && (
            <WorldSceneLayer name={isSpace ? "scanlines" : "combat-streaks"}>
              {[13, 28, 44, 61, 79].map((top, index) => (
                <motion.span
                  data-world-scanline
                  key={`${game.slug}-scanline-${top}`}
                  className="absolute -left-[14vw] h-px w-[128vw] rounded-full"
                  style={{
                    top: `${top}%`,
                    background: isSpace
                      ? `linear-gradient(90deg, transparent, ${theme.accent}99, transparent)`
                      : `linear-gradient(90deg, transparent, rgba(34,211,238,0.66), ${theme.accent}8c, transparent)`,
                    boxShadow: `0 0 20px ${theme.accent}66`,
                    rotate: isOrbital ? `${-10 + index * 5}deg` : undefined,
                    animation: reducedMotion || isTransitionActive ? undefined : `engg-world-scanline ${isSpace ? 2.8 : 2.25}s ease-in-out ${index * 0.5}s infinite`,
                  }}
                />
              ))}
            </WorldSceneLayer>
          )}

          <WorldSceneLayer name="foreground">
            {particles.map((particle, index) => (
              <motion.span
                data-world-particle
                key={particle.id}
                className={cn("absolute rounded-full", isNether ? "blur-[1px]" : "h-px")}
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: isNether ? 2 + (index % 5) * 2 : particle.width,
                  height: isNether ? 2 + (index % 4) * 2 : isOrbital && index % 4 === 0 ? 2 : undefined,
                  opacity: isNether ? particle.opacity * 0.75 : particle.opacity,
                  backgroundColor: isNether ? (index % 3 === 0 ? "rgba(245,158,11,0.88)" : theme.accent) : theme.accent,
                  boxShadow: isNether
                    ? `0 0 14px ${index % 3 === 0 ? "rgba(245,158,11,0.8)" : theme.accent}`
                    : `0 0 18px ${theme.accent}`,
                  "--particle-x": isNether ? (index % 2 ? "4vw" : "-4vw") : isOrbital ? (index % 2 ? "34vw" : "-34vw") : particle.drift,
                  "--particle-y": isNether ? `${-18 - (index % 6) * 7}vh` : isOrbital ? (index % 3 === 0 ? "-18vh" : "12vh") : particle.lift,
                  "--particle-opacity": `${isNether ? particle.opacity * 0.7 : particle.opacity}`,
                  animation: reducedMotion || isTransitionActive
                    ? undefined
                    : `engg-world-particle ${isNether ? 6.4 + (index % 4) * 0.4 : 4.4 + (particle.width % 5)}s ease-in-out ${particle.delay}s infinite`,
                } as CSSProperties}
              />
            ))}
          </WorldSceneLayer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
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
        className="absolute -inset-12 rounded-full border border-white/10 opacity-60"
        style={{ boxShadow: `inset 0 0 45px ${accent}22` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="pointer-events-none absolute -inset-16 overflow-visible" aria-hidden="true">
      {particles.includes("scanline") && (
        <motion.div
          className="absolute -left-12 -right-12 top-1/2 h-[1px]"
          style={{ backgroundColor: accent, boxShadow: `0 0 18px ${accent}` }}
          animate={{ y: [-170, 210], opacity: [0, 0.8, 0] }}
          transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {particles.includes("role-card") &&
        ["CMD", "SCAN", "WARD"].map((label, index) => (
          <motion.div
            key={label}
            className={cn(
              "absolute hidden border bg-black/35 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.24em] text-white/60 backdrop-blur-sm sm:block",
              index === 0 && "-left-8 top-12",
              index === 1 && "-right-10 top-1/3",
              index === 2 && "bottom-14 left-0",
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
          className="absolute right-2 top-2 h-20 w-20 rounded-full border bg-white/5"
          style={{ borderColor: `${accent}66`, boxShadow: `0 0 36px ${accent}33` }}
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      )}

      {particles.includes("orbit") && (
        <motion.div
          className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-50"
          style={{ borderColor: accent }}
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

function PortalLeakParticles({
  game,
  accent,
  reducedMotion,
}: {
  game: GameCatalogItem;
  accent: string;
  reducedMotion: boolean;
}) {
  const isMobile = typeof window !== "undefined" && (window.innerWidth < 1024 || "ontouchstart" in window || navigator.maxTouchPoints > 0);
  const leaks = useMemo(
    () =>
      Array.from({ length: isMobile ? 8 : portalLeakCount }, (_, index) => ({
        id: `${game.slug}-leak-${index}`,
        left: `${14 + ((index * 17) % 72)}%`,
        top: `${12 + ((index * 29) % 72)}%`,
        size: 4 + (index % 5) * 2,
        x: index % 2 === 0 ? `${34 + index * 2}px` : `${-34 - index * 2}px`,
        y: `${-46 - (index % 6) * 20}px`,
        delay: index * 0.06,
      })),
    [game.slug, isMobile],
  );

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none absolute -inset-[28%] z-20 overflow-visible" aria-hidden="true">
      {leaks.map((leak) => (
        <motion.span
          data-portal-leak
          key={leak.id}
          className="absolute rounded-full"
          style={{
            left: leak.left,
            top: leak.top,
            width: leak.size,
            height: leak.size,
            backgroundColor: accent,
            boxShadow: `0 0 16px ${accent}, 0 0 36px ${accent}`,
          }}
          animate={{
            x: [0, leak.x],
            y: [0, leak.y],
            scale: [0.35, 1.55, 0.18],
            opacity: [0, 0.98, 0],
          }}
          transition={{
            duration: 1.8 + (leak.size % 3),
            delay: leak.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {["9%", "21%", "36%", "58%", "73%", "86%"].map((top, index) => (
        <motion.span
          data-portal-tear
          key={`${game.slug}-tear-${top}`}
          className="absolute left-1/2 h-[2px] w-[78%] origin-center rounded-full"
          style={{
            top,
            background: `linear-gradient(90deg, transparent, ${accent}dd, transparent)`,
            boxShadow: `0 0 26px ${accent}`,
            rotate: `${-24 + index * 9}deg`,
          }}
          animate={{ scaleX: [0.05, 1, 0.16], opacity: [0, 0.88, 0], x: ["-48%", "-57%", "-48%"] }}
          transition={{ duration: 2.35, delay: index * 0.26, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function PortalOutflowStreams({
  game,
  accent,
  reducedMotion,
}: {
  game: GameCatalogItem;
  accent: string;
  reducedMotion: boolean;
}) {
  const isMobile = typeof window !== "undefined" && (window.innerWidth < 1024 || "ontouchstart" in window || navigator.maxTouchPoints > 0);
  const streams = useMemo(
    () =>
      Array.from({ length: isMobile ? 4 : portalStreamCount }, (_, index) => {
        const angle = -165 + index * 30;
        const radians = (angle * Math.PI) / 180;
        const distance = 126 + (index % 4) * 34;

        return {
          id: `${game.slug}-stream-${index}`,
          angle,
          width: 128 + (index % 5) * 28,
          x: `${Math.cos(radians) * distance}px`,
          y: `${Math.sin(radians) * distance}px`,
          delay: index * 0.11,
        };
      }),
    [game.slug],
  );
  const fragments = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        id: `${game.slug}-foreground-fragment-${index}`,
        left: `${-4 + ((index * 19) % 108)}%`,
        top: `${7 + ((index * 31) % 86)}%`,
        size: 10 + (index % 4) * 5,
        delay: index * 0.18,
        rotate: -28 + index * 11,
      })),
    [game.slug],
  );

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none absolute -inset-[44%] z-10 overflow-visible" aria-hidden="true">
      {streams.map((stream) => (
        <motion.span
          data-portal-stream
          key={stream.id}
          className="absolute left-1/2 top-1/2 h-[2px] origin-left rounded-full opacity-0 will-change-transform"
          style={{
            width: stream.width,
            rotate: stream.angle,
            background: `linear-gradient(90deg, ${accent}f2, ${accent}7a 44%, transparent)`,
            boxShadow: `0 0 22px ${accent}`,
          }}
          animate={{
            x: [0, stream.x],
            y: [0, stream.y],
            scaleX: [0.08, 1, 0.18],
            opacity: [0, 0.76, 0],
          }}
          transition={{ duration: 1.9, delay: stream.delay, repeat: Infinity, repeatDelay: 0.35, ease: "easeOut" }}
        />
      ))}
      {fragments.map((fragment) => (
        <motion.span
          data-portal-fragment
          key={fragment.id}
          className="absolute border bg-black/30 backdrop-blur-sm will-change-transform"
          style={{
            left: fragment.left,
            top: fragment.top,
            width: fragment.size,
            height: fragment.size * 1.8,
            borderColor: `${accent}88`,
            boxShadow: `0 0 18px ${accent}66`,
            clipPath: "polygon(50% 0, 100% 74%, 56% 100%, 0 62%)",
          }}
          animate={{
            y: [0, -18, 0],
            rotate: [fragment.rotate, fragment.rotate + 18, fragment.rotate],
            opacity: [0.18, 0.72, 0.18],
          }}
          transition={{ duration: 3.4, delay: fragment.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function EntryTransitionOverlay({
  game,
  theme,
  motionProfile,
}: {
  game: GameCatalogItem;
  theme: GameTheme;
  motionProfile: MotionProfile;
}) {
  const streaks = useMemo(
    () =>
      Array.from({ length: entryStreakCount }, (_, index) => ({
        id: `${game.slug}-streak-${index}`,
        left: `${8 + ((index * 13) % 84)}%`,
        top: `${10 + ((index * 17) % 78)}%`,
        rotate: -18 + (index % 7) * 6,
        delay: index * 0.025,
      })),
    [game.slug],
  );

  return (
    <motion.div
      className="fixed inset-0 z-[1200] overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      role="status"
      aria-live="polite"
      aria-label={`Entering ${game.title}`}
    >
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${theme.backgroundImage})` }}
        initial={{ scale: 1, opacity: 0.38 }}
        animate={{ scale: 1.18, opacity: 0.78 }}
        transition={{ duration: entryTransitionMs / 1000, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.accentSoft}, transparent 34%), linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.88))`,
        }}
        aria-hidden="true"
      />

      {motionProfile === "desktop" && streaks.map((streak) => (
        <motion.span
          key={streak.id}
          className="absolute h-[2px] w-24 origin-left rounded-full"
          style={{
            left: streak.left,
            top: streak.top,
            rotate: streak.rotate,
            backgroundColor: theme.accent,
            boxShadow: `0 0 22px ${theme.accent}`,
          }}
          initial={{ x: "-42vw", opacity: 0 }}
          animate={{ x: "42vw", opacity: [0, 0.72, 0] }}
          transition={{ duration: 0.58, delay: streak.delay, ease: "easeIn" }}
          aria-hidden="true"
        />
      ))}

      {motionProfile === "desktop" && (
        <>
          <motion.div
            className="absolute left-1/2 top-1/2 h-[42vmin] w-[42vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              borderColor: `${theme.accent}99`,
              boxShadow: `0 0 64px ${theme.accent}55, inset 0 0 58px ${theme.accent}33`,
            }}
            initial={{ scale: 0.82, opacity: 0.52 }}
            animate={{ scale: [0.82, 1.2, 5.8], opacity: [0.52, 1, 0] }}
            transition={{ duration: entryTransitionMs / 1000, ease: "easeInOut" }}
            aria-hidden="true"
          />

          <motion.div
            className="absolute left-1/2 top-1/2 h-[22vmin] w-[22vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${theme.accent}55, transparent 64%)`,
              boxShadow: `0 0 90px ${theme.accent}55`,
            }}
            initial={{ scale: 0.4, opacity: 0.25 }}
            animate={{ scale: [0.4, 2.2, 7], opacity: [0.25, 0.92, 0] }}
            transition={{ duration: entryTransitionMs / 1000, ease: "easeInOut" }}
            aria-hidden="true"
          />
        </>
      )}
    </motion.div>
  );
}

export default function PortalDeck({ games, motionProfile }: PortalDeckProps) {
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = window.sessionStorage.getItem("engg-portal-active-index");
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < games.length) {
          return parsed;
        }
      }
    }
    return 0;
  });
  const [enteringGame, setEnteringGame] = useState<GameCatalogItem | null>(null);
  const entryTimerRef = useRef<number | null>(null);
  const launchPendingRef = useRef(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  const shouldReduceMotion = motionProfile === "reduced" || motionProfile === null;

  const activeGame = games[activeIndex] ?? games[0];
  const activeTheme = useMemo(() => getTheme(activeGame), [activeGame]);
  const activeSceneKind = useMemo(() => getSceneKind(activeTheme), [activeTheme]);
  const enteringTheme = useMemo(() => (enteringGame ? getTheme(enteringGame) : null), [enteringGame]);
  const isLaunchable = isLaunchableGame(activeGame);

  const [displayGame, setDisplayGame] = useState<GameCatalogItem>(activeGame);
  const [detailsOpacity, setDetailsOpacity] = useState(1);

  useEffect(() => {
    let timer: number | null = null;
    if (activeGame.slug !== displayGame.slug) {
      setDetailsOpacity(0);
      timer = window.setTimeout(() => {
        setDisplayGame(activeGame);
        setDetailsOpacity(1);
      }, 160);
    }
    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [activeGame, displayGame]);

  const displayTheme = useMemo(() => getTheme(displayGame), [displayGame]);

  useEffect(() => {
    const handlePageShow = () => {
      setEnteringGame(null);
      launchPendingRef.current = false;
      if (entryTimerRef.current !== null) {
        window.clearTimeout(entryTimerRef.current);
        entryTimerRef.current = null;
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      if (entryTimerRef.current !== null) {
        window.clearTimeout(entryTimerRef.current);
      }
      launchPendingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("engg-portal-active-index", activeIndex.toString());
    }
  }, [activeIndex]);

  const setWrappedIndex = (nextIndex: number) => {
    if (launchPendingRef.current) return;

    const total = games.length;
    setActiveIndex((nextIndex + total) % total);
  };

  const selectGame = (index: number) => {
    if (!launchPendingRef.current) {
      setActiveIndex(index);
    }
  };

  const setWorldDrift = useCallback((x: number, y: number) => {
    const section = sectionRef.current;
    if (!section) return;
    section.style.setProperty("--portal-drift-x", `${x.toFixed(2)}px`);
    section.style.setProperty("--portal-drift-y", `${y.toFixed(2)}px`);
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (shouldReduceMotion) return;
    if (event.pointerType === "touch" || event.pointerType === "pen") return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
    setWorldDrift(x, y);
  };

  const handlePointerLeave = () => {
    setWorldDrift(0, 0);
  };

  const beginLaunch = useCallback(
    (game = activeGame) => {
      if (!isLaunchableGame(game) || launchPendingRef.current) return;

      launchPendingRef.current = true;

      if (shouldReduceMotion) {
        window.location.assign(game.href);
        return;
      }

      setEnteringGame(game);
      if (entryTimerRef.current !== null) {
        window.clearTimeout(entryTimerRef.current);
      }
      entryTimerRef.current = window.setTimeout(() => {
        window.location.assign(game.href);
      }, entryTransitionMs);
    },
    [activeGame, shouldReduceMotion],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setWrappedIndex(activeIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setWrappedIndex(activeIndex + 1);
    }
    if (event.key === "Enter" && isLaunchable) {
      const target = event.target as HTMLElement;
      const deckHasFocus = event.currentTarget === event.target;
      const selectedSelectorHasFocus = target.getAttribute("aria-pressed") === "true";

      if (deckHasFocus || selectedSelectorHasFocus) {
        event.preventDefault();
        beginLaunch(activeGame);
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full flex-1 flex flex-col items-center justify-between min-h-0 overflow-hidden py-2 sm:py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55"
      aria-label="ENGG Portal Deck"
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      tabIndex={0}
      style={
        {
          "--portal-accent": activeTheme.accent,
          "--portal-drift-x": "0px",
          "--portal-drift-y": "0px",
        } as PortalDeckStyle
      }
    >
      <WorldCanvasTransition
        activeGame={activeGame}
        activeTheme={activeTheme}
        activeIndex={activeIndex}
        games={games}
        motionProfile={motionProfile}
      />

      <AnimatePresence>
        {enteringGame && enteringTheme && <EntryTransitionOverlay game={enteringGame} theme={enteringTheme} motionProfile={motionProfile} />}
      </AnimatePresence>

      <p className="sr-only" aria-live="polite">
        Selected game: {activeGame.title}
      </p>

      <div className="relative z-10 flex flex-1 min-h-0 w-full flex-col items-center justify-center gap-3 sm:gap-5 px-4 py-2 sm:px-8">
        <motion.div
          className="relative z-20 mx-auto max-w-3xl text-center shrink-0"
          animate={{ opacity: detailsOpacity, y: shouldReduceMotion ? 0 : detailsOpacity === 0 ? 8 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.16, ease: "easeInOut" }}
        >
          <div className="mb-1 sm:mb-2 flex items-center justify-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: displayTheme.accent, boxShadow: `0 0 12px ${displayTheme.accent}` }}
              aria-hidden="true"
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.42em] text-white/48">
              ENGG Portal Deck
            </span>
          </div>

          <p className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.34em]" style={{ color: displayTheme.accent }}>
            {displayGame.subtitle}
          </p>
          <h2
            className="mt-1 break-words font-orbitron text-xl font-black uppercase leading-tight tracking-[0.16em] text-white sm:mt-2 sm:text-3xl"
            style={{ textShadow: "0 0 30px rgba(255,255,255,0.2), 0 2px 24px rgba(0,0,0,0.85)" }}
          >
            {displayGame.title}
          </h2>
          <p
            className="mx-auto mt-1 sm:mt-2 max-w-2xl text-[11px] leading-relaxed text-white/72 sm:text-sm"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.8)" }}
          >
            {displayGame.description}
          </p>
        </motion.div>

        <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center w-full py-2 sm:py-4">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,55vh,520px)] w-[min(90vw,55vh,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55 blur-3xl"
            style={{ background: `radial-gradient(circle, ${activeTheme.accentSoft}, transparent 68%)` }}
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(100vw,65vh,640px)] w-[min(100vw,65vh,640px)] -translate-x-1/2 -translate-y-1/2 overflow-visible opacity-80"
            aria-hidden="true"
          >
            <PortalFragments
              particles={activeTheme.particles}
              accent={activeTheme.accent}
              reducedMotion={motionProfile !== "desktop"}
            />
          </div>

          <motion.div
            key={`portal-${activeGame.slug}`}
            className="relative h-[32vh] sm:h-[36vh] lg:h-[42vh] max-h-[240px] sm:max-h-[290px] md:max-h-[360px] lg:max-h-[440px] aspect-[4/5] [perspective:1400px]"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.button
              data-portal-rift
              type="button"
              disabled={!isLaunchable || Boolean(enteringGame)}
              onClick={() => beginLaunch(activeGame)}
              aria-label={
                isLaunchable
                  ? `Enter ${activeGame.title}`
                  : `${activeGame.title}: ${statusCopy[activeGame.status]}`
              }
              className={cn(
                "group relative aspect-[4/5] w-full overflow-visible bg-transparent p-0 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300/70 focus:ring-offset-2 focus:ring-offset-black",
                isLaunchable ? "cursor-pointer" : "cursor-not-allowed opacity-90",
              )}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                className="absolute -inset-[24%] rounded-full opacity-45 blur-3xl"
                style={{
                  background: `radial-gradient(circle, ${activeTheme.accentSoft}, transparent 64%)`,
                  transform: "translate3d(var(--portal-drift-x, 0px), var(--portal-drift-y, 0px), -80px)",
                }}
                animate={shouldReduceMotion ? undefined : { scale: [0.92, 1.12, 0.92], opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />

              {activeSceneKind === "nether-depths" && (
                <span className="pointer-events-none absolute -inset-[9%] z-0" aria-hidden="true">
                  {[
                    "left-[8%] top-[6%] h-[88%] w-[8%] -rotate-6",
                    "right-[8%] top-[6%] h-[88%] w-[8%] rotate-6",
                    "left-[24%] top-[-2%] h-[10%] w-[52%]",
                    "left-[24%] bottom-[-2%] h-[10%] w-[52%]",
                  ].map((className, index) => (
                    <span
                      data-portal-ruin-frame
                      key={`${activeGame.slug}-portal-ruin-frame-${index}`}
                      className={cn("absolute border bg-black/45", className)}
                      style={{
                        borderColor: index < 2 ? `${activeTheme.accent}6e` : "rgba(245,158,11,0.34)",
                        boxShadow: `0 0 28px ${activeTheme.accent}4a, inset 0 0 16px rgba(245,158,11,0.12)`,
                        clipPath: "polygon(14% 0, 86% 0, 100% 100%, 0 100%)",
                      }}
                    />
                  ))}
                  <span
                    className="absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-60"
                    style={{ borderColor: "rgba(245,158,11,0.48)", boxShadow: `0 0 38px ${activeTheme.accent}33` }}
                  />
                </span>
              )}

              {activeSceneKind === "orbital-lock" && (
                <span className="pointer-events-none absolute -inset-[12%] z-0" aria-hidden="true">
                  <span
                    data-portal-war-frame
                    className="absolute left-1/2 top-1/2 h-[116%] w-[116%] -translate-x-1/2 -translate-y-1/2 border border-dashed opacity-65"
                    style={{
                      borderColor: `${activeTheme.accent}72`,
                      clipPath: "polygon(50% 0, 93% 9%, 100% 50%, 93% 91%, 50% 100%, 7% 91%, 0 50%, 7% 9%)",
                      boxShadow: `0 0 42px ${activeTheme.accent}3f`,
                    }}
                  />
                  {[0, 1, 2, 3].map((corner) => (
                    <span
                      data-portal-target-bracket
                      key={`${activeGame.slug}-portal-target-${corner}`}
                      className="absolute h-12 w-12 border-white/0"
                      style={{
                        left: corner === 0 || corner === 2 ? "2%" : undefined,
                        right: corner === 1 || corner === 3 ? "2%" : undefined,
                        top: corner < 2 ? "4%" : undefined,
                        bottom: corner > 1 ? "4%" : undefined,
                        borderTop: corner < 2 ? `2px solid ${activeTheme.accent}` : undefined,
                        borderBottom: corner > 1 ? `2px solid ${activeTheme.accent}` : undefined,
                        borderLeft: corner === 0 || corner === 2 ? `2px solid rgba(34,211,238,0.75)` : undefined,
                        borderRight: corner === 1 || corner === 3 ? `2px solid rgba(34,211,238,0.75)` : undefined,
                        boxShadow: `0 0 16px ${activeTheme.accent}`,
                      }}
                    />
                  ))}
                </span>
              )}

              <span
                className="relative block h-full w-full overflow-hidden border bg-black/15 shadow-2xl backdrop-blur-[2px]"
                style={{
                  borderColor: `${activeTheme.accent}aa`,
                  boxShadow: `0 0 64px ${activeTheme.accent}48, 0 0 150px ${activeTheme.accent}1f, inset 0 0 48px ${activeTheme.accent}2a`,
                  clipPath:
                    "polygon(50% 0, 88% 9%, 100% 50%, 88% 91%, 50% 100%, 12% 91%, 0 50%, 12% 9%)",
                  transform: "translateZ(48px)",
                }}
              >
                <motion.span
                  className="absolute inset-0 z-0"
                  style={{
                    background: `radial-gradient(circle at 50% 48%, transparent 26%, ${activeTheme.accent}22 46%, rgba(0,0,0,0.88) 78%)`,
                  }}
                  animate={shouldReduceMotion ? undefined : { opacity: [0.42, 0.75, 0.42] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden="true"
                />
                {/* Main key art illustration (visible for all games) */}
                <motion.img
                  key={activeTheme.previewImage}
                  src={activeTheme.previewImage}
                  alt={`${activeGame.title} portal preview`}
                  width={840}
                  height={1050}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="relative z-10 h-full w-full object-cover"
                  initial={{ scale: motionProfile === "reduced" ? 1 : 1.05, opacity: 0 }}
                  animate={motionProfile === "reduced" ? { scale: 1, opacity: 1 } : { scale: [1.02, 1.05, 1.02], opacity: 1 }}
                  transition={
                    motionProfile === "reduced"
                      ? { duration: 0 }
                      : {
                        opacity: { duration: 0.55 },
                        scale: { duration: motionProfile === "mobile" ? 20 : 10, repeat: Infinity, ease: "easeInOut" },
                      }
                  }
                />

                {/* Theme-specific portal interior overlay enhancements */}
                {activeSceneKind === "nether-depths" && (
                  <div className="pointer-events-none absolute inset-0 z-15 overflow-hidden" aria-hidden="true">
                    {/* Rotating nether seal projection overlaying key art */}
                    <motion.div
                      className="absolute left-1/2 top-[52%] h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-45"
                      style={{
                        borderColor: "rgba(245,158,11,0.75)",
                        boxShadow: `0 0 24px ${activeTheme.accent}44, inset 0 0 16px rgba(245,158,11,0.1)`,
                      }}
                      animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                      transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Subtle floating themed runes in the corners */}
                    {["WARD", "SEAL", "RELIC"].map((label, index) => (
                      <span
                        key={`card-rune-${label}`}
                        className="absolute font-mono text-[11px] font-bold tracking-wider opacity-60"
                        style={{
                          left: index === 0 ? "15%" : index === 1 ? "75%" : "48%",
                          top: index === 0 ? "18%" : index === 1 ? "22%" : "82%",
                          color: index % 2 ? "rgba(245,158,11,0.9)" : activeTheme.accent,
                          textShadow: `0 0 12px ${activeTheme.accent}`,
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                {activeSceneKind === "orbital-lock" && (
                  <div className="pointer-events-none absolute inset-0 z-15 overflow-hidden" aria-hidden="true">
                    {/* Tactical target HUD reticle overlaying key art */}
                    <div
                      className="absolute left-1/2 top-[48%] h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 border border-dashed opacity-35 rounded-full"
                      style={{ borderColor: activeTheme.accent, boxShadow: `0 0 18px ${activeTheme.accent}33` }}
                    />
                    <div
                      className="absolute left-1/2 top-[48%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 border-t border-l opacity-45"
                      style={{ borderColor: activeTheme.accent }}
                    />
                    <div
                      className="absolute left-1/2 top-[48%] h-4 w-4 translate-x-0 -translate-y-1/2 border-t border-r opacity-45"
                      style={{ borderColor: activeTheme.accent }}
                    />
                    {/* Subtle lasers crossing the portal */}
                    {[32, 64].map((top, index) => (
                      <span
                        key={`card-laser-${top}`}
                        className="absolute left-[-10%] h-[1px] w-[120%] origin-center opacity-30"
                        style={{
                          top: `${top}%`,
                          rotate: `${index % 2 ? 8 : -12}deg`,
                          background: `linear-gradient(90deg, transparent, ${activeTheme.accent}, transparent)`,
                          boxShadow: `0 0 12px ${activeTheme.accent}`,
                        }}
                      />
                    ))}
                  </div>
                )}

                <span className="absolute inset-0 z-20 bg-gradient-to-t from-black/82 via-black/12 to-black/16" />
                {motionProfile === "desktop" && (
                  <>
                    <motion.span
                      data-portal-inner-distortion
                      className="absolute inset-0 z-30 mix-blend-screen opacity-60"
                      style={{
                        background: `repeating-linear-gradient(102deg, transparent 0 17px, ${activeTheme.accent}33 18px 19px, transparent 20px 42px), radial-gradient(circle at 50% 46%, ${activeTheme.accent}44, transparent 46%)`,
                        WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 12%, transparent 72%)",
                        maskImage: "radial-gradient(circle at 50% 50%, black 12%, transparent 72%)",
                      }}
                      animate={{ x: ["-4%", "5%", "-4%"], opacity: [0.36, 0.74, 0.36] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      aria-hidden="true"
                    />
                    <motion.span
                      className="absolute -left-1/4 top-0 z-30 h-full w-1/2 bg-white/10 mix-blend-screen blur-xl"
                      style={{
                        background: `linear-gradient(100deg, transparent, ${activeTheme.accent}4d, transparent)`,
                      }}
                      animate={{ x: ["-80%", "240%"], opacity: [0, 0.75, 0] }}
                      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                      aria-hidden="true"
                    />
                  </>
                )}
                <motion.span
                  className="absolute inset-0 z-30 mix-blend-screen"
                  style={{
                    background: `radial-gradient(circle at 50% 46%, ${activeTheme.accent}3d, transparent 48%)`,
                  }}
                  animate={motionProfile === "reduced" ? undefined : { opacity: [0.35, 0.82, 0.35] }}
                  transition={{ duration: motionProfile === "mobile" ? 6 : 3.2, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden="true"
                />
                <span className="absolute inset-x-10 top-10 z-40 h-[1px]" style={{ backgroundColor: activeTheme.accent }} />
                <span
                  className="absolute bottom-9 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap border bg-black/45 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] backdrop-blur-sm"
                  style={{ borderColor: `${activeTheme.accent}66`, color: activeTheme.accent }}
                >
                  {statusCopy[activeGame.status]}
                </span>
              </span>

              <span
                className="pointer-events-none absolute -inset-[4%] border opacity-70"
                style={{
                  borderColor: activeTheme.accent,
                  clipPath:
                    "polygon(50% 0, 88% 9%, 100% 50%, 88% 91%, 50% 100%, 12% 91%, 0 50%, 12% 9%)",
                  filter: `drop-shadow(0 0 18px ${activeTheme.accent})`,
                }}
                aria-hidden="true"
              />
              <PortalOutflowStreams game={activeGame} accent={activeTheme.accent} reducedMotion={motionProfile !== "desktop"} />
              <PortalLeakParticles game={activeGame} accent={activeTheme.accent} reducedMotion={motionProfile !== "desktop"} />
            </motion.button>
          </motion.div>
        </div>

        <div className="relative z-20 flex w-full max-w-[920px] flex-col items-center gap-2 sm:gap-3 shrink-0">
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-2">
            <button
              type="button"
              onClick={() => setWrappedIndex(activeIndex - 1)}
              className="grid h-11 w-11 shrink-0 place-items-center border border-white/10 bg-black/35 text-white/70 backdrop-blur-sm transition hover:border-white/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
              aria-label="Previous game"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              className="relative flex min-w-0 flex-1 justify-center gap-2 overflow-hidden border-y bg-black/25 px-2 py-2 backdrop-blur-md"
              style={{ borderColor: `${activeTheme.accent}24`, boxShadow: `0 0 34px ${activeTheme.accent}18` }}
            >
              <span
                className="pointer-events-none absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute left-1/2 top-0 h-full w-28 -translate-x-1/2 opacity-55 blur-xl"
                style={{ background: `radial-gradient(ellipse at center, ${activeTheme.accentSoft}, transparent 70%)` }}
                aria-hidden="true"
              />
              {games.map((game, index) => {
                const theme = getTheme(game);
                const isActive = index === activeIndex;
                const isLocked = game.status !== "online";
                const stateLabel = game.status === "online" ? "Live" : statusCopy[game.status];
                return (
                  <button
                    key={game.slug}
                    type="button"
                    onClick={() => selectGame(index)}
                    onFocus={() => selectGame(index)}
                    onMouseEnter={() => selectGame(index)}
                    className={cn(
                      "relative min-h-11 sm:min-h-14 min-w-0 flex-1 overflow-hidden border bg-black/35 px-2 py-2 text-left backdrop-blur-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/60",
                      isActive ? "border-white/35 text-white" : "border-white/10 opacity-72 hover:opacity-100",
                      isLocked && "opacity-55",
                    )}
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                      ...(isActive
                        ? {
                          borderColor: `${theme.accent}a8`,
                          boxShadow: `0 0 32px ${theme.accent}66, inset 0 0 26px ${theme.accent}26`,
                          background: `linear-gradient(135deg, ${theme.accentSoft}, rgba(0,0,0,0.34) 54%, ${theme.accent}1a)`,
                        }
                        : {}),
                    }}
                    aria-pressed={isActive}
                  >
                    {isActive && (
                      <>
                        {motionProfile === "desktop" && (
                          <motion.span
                            data-selector-signal
                            className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 bg-white/10 mix-blend-screen blur-lg"
                            style={{ background: `linear-gradient(100deg, transparent, ${theme.accent}55, transparent)` }}
                            animate={{ x: ["0%", "260%"], opacity: [0, 0.7, 0] }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className="pointer-events-none absolute bottom-0 left-2 right-2 h-px"
                          style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }}
                          aria-hidden="true"
                        />
                      </>
                    )}
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
                      style={{ background: isActive ? theme.accent : "rgba(255,255,255,0.12)" }}
                      aria-hidden="true"
                    />
                    <span className="relative flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full border"
                        style={{
                          borderColor: `${theme.accent}99`,
                          backgroundColor: isActive ? theme.accent : "rgba(0,0,0,0.6)",
                          boxShadow: isActive ? `0 0 16px ${theme.accent}` : undefined,
                        }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-orbitron text-[10px] font-black uppercase tracking-[0.16em] text-white sm:text-[12px]">
                          {game.title}
                        </span>
                        <span
                          className="mt-1 block truncate font-mono text-[9px] uppercase tracking-[0.18em]"
                          style={{ color: isActive ? theme.accent : "rgba(255,255,255,0.35)" }}
                        >
                          {isActive ? theme.portalEffect.replace("-", "_") : statusCopy[game.status]}
                        </span>
                      </span>
                    </span>
                    <span className="absolute bottom-1.5 right-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                      {stateLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setWrappedIndex(activeIndex + 1)}
              className="grid h-11 w-11 shrink-0 place-items-center border border-white/10 bg-black/35 text-white/70 backdrop-blur-sm transition hover:border-white/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
              aria-label="Next game"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex max-w-full flex-col items-center gap-3 sm:flex-row">
            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/45">
              {activeTheme.portalEffect.replace("-", "_")}
            </span>
            <span className="hidden h-px w-10 bg-white/15 sm:block" aria-hidden="true" />
            <span
              className="max-w-[86vw] truncate text-center font-mono text-[10px] uppercase tracking-[0.26em]"
              style={{ color: activeTheme.accent }}
            >
              {activeGame.href || `/${activeGame.slug}`}
            </span>
          </div>

          <div className="relative flex justify-center">
            <span
              className="pointer-events-none absolute -top-5 left-1/2 h-5 w-px -translate-x-1/2"
              style={{ background: `linear-gradient(180deg, ${activeTheme.accent}, transparent)` }}
              aria-hidden="true"
            />
            {isLaunchable ? (
              <button
                type="button"
                onClick={() => beginLaunch(activeGame)}
                disabled={Boolean(enteringGame)}
                className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden border font-orbitron text-[12px] sm:text-[14px] font-black uppercase tracking-[0.34em] text-white backdrop-blur-sm transition duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 sm:w-auto h-11 sm:h-14 px-6 sm:px-10"
                style={{
                  borderColor: `${activeTheme.accent}c8`,
                  background: `linear-gradient(135deg, ${activeTheme.accent}34, rgba(255,255,255,0.06) 42%, ${activeTheme.accent}1a)`,
                  boxShadow: `0 0 42px ${activeTheme.accent}44, inset 0 0 28px ${activeTheme.accent}22`,
                  clipPath:
                    "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
                }}
                aria-label={`Enter ${activeGame.title}`}
              >
                {motionProfile === "desktop" && (
                  <motion.span
                    className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 bg-white/15 mix-blend-screen blur-lg"
                    style={{ background: `linear-gradient(100deg, transparent, ${activeTheme.accent}66, transparent)` }}
                    animate={{ x: ["0%", "280%"], opacity: [0, 0.78, 0] }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className="pointer-events-none absolute inset-x-4 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${activeTheme.accent}, transparent)` }}
                  aria-hidden="true"
                />
                <Play className="relative h-5 w-5 shrink-0" />
                <span className="relative">{getLaunchLabel(activeGame)}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-11 sm:h-14 w-full items-center justify-center border border-white/10 bg-white/[0.03] px-6 py-3 font-orbitron text-[11px] sm:text-[13px] font-black uppercase tracking-[0.32em] text-white/35 backdrop-blur-sm sm:w-auto"
                aria-label={`${activeGame.title} is locked`}
              >
                <Lock className="mr-3 h-4 w-4" />
                {getLaunchLabel(activeGame)}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
