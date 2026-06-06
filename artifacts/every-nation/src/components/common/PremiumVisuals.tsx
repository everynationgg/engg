import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { HUDOverlay } from "./HUDOverlay";
import { cn } from "@/lib/utils";

interface CinematicPageShellProps {
  children: React.ReactNode;
  pageLabel: string;
  accentColor?: string; // e.g. "rgba(6, 182, 212, 0.15)"
  driftSpeed?: number;
}

/**
 * CinematicPageShell
 * Wraps content in HUDOverlay and layers a drifting ambient space nebula,
 * parallax depth layers, and digital matrix grids, centering the children vertically.
 */
export function CinematicPageShell({
  children,
  pageLabel,
  accentColor = "rgba(6, 182, 212, 0.12)",
  driftSpeed = 16,
}: CinematicPageShellProps) {
  return (
    <HUDOverlay pageLabel={pageLabel}>
      <div className="relative flex min-h-[calc(100vh-100px)] flex-col items-center justify-center overflow-x-hidden bg-[#020408] selection:bg-cyan-500/30 lg:min-h-[calc(100vh-120px)]">
        {/* Animated Cyber Grid backdrop */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
          }}
        />

        {/* Drifting Nebula Ambient Glow */}
        <motion.div
          className="fixed -inset-[50%] z-0 pointer-events-none blur-[120px] opacity-45"
          animate={{
            x: ["-8%", "8%", "-8%"],
            y: ["-6%", "6%", "-6%"],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: driftSpeed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 60%)`,
          }}
        />

        {/* Additional depth glow layer */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 100%, rgba(2, 4, 8, 0) 40%, #020408 90%)",
          }}
        />

        {/* Centered Scrollable Main Content Container */}
        <div className="relative z-10 flex w-full min-h-[calc(100vh-100px)] flex-col items-center justify-center px-4 pb-16 pt-8 md:px-8 xl:px-12 lg:min-h-[calc(100vh-120px)]">
          {children}
        </div>
      </div>
    </HUDOverlay>
  );
}

interface HudPanelProps {
  children: React.ReactNode;
  className?: string;
  color?: string; // HSL/HEX color for scan lines and highlights
  title?: string;
  telemetryCode?: string;
}

/**
 * HudPanel
 * An upgraded glass container featuring dynamic glowing edges, chamfer details,
 * and high-fidelity diagnostic corner markers.
 */
export function HudPanel({
  children,
  className = "",
  color = "#00f3ff",
  title,
  telemetryCode,
}: HudPanelProps) {
  const clipPath =
    "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))";

  return (
    <div
      className={cn("relative group transition-all duration-500", className)}
    >
      {/* Outer Border Layer */}
      <div
        className="absolute inset-0 bg-white/[0.01] border transition-all duration-500"
        style={{
          clipPath,
          borderColor: "rgba(255, 255, 255, 0.08)",
          boxShadow: `inset 0 0 20px ${color}04`,
        }}
      />

      {/* Main Glass Content Box */}
      <div
        className="relative z-10 h-full w-full bg-[#05080f]/75 backdrop-blur-[6px] overflow-hidden transition-all duration-500 group-hover:bg-[#070b14]/85"
        style={{ clipPath }}
      >
        {/* Subtle Horizontal Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.1)_50%,transparent_50%)] bg-[size:100%_4px]" />

        {/* Diagonal Light Sweep on Hover */}
        <motion.span
          className="absolute -left-[50%] top-0 z-20 h-full w-1/3 bg-white/5 mix-blend-screen blur-xl pointer-events-none"
          style={{
            background: `linear-gradient(100deg, transparent, ${color}1a, transparent)`,
          }}
          whileHover={{ x: ["0%", "300%"] }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />

        {/* Panel Header telemetry */}
        {(title || telemetryCode) && (
          <div className="border-b border-white/5 px-6 py-3.5 flex items-center justify-between bg-white/[0.01]">
            {title && (
              <span className="font-orbitron text-[12px] font-black uppercase tracking-[0.24em] text-white">
                {title}
              </span>
            )}
            {telemetryCode && (
              <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
                {telemetryCode}
              </span>
            )}
          </div>
        )}

        {/* Internal Content */}
        <div className="relative z-20">{children}</div>

        {/* High-Tech HUD Corners & Highlights */}
        <div
          className="absolute top-0 left-6 w-8 h-[1px]"
          style={{ backgroundColor: `${color}40` }}
        />
        <div
          className="absolute bottom-6 right-0 w-[1px] h-8"
          style={{ backgroundColor: `${color}40` }}
        />
        <div
          className="absolute top-3 right-3 w-1.5 h-1.5 transition-colors border"
          style={{ borderColor: `${color}40` }}
        />
      </div>

      {/* Deep Atmospheric Glow on Hover */}
      <div
        className="absolute inset-0 -z-10 blur-[35px] transition-all duration-700 opacity-0 group-hover:opacity-10 scale-95 group-hover:scale-100 pointer-events-none"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

interface AccessGateProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
  reducedMotion?: boolean;
}

/**
 * AccessGate
 * A secure, lock-screen-like visual structure designed for Auth, Reset-Password, and 404 views.
 * Unifies both the telemetry scanner column and the input column inside a single HudPanel container.
 */
export function AccessGate({
  title,
  subtitle,
  icon,
  children,
  accentColor = "#00f3ff",
  reducedMotion = false,
}: AccessGateProps) {
  const terminalLogs = useMemo(
    () => [
      "[ OK ] INITIALIZING SECURE HANDSHAKE",
      "[ OK ] VERIFYING ACCESS PROTOCOLS",
      "[ OK ] LINKED TO PORTAL NETWORK: ALPHA_01",
      "[ OK ] ENCRYPTION PROTOCOL: SHA_256",
      "[ OK ] SYSTEM DIAGNOSTIC COMPLETED: SECURE",
    ],
    [],
  );

  return (
    <HudPanel
      color={accentColor}
      className="w-full max-w-[1080px] mx-auto shadow-[0_0_60px_rgba(0,243,255,0.08)]"
    >
      <div className="w-full flex flex-col md:grid md:grid-cols-12 md:divide-x md:divide-white/5 items-stretch min-h-[460px]">
        {/* LEFT SECTION: Biometric Terminal Telemetry */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-8 md:p-10 relative overflow-hidden bg-black/[0.08]">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1.5px)] bg-[size:16px_16px]" />
          </div>

          {/* Biometric Scanning Radar */}
          <div className="relative mb-6 z-10">
            <div
              className="w-24 h-24 border rounded-full flex items-center justify-center relative transition-all"
              style={{ borderColor: `${accentColor}25` }}
            >
              <motion.div
                className="absolute inset-0 border border-dashed rounded-full"
                style={{ borderColor: `${accentColor}55` }}
                animate={reducedMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-2 border rounded-full"
                style={{ borderColor: `${accentColor}18` }}
                animate={
                  reducedMotion ? undefined : { scale: [0.94, 1.06, 0.94] }
                }
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/[0.01]">
                {icon}
              </div>
            </div>
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black border text-[9px] font-mono font-black uppercase tracking-widest"
              style={{ color: accentColor, borderColor: `${accentColor}33` }}
            >
              SECURE_LINK
            </div>
          </div>

          {/* Terminal Header */}
          <div className="flex flex-col gap-1.5 relative z-10 mb-6 max-w-[280px]">
            <h2 className="font-orbitron text-xl font-black uppercase tracking-[0.24em] text-white leading-tight">
              {title}
            </h2>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.34em]"
              style={{ color: `${accentColor}cc` }}
            >
              {subtitle}
            </p>
          </div>

          {/* Live System Diagnostics Feed */}
          <div className="w-full max-w-[240px] bg-black/35 border border-white/5 p-3.5 rounded-sm font-mono text-[10px] text-white/25 text-left flex flex-col gap-1.5 opacity-60">
            {terminalLogs.map((log, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="text-cyan-500/70">{">"}</span>
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SECTION: Content / Input Form */}
        <div className="md:col-span-7 flex flex-col justify-center relative bg-transparent">
          {children}
        </div>
      </div>
    </HudPanel>
  );
}

interface AchievementBadgeProps {
  title: string;
  description?: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

/**
 * AchievementBadge
 * Renders user achievements as military/space emblems with customized frames.
 */
export function AchievementBadge({
  title,
  description,
  rarity = "common",
}: AchievementBadgeProps) {
  const color =
    rarity === "legendary"
      ? "#ef4444" // Sovereign Red
      : rarity === "epic"
        ? "#d946ef" // Epic Magenta
        : rarity === "rare"
          ? "#a855f7" // Rare Purple
          : "#00f3ff"; // Standard Cyan

  return (
    <div className="flex items-center gap-4 p-4 border border-white/5 bg-[#05080f]/40 hover:bg-[#070b14]/50 transition-colors rounded-sm group">
      {/* Insignia Shape */}
      <div
        className="w-10 h-10 shrink-0 border flex items-center justify-center relative"
        style={{
          borderColor: `${color}33`,
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        <div
          className="absolute inset-[3px] border opacity-15"
          style={{ borderColor: color }}
        />
        <div
          className="w-4 h-4 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}cc 0%, transparent 80%)`,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-0.5">
        <span className="font-orbitron text-[11px] font-black tracking-widest text-white uppercase group-hover:text-cyan-300 transition-colors">
          {title}
        </span>
        {description && (
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-wider">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
