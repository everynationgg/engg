import type { Server as SocketIOServer } from "socket.io";
import type { GameState, Player, PlayerAction } from "./engine.js";
import { submitAction, castVote } from "./engine.js";
import { logger } from "../../../lib/logger.js";

export type BotDifficulty = "easy" | "medium" | "hard" | "extreme";

export const BOT_NAMES = [
  "UNIT-01 (Bot)",
  "SYNTH-02 (Bot)",
  "NEXUS-03 (Bot)",
  "VALKYRIE-04 (Bot)",
  "TITAN-05 (Bot)",
  "SPECTRE-06 (Bot)",
  "AEGIS-07 (Bot)",
  "ORION-08 (Bot)",
  "VORTEX-09 (Bot)",
];

/**
 * Add a computer bot player to the lobby.
 */
export function addBot(session: GameState, difficulty: BotDifficulty = "medium"): Player | null {
  if (session.players.length >= 10) return null;

  // Pick first unused name
  const existingNames = new Set(session.players.map((p) => p.name));
  const botName = BOT_NAMES.find((n) => !existingNames.has(n)) || `BOT-${session.players.length + 1}`;
  const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const botPlayer: Player = {
    id: botId,
    playerId: botId,
    name: botName,
    isHost: false,
    isBot: true,
    botDifficulty: difficulty,
    connected: true,
    connectionStatus: "connected",
    isSpectator: false,
  };

  session.players.push(botPlayer);
  logger.info({ sessionId: session.sessionId, botName, difficulty }, "Bot added to lobby");
  return botPlayer;
}

/**
 * Remove a computer bot player from the lobby.
 */
export function removeBot(session: GameState, botId: string): boolean {
  const idx = session.players.findIndex((p) => (p.playerId === botId || p.id === botId) && p.isBot);
  if (idx === -1) return false;

  const [removed] = session.players.splice(idx, 1);
  const pId = removed.playerId || removed.id;
  delete session.rolesAssigned[pId];
  delete session.initialRoles[pId];
  delete session.orbitActions[pId];
  delete session.orbitFeedback[pId];
  delete session.votes[pId];
  session.orbitCompleted = session.orbitCompleted.filter((id) => id !== pId);
  session.roleAcknowledgements = session.roleAcknowledgements.filter((id) => id !== pId);

  logger.info({ sessionId: session.sessionId, botName: removed.name }, "Bot removed from lobby");
  return true;
}

/**
 * Handle bot role reveal acknowledgements.
 */
export function handleBotRoleReveal(session: GameState): boolean {
  if (session.phase !== "role_reveal") return false;

  let changed = false;
  for (const p of session.players) {
    if (!p.isBot) continue;
    const pId = p.playerId || p.id;
    if (!session.roleAcknowledgements.includes(pId)) {
      session.roleAcknowledgements.push(pId);
      changed = true;
    }
  }
  return changed;
}

/**
 * Handle bot actions during Orbit phase.
 */
export function handleBotOrbitActions(session: GameState): boolean {
  if (session.phase !== "orbit_action" || !session.phaseReady) return false;

  let changed = false;
  const otherPlayers = session.players.filter((p) => !p.isSpectator);

  for (const p of session.players) {
    if (!p.isBot) continue;
    const pId = p.playerId || p.id;
    if (session.orbitCompleted.includes(pId)) continue;

    const role = session.rolesAssigned[pId] || "crew";
    const opponents = otherPlayers.filter((o) => (o.playerId || o.id) !== pId);
    const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
    const randomOpponentId = randomOpponent ? randomOpponent.playerId || randomOpponent.id : "";

    let action: PlayerAction = { type: "none", targets: [] };

    switch (role) {
      case "scanner":
        action = randomOpponentId
          ? { type: "scan_player", targets: [randomOpponentId] }
          : { type: "none", targets: [] };
        break;

      case "disruptor":
        action = randomOpponentId
          ? { type: "disrupt", targets: [randomOpponentId] }
          : { type: "none", targets: [] };
        break;

      case "shifter":
        if (opponents.length >= 2) {
          const t1 = opponents[0].playerId || opponents[0].id;
          const t2 = opponents[1].playerId || opponents[1].id;
          action = { type: "shift", targets: [t1, t2] };
        } else {
          action = { type: "none", targets: [] };
        }
        break;

      case "alien":
        action = { type: "alien_view", targets: [] };
        break;

      case "sentinel":
        action = randomOpponentId
          ? { type: "watch", targets: [randomOpponentId] }
          : { type: "none", targets: [] };
        break;

      default:
        action = { type: "none", targets: [] };
        break;
    }

    const res = submitAction(session, pId, action);
    if (res.accepted) {
      changed = true;
    }
  }

  return changed;
}

