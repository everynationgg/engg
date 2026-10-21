// Shared helpers for game state, session, and role logic

import { ROLES, type Role } from "@/data/roles";
import { gameSessionStore } from "@/lib/gameSessionStore";

export function getRoomCode(): string {
  return gameSessionStore.getRoomCode("------");
}

export function getCallsign(): string {
  return gameSessionStore.getCallsign("UNKNOWN");
}

export function getInitialRoleId(): string {
  return gameSessionStore.getAssignedRole("crew");
}

export function getAssignedRole(): Role {
  const roleId = gameSessionStore.getAssignedRole();
  return ROLES.find((r) => r.id === roleId) ?? ROLES.find((r) => r.id === "crew") ?? ROLES[0];
}

export function getOrbitResult(): { type: string; data?: unknown } | null {
  try { return JSON.parse(gameSessionStore.getOrbitResult() ?? "null"); } catch { return null; }
}

export function getMySocketId(): string {
  // Defensive: getSocket() may not be available in all contexts
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getSocket } = require("@/lib/socket");
    return getSocket().id ?? "";
  } catch {
    return "";
  }
}
