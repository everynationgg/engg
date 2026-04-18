import React from "react";

/**
 * ReconnectGraceBanner — full-screen overlay shown during reconnect grace period.
 *
 * Displayed when a player disconnects mid-game while the server waits for
 * them to reconnect (before the game is interrupted). Blocks all interactions.
 * Optional children (e.g. host controls) are rendered inside the modal box.
 */
export default function ReconnectGraceBanner({ playerName, children }: { playerName: string; children?: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center px-6 ix-backdrop ix-backdrop-blur"
      style={{
        background: "hsl(220 30% 3% / 0.88)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="rounded-lg px-8 py-6 text-center ix-modal-enter"
        style={{
          background: "hsl(40 80% 10% / 0.95)",
          border: "1px solid hsl(50 100% 50% / 0.5)",
          boxShadow: "0 0 28px hsl(50 100% 50% / 0.3)",
          maxWidth: "90vw",
        }}
      >
        <div className="ix-typing-dots flex items-center justify-center gap-1 mb-3">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "hsl(50 100% 50%)" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "hsl(50 100% 50%)" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "hsl(50 100% 50%)" }}
          />
        </div>
        <p
          className="font-orbitron font-bold text-sm tracking-[0.15em] uppercase mb-2"
          style={{ color: "hsl(50 100% 70%)" }}
        >
          Waiting for player to reconnect…
        </p>
        <p
          className="font-orbitron text-xs tracking-[0.1em]"
          style={{ color: "hsl(50 80% 60%)" }}
        >
          {playerName} disconnected. Game paused.
        </p>
        {children && (
          <div className="mt-4 flex gap-2 justify-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
