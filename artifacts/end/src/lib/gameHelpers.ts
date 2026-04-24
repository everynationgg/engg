// Shared helpers for game state, session, and role logic

import { ROLES, type Role } from "@/data/roles";

export function getRoomCode(): string {
  return sessionStorage.getItem("lp_roomCode") || "------";
}

export function getCallsign(): string {
  return sessionStorage.getItem("lp_callsign") || "UNKNOWN";
}

export function getInitialRoleId(): string {
  return sessionStorage.getItem("lp_assignedRole") || "crew";
}

export function getAssignedRole(): Role {
  const roleId = sessionStorage.getItem("lp_assignedRole");
  return ROLES.find((r) => r.id === roleId) ?? ROLES.find((r) => r.id === "crew") ?? ROLES[0];
}

export function getOrbitResult(): { type: string; data?: unknown } | null {
  try { return JSON.parse(sessionStorage.getItem("lp_orbit_result") ?? "null"); } catch { return null; }
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
