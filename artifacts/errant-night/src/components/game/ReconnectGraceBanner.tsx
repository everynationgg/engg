import React from "react";

/**
 * ReconnectGraceBanner — Compact, non-blocking top banner shown during reconnect grace period.
 *
 * Informs active players that a participant has temporarily disconnected and is reconnecting.
 * Does NOT block gameplay interactions or freeze the viewport.
 */
export default function ReconnectGraceBanner({ playerName, children }: { playerName: string; children?: React.ReactNode }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-amber-950/90 border-b border-amber-500/50 backdrop-blur-md shadow-lg pointer-events-auto"
      style={{
        paddingTop: "var(--app-safe-top, 36px)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b] shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-orbitron font-bold text-xs tracking-wider uppercase text-amber-300">
            {playerName ? `${playerName} reconnecting…` : "Player reconnecting…"}
          </span>
          <span className="text-[10px] text-amber-200/70 font-mono">
            Authoritative match timer active
          </span>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 ml-auto">
          {children}
        </div>
      )}
    </div>
  );
}
