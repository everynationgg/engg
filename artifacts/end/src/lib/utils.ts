import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Player connection status helpers ──────────────────────────────────────
// Shared logic so VotingPage, InterruptedPage, and other components use
// consistent definitions for connected / reconnecting / disconnected.

export interface PlayerWithStatus {
  connected?: boolean;
  connectionStatus?: "connected" | "reconnecting" | "disconnected";
}

/** True when the player has an active socket connection. */
export function isPlayerConnected(p: PlayerWithStatus): boolean {
  return p.connectionStatus === "connected" || (p.connectionStatus === undefined && p.connected !== false);
}

/** True when the player is in reconnect grace (temporary disconnect). */
export function isPlayerReconnecting(p: PlayerWithStatus): boolean {
  return p.connectionStatus === "reconnecting";
}

/** True when the player is permanently disconnected (quit or grace expired). */
export function isPlayerDisconnected(p: PlayerWithStatus): boolean {
  return p.connectionStatus === "disconnected" || (p.connectionStatus === undefined && p.connected === false);
}
