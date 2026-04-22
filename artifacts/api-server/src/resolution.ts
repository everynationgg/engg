import type { Session, AbilityLogEntry } from "./sessions.js";

export interface PrivateFeedback {
  type:
    | "blocked"
    | "disrupt_ineffective"
    | "scan_player"
    | "scan_deck"
    | "alien_view"
    | "seek_result"
    | "sentinel_report"
    | "commander_boost"
    | "warper_swap"
    | "shifter_exchange"
    | "skipped"
    | "no_action"
    | "passive"
    | "no_ability";
  data?: unknown;
}

// Strict resolution order. Sentinel fires first so it can see every subsequent
// action that affects its watch target. Its feedback is compiled in a second
// pass after all other abilities have executed and the actionLog is complete.
// Seeker is placed at the end to reflect the 'last' role after any swaps/shifts.
const ROLE_ORDER = [
  "sentinel",
  "scanner",
  "alien",
  "disruptor",
  "parasite",
  "commander",
  "warper",
  "shifter",
  "seeker",
];

export function runResolution(
  session: Session,
): { feedback: { [playerId: string]: PrivateFeedback }; abilityLog: AbilityLogEntry[] } {
  // Snapshot roles before any mutations. Warper and Shifter mutate
  // session.rolesAssigned during resolution; using this snapshot for actor
  // discovery ensures every player is processed under the role they actually
  // held at the start of the orbit phase, so logs and feedback are always
  // based on the submitted action, not the post-swap state.
  const startRoles: Record<string, string> = { ...session.rolesAssigned };

  const blockedPlayers = new Set<string>();
  // actionLog[targetId] = list of observable events that happened to that player
  const actionLog: { [targetId: string]: string[] } = {};
  // Sentinel watch targets registered in pass 1, reports compiled in pass 2
  const sentinelWatchTargets: { [sentinelId: string]: string } = {};

  const feedback: { [playerId: string]: PrivateFeedback } = {};
  const abilityLog: AbilityLogEntry[] = [];
  const loggedPlayerIds = new Set<string>();

  function logInternal(targetId: string, desc: string) {
    if (!actionLog[targetId]) actionLog[targetId] = [];
    actionLog[targetId].push(desc);
  }

  function logActor(actorName: string, actorId: string, event: string) {
    abilityLog.push({ actorName, event });
    loggedPlayerIds.add(actorId);
  }

  // ── Pass 1: resolve all roles in strict order ────────────────────────────
  for (const roleId of ROLE_ORDER) {
    // Use the pre-resolution snapshot so that mid-resolution role swaps
    // (Warper, Shifter) do not affect which player is treated as which role.
    const actors = session.players.filter(
      (p) => startRoles[p.id] === roleId,
    );

    for (const actor of actors) {
      const action = session.orbitActions[actor.id];

      // No submission
      if (!action) {
        feedback[actor.id] = { type: "no_action" };
        logActor(actor.name, actor.id, "did not submit an action");
        continue;
      }

      // Voluntary skip
      if (action.type === "skip") {
        feedback[actor.id] = { type: "skipped" };
        logActor(actor.name, actor.id, "skipped their ability");
        continue;
      }

      // Passive/none submission (crew, parasite auto-submit)
      if (action.type === "passive" || action.type === "none") {
        feedback[actor.id] = { type: roleId === "parasite" ? "passive" : "no_ability" };
        logActor(actor.name, actor.id,
          roleId === "parasite"
            ? "monitored via passive ability"
            : "has no active ability this round",
        );
        continue;
      }

      // Block check — Sentinel and Scanner are immune (Sentinel fires before Disruptor;
      // Scanner is explicitly unblockable by design)
      const immuneToBlock = roleId === "scanner" || roleId === "sentinel";
      if (!immuneToBlock && blockedPlayers.has(actor.id)) {
        feedback[actor.id] = { type: "blocked" };
        logActor(actor.name, actor.id, "ability was blocked");
        continue;
      }

      switch (roleId) {
        // ── Sentinel: register watch target now; compile report in pass 2 ──
        case "sentinel": {
          const targetId = action.targets[0];
          if (targetId) {
            sentinelWatchTargets[actor.id] = targetId;
            const target = session.players.find((p) => p.id === targetId);
            // Log the action now (correct position in abilityLog); feedback deferred
            logActor(actor.name, actor.id, `observed ${target?.name ?? "a player"}`);
            // Remove from loggedPlayerIds so pass-2 can finalize feedback without
            // hitting the catch-all loop, but we must NOT re-add to abilityLog.
            // We keep it in loggedPlayerIds to prevent the catch-all from logging again.
          } else {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "did not select a watch target");
          }
          break;
        }

        // ── Scanner ──────────────────────────────────────────────────────
        case "scanner": {
          if (action.type === "scan_player") {
            const target = session.players.find((p) => p.id === action.targets[0]);
            if (target) {
              const initialRole = session.initialRoles[target.id] ?? "unknown";
              feedback[actor.id] = {
                type: "scan_player",
                data: { targetName: target.name, roleId: initialRole },
              };
              logInternal(target.id, "role was inspected by a scanner");
              logActor(actor.name, actor.id, `scanned ${target.name}`);
            }
          } else if (action.type === "scan_deck") {
            const roles = action.targets.map((t) => {
              const idx = parseInt(t.replace("center_", ""), 10);
              return session.centerCards[idx] ?? "unknown";
            });
            feedback[actor.id] = { type: "scan_deck", data: { roles } };
            logActor(actor.name, actor.id, "scanned the central deck");
          } else {
            logActor(actor.name, actor.id, "used an unrecognised scan action");
          }
          break;
        }

        // ── Alien ─────────────────────────────────────────────────────────
        case "alien": {
          if (action.type === "alien_view") {
            const idx = parseInt(
              (action.targets[0] ?? "center_0").replace("center_", ""),
              10,
            );
            const cardRole = session.centerCards[idx] ?? "unknown";
            feedback[actor.id] = {
              type: "alien_view",
              data: { cardIndex: idx, roleId: cardRole },
            };
            logActor(actor.name, actor.id, "reviewed a hidden card from the central deck");
          } else {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "used their ability");
          }
          break;
        }

        // ── Disruptor ─────────────────────────────────────────────────────
        case "disruptor": {
          const targetId = action.targets[0];
          const targetRole = session.rolesAssigned[targetId];
          const targetPlayer = session.players.find((p) => p.id === targetId);
          if (targetRole === "scanner") {
            // Scanner is immune — don't reveal who was targeted
            feedback[actor.id] = { type: "disrupt_ineffective" };
            logActor(actor.name, actor.id, "attempted a block — target was immune");
          } else {
            blockedPlayers.add(targetId);
            logInternal(targetId, "ability was blocked");
            logActor(actor.name, actor.id, `blocked ${targetPlayer?.name ?? "a player"}'s ability`);
          }
          break;
        }

        // ── Parasite: passive, already handled above via action.type check ─
        case "parasite": {
          feedback[actor.id] = { type: "passive" };
          logActor(actor.name, actor.id, "monitored via passive ability");
          break;
        }

        // ── Seeker ────────────────────────────────────────────────────────
        case "seeker": {
          const target = session.players.find((p) => p.id === action.targets[0]);
          if (target) {
            const role = session.rolesAssigned[target.id];
            const alignment = role === "alien" || role === "parasite" ? "Bad" : "Good";
            feedback[actor.id] = {
              type: "seek_result",
              data: { targetName: target.name, alignment },
            };
            logInternal(target.id, "alignment was checked");
            logActor(actor.name, actor.id, `checked ${target.name}'s alignment`);
          } else {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "attempted an alignment check — no valid target");
          }
          break;
        }

        // ── Commander ─────────────────────────────────────────────────────
        case "commander": {
          feedback[actor.id] = { type: "commander_boost", data: { granted: true } };
          logActor(actor.name, actor.id, "activated vote boost — vote counts as ×2");
          break;
        }

        // ── Warper ────────────────────────────────────────────────────────
        case "warper": {
          const [tA, tB] = action.targets;
          if (tA && tB) {
            const roleA = session.rolesAssigned[tA];
            const roleB = session.rolesAssigned[tB];
            session.rolesAssigned[tA] = roleB;
            session.rolesAssigned[tB] = roleA;
            logInternal(tA, "role was swapped by a warper");
            logInternal(tB, "role was swapped by a warper");
            const playerA = session.players.find((p) => p.id === tA);
            const playerB = session.players.find((p) => p.id === tB);
            feedback[actor.id] = {
              type: "warper_swap",
              data: { playerAName: playerA?.name ?? "Player A", playerBName: playerB?.name ?? "Player B" },
            };
            logActor(
              actor.name,
              actor.id,
              `swapped the roles of ${playerA?.name ?? "Player A"} and ${playerB?.name ?? "Player B"}`,
            );
          } else {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "used their ability (incomplete targets)");
          }
          break;
        }

        // ── Shifter ───────────────────────────────────────────────────────
        case "shifter": {
          const targetId = action.targets[0];
          const actorRole = session.rolesAssigned[actor.id];
          const targetRole = session.rolesAssigned[targetId];
          session.rolesAssigned[actor.id] = targetRole;
          session.rolesAssigned[targetId] = actorRole;
          const targetPlayer = session.players.find((p) => p.id === targetId);
          logInternal(actor.id, "role was changed by a shifter");
          logInternal(targetId, "role was changed by a shifter");
          feedback[actor.id] = {
            type: "shifter_exchange",
            data: { targetName: targetPlayer?.name ?? "a player", acquiredRole: targetRole },
          };
          logActor(actor.name, actor.id, `exchanged roles with ${targetPlayer?.name ?? "a player"}`);
          break;
        }

        default: {
          feedback[actor.id] = { type: "no_action" };
          logActor(actor.name, actor.id, "used their ability");
        }
      }
    }
  }

  // ── Pass 2: compile Sentinel reports (actionLog is now complete) ─────────
  for (const [sentinelId, targetId] of Object.entries(sentinelWatchTargets)) {
    const target = session.players.find((p) => p.id === targetId);
    if (!target) continue;
    const actions = actionLog[targetId] ?? [];
    feedback[sentinelId] = {
      type: "sentinel_report",
      data: { targetName: target.name, actions },
    };
    // abilityLog entry already written in pass 1; do not duplicate
  }

  // ── Catch-all: players with no ability not yet logged (e.g. crew) ─────────
  for (const player of session.players) {
    if (!loggedPlayerIds.has(player.id)) {
      feedback[player.id] = { type: "no_ability" };
      logActor(player.name, player.id, "has no active ability this round");
    }
  }

  return { feedback, abilityLog };
}
