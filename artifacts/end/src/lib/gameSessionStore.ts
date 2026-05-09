const SESSION_KEYS = {
  callsign: "lp_callsign",
  roomCode: "lp_roomCode",
  isCreating: "lp_isCreating",
  userId: "lp_userId",
  assignedRole: "lp_assignedRole",
  totalPlayers: "lp_totalPlayers",
  orbitInfo: "lp_orbit_info",
  orbitResult: "lp_orbit_result",
  playerId: "lp_playerId",
  playerToken: "lp_playerToken",
  activeRoom: "lp_activeRoom",
} as const;

const LEGACY_HOST_KEY = "lp_isHost";

function normalizeRoomCode(roomCode: string | null | undefined): string {
  return (roomCode ?? "").trim().toUpperCase();
}

function normalizeCallsign(callsign: string): string {
  return callsign.trim().toUpperCase();
}

function roomKey(prefix: string, roomCode: string): string {
  return `${prefix}_${normalizeRoomCode(roomCode)}`;
}

function readSession(key: string): string | null {
  return sessionStorage.getItem(key);
}

function readLocal(key: string): string | null {
  return localStorage.getItem(key);
}

function writeSession(key: string, value: string): void {
  sessionStorage.setItem(key, value);
}

function writeLocal(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export const gameSessionStore = {
  keys: SESSION_KEYS,

  normalizeRoomCode,
  normalizeCallsign,

  getRoomCode(fallback = ""): string {
    return readSession(SESSION_KEYS.roomCode) || readLocal(SESSION_KEYS.roomCode) || fallback;
  },

  setRoomCode(roomCode: string): string {
    const code = normalizeRoomCode(roomCode);
    if (code) {
      writeSession(SESSION_KEYS.roomCode, code);
      writeLocal(SESSION_KEYS.roomCode, code);
      writeLocal(SESSION_KEYS.activeRoom, code);
    }
    return code;
  },

  getCallsign(fallback = ""): string {
    return readSession(SESSION_KEYS.callsign) || readLocal(SESSION_KEYS.callsign) || fallback;
  },

  setCallsign(callsign: string): string {
    const value = normalizeCallsign(callsign);
    if (value) {
      writeSession(SESSION_KEYS.callsign, value);
      writeLocal(SESSION_KEYS.callsign, value);
    }
    return value;
  },

  markCreating(): void {
    writeSession(SESSION_KEYS.isCreating, "true");
  },

  consumeIsCreating(): boolean {
    const value = readSession(SESSION_KEYS.isCreating) === "true";
    sessionStorage.removeItem(SESSION_KEYS.isCreating);
    return value;
  },

  isCreating(): boolean {
    return readSession(SESSION_KEYS.isCreating) === "true";
  },

  getUserId(roomCode?: string): string | null {
    const code = normalizeRoomCode(roomCode);
    return (
      (code ? readLocal(roomKey(SESSION_KEYS.userId, code)) : null) ||
      readSession(SESSION_KEYS.userId) ||
      readLocal(SESSION_KEYS.userId)
    );
  },

  setUserId(userId: string, roomCode?: string): void {
    if (!userId) return;
    const code = normalizeRoomCode(roomCode);
    writeSession(SESSION_KEYS.userId, userId);
    writeLocal(SESSION_KEYS.userId, userId);
    if (code) writeLocal(roomKey(SESSION_KEYS.userId, code), userId);
  },

  getPlayerId(roomCode?: string): string | null {
    const code = normalizeRoomCode(roomCode);
    return readSession(SESSION_KEYS.playerId) || (code ? readLocal(roomKey(SESSION_KEYS.playerId, code)) : null);
  },

  setPlayerId(playerId: string, roomCode?: string): void {
    if (!playerId) return;
    const code = normalizeRoomCode(roomCode);
    writeSession(SESSION_KEYS.playerId, playerId);
    if (code) writeLocal(roomKey(SESSION_KEYS.playerId, code), playerId);
  },

  ensurePlayerId(roomCode: string): string {
    const existing = this.getPlayerId(roomCode);
    if (existing) return existing;

    const playerId = crypto.randomUUID();
    this.setPlayerId(playerId, roomCode);
    this.clearPlayerToken(roomCode);
    return playerId;
  },

  getPlayerToken(roomCode?: string): string | null {
    const code = normalizeRoomCode(roomCode);
    return readSession(SESSION_KEYS.playerToken) || (code ? readLocal(roomKey(SESSION_KEYS.playerToken, code)) : null);
  },

  setPlayerToken(token: string, roomCode?: string): void {
    if (!token) return;
    const code = normalizeRoomCode(roomCode);
    writeSession(SESSION_KEYS.playerToken, token);
    if (code) writeLocal(roomKey(SESSION_KEYS.playerToken, code), token);
  },

  clearPlayerToken(roomCode?: string): void {
    const code = normalizeRoomCode(roomCode);
    sessionStorage.removeItem(SESSION_KEYS.playerToken);
    if (code) localStorage.removeItem(roomKey(SESSION_KEYS.playerToken, code));
  },

  getAssignedRole(fallback = ""): string {
    return readSession(SESSION_KEYS.assignedRole) || fallback;
  },

  setAssignedRole(roleId: string): void {
    if (roleId) writeSession(SESSION_KEYS.assignedRole, roleId);
  },

  clearAssignedRole(): void {
    sessionStorage.removeItem(SESSION_KEYS.assignedRole);
  },

  getTotalPlayers(fallback = ""): string {
    return readSession(SESSION_KEYS.totalPlayers) || fallback;
  },

  setTotalPlayers(total: number): void {
    writeSession(SESSION_KEYS.totalPlayers, String(total));
  },

  getOrbitInfo(): string | null {
    return readSession(SESSION_KEYS.orbitInfo);
  },

  setOrbitInfo(value: unknown): void {
    writeSession(SESSION_KEYS.orbitInfo, JSON.stringify(value));
  },

  clearOrbitInfo(): void {
    sessionStorage.removeItem(SESSION_KEYS.orbitInfo);
  },

  getOrbitResult(): string | null {
    return readSession(SESSION_KEYS.orbitResult);
  },

  setOrbitResult(value: unknown): void {
    writeSession(SESSION_KEYS.orbitResult, JSON.stringify(value));
  },

  clearOrbitResult(): void {
    sessionStorage.removeItem(SESSION_KEYS.orbitResult);
  },

  isHost(roomCode?: string): boolean {
    const code = normalizeRoomCode(roomCode);
    return (
      (code && readSession(roomKey(LEGACY_HOST_KEY, code)) === "true") ||
      readSession(LEGACY_HOST_KEY) === "true"
    );
  },

  setHost(roomCode: string, value = true): void {
    const code = normalizeRoomCode(roomCode);
    if (!code) return;
    writeSession(roomKey(LEGACY_HOST_KEY, code), String(value));
    sessionStorage.removeItem(LEGACY_HOST_KEY);
  },

  clearHost(roomCode?: string): void {
    const code = normalizeRoomCode(roomCode);
    sessionStorage.removeItem(LEGACY_HOST_KEY);
    if (code) sessionStorage.removeItem(roomKey(LEGACY_HOST_KEY, code));
  },

  getActiveRoom(): string | null {
    return readLocal(SESSION_KEYS.activeRoom);
  },

  setActiveRoom(roomCode: string): void {
    const code = normalizeRoomCode(roomCode);
    if (code) writeLocal(SESSION_KEYS.activeRoom, code);
  },

  clearActiveRoom(roomCode?: string): void {
    const code = normalizeRoomCode(roomCode);
    if (!code || readLocal(SESSION_KEYS.activeRoom) === code) {
      localStorage.removeItem(SESSION_KEYS.activeRoom);
    }
  },

  clearVolatileGameState(roomCode?: string): void {
    const code = normalizeRoomCode(roomCode || this.getRoomCode());
    sessionStorage.removeItem(SESSION_KEYS.roomCode);
    sessionStorage.removeItem(SESSION_KEYS.isCreating);
    sessionStorage.removeItem(SESSION_KEYS.userId);
    sessionStorage.removeItem(SESSION_KEYS.assignedRole);
    sessionStorage.removeItem(SESSION_KEYS.totalPlayers);
    sessionStorage.removeItem(SESSION_KEYS.orbitInfo);
    sessionStorage.removeItem(SESSION_KEYS.orbitResult);
    sessionStorage.removeItem(SESSION_KEYS.playerId);
    sessionStorage.removeItem(SESSION_KEYS.playerToken);
    this.clearHost(code);
    this.clearActiveRoom(code);
  },
};