/** Track timestamps of last bot chat message per session */
const botChatTimers = new Map<string, number>();

/**
 * Handle bot quick chat utterances during discussion phase.
 */
export function handleBotDiscussionChat(
  io: SocketIOServer,
  session: GameState,
  timeInPhase: number
): void {
  if (session.phase !== "discussion") return;

  const bots = session.players.filter((p) => p.isBot);
  if (bots.length === 0) return;

  const lastChat = botChatTimers.get(session.sessionId) || 0;
  // Bot speaks at most once every 12 to 18 seconds
  if (Date.now() - lastChat < 12_000) return;

  // Pick a random bot
  const bot = bots[Math.floor(Math.random() * bots.length)];
  const botId = bot.playerId || bot.id;
  const role = session.rolesAssigned[botId] || "crew";
  const diff = bot.botDifficulty || "medium";

  const nonBots = session.players.filter((p) => !p.isBot);
  const target = nonBots.length > 0
    ? nonBots[Math.floor(Math.random() * nonBots.length)].name
    : "someone";

  let text = "";

  if (diff === "easy") {
    const easyLines = [
      "I am Crew! My station was quiet.",
      "Who should we vote for?",
      "Agreed! 👍",
      "Don't vote me, I'm innocent!",
      "Time is running out! ⏳",
    ];
    text = easyLines[Math.floor(Math.random() * easyLines.length)];
  } else if (diff === "medium") {
    if (role === "alien") {
      text = Math.random() > 0.5 ? `I suspect ${target}!` : "I am Crew! Trust me.";
    } else if (role === "scanner") {
      text = `I scanned ${target} -> Result: Crew`;
    } else {
      text = Math.random() > 0.5 ? `Why so quiet, ${target}?` : "Skip voting this round!";
    }
  } else {
    // Hard and Extreme: strategic bluffing
    if (role === "alien") {
      const bluff = [
        `I scanned ${target} -> Result: Alien! Vote them out!`,
        `${target} is lying! Vote them!`,
        "I was Sentinel, my shield held!",
        `I suspect ${target}!`,
      ];
      text = bluff[Math.floor(Math.random() * bluff.length)];
    } else {
      const crewLines = [
        `I trust ${target}`,
        `Wait, hear me out! Who swapped roles?`,
        `Vote for ${target}!`,
        `${target} is lying!`,
      ];
      text = crewLines[Math.floor(Math.random() * crewLines.length)];
    }
  }

  if (text) {
    botChatTimers.set(session.sessionId, Date.now());
    io.to(session.sessionId).emit("chat_message", {
      id: `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: null,
      guestName: bot.name,
      message: text,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle bot voting during voting phase.
 */
export function handleBotVoting(session: GameState): boolean {
  if (session.phase !== "voting" || !session.phaseReady) return false;

  let changed = false;
  const allEligible = session.players.filter((p) => !p.isSpectator);

  for (const bot of session.players) {
    if (!bot.isBot) continue;
    const botId = bot.playerId || bot.id;
    if (session.votes[botId]) continue; // already voted

    const candidates = allEligible.filter((p) => (p.playerId || p.id) !== botId);
    if (candidates.length === 0) continue;

    const role = session.rolesAssigned[botId] || "crew";
    const diff = bot.botDifficulty || "medium";

    let targetId = "";

    if (diff === "easy") {
      // Pick completely at random
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      targetId = pick.playerId || pick.id;
    } else if (diff === "medium") {
      // Pick human player if available, else random
      const humans = candidates.filter((p) => !p.isBot);
      const pick = humans.length > 0 ? humans[Math.floor(Math.random() * humans.length)] : candidates[0];
      targetId = pick.playerId || pick.id;
    } else {
      // Hard / Extreme
      if (role === "alien") {
        // Vote for a non-alien candidate
        const nonAliens = candidates.filter((c) => {
          const cId = c.playerId || c.id;
          return session.rolesAssigned[cId] !== "alien";
        });
        const pick = nonAliens.length > 0 ? nonAliens[0] : candidates[0];
        targetId = pick.playerId || pick.id;
      } else {
        // Vote for suspected alien or random candidate
        const aliens = candidates.filter((c) => {
          const cId = c.playerId || c.id;
          return session.rolesAssigned[cId] === "alien";
        });
        // Extreme bots have higher chance to identify alien
        if (diff === "extreme" && aliens.length > 0 && Math.random() > 0.3) {
          targetId = aliens[0].playerId || aliens[0].id;
        } else {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          targetId = pick.playerId || pick.id;
        }
      }
    }

    if (targetId) {
      const res = castVote(session, botId, targetId);
      if (res.accepted) {
        changed = true;
      }
    }
  }

  return changed;
}
