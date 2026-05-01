import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, playerStatsTable, gameResultsTable, usersTable, creditTransactionsTable, operationHistoryTable, missionsTable, userMissionsTable } from "@workspace/db";
import { ensureUserMissions } from "../../../lib/missions.js";
import { eq, desc, sql } from "drizzle-orm";
import {
  RecordGameResultBody,
  GetPlayerStatsResponse,
  GetLeaderboardResponse,
} from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../auth/middleware";
import { logger } from "../../../lib/logger";
import rateLimit from "express-rate-limit";

const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: "Too many requests." },
  validate: { trustProxy: false },
});
const router: IRouter = Router();

const VALID_ROLES = new Set([
  "alien", "crew", "commander", "scanner", "sentinel",
  "shifter", "warper", "disruptor", "parasite", "seeker",
]);

// Record game result
router.post("/stats/record-game", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = RecordGameResultBody.parse(req.body);
    if (!VALID_ROLES.has(body.role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const isWin = body.won === "yes";
    const winIncrement = isWin ? 1 : 0;
    const lossIncrement = isWin ? 0 : 1;

    // XP and Credit Reward Calculation
    const xpReward = isWin ? 100 : 40;
    const creditReward = isWin ? 50 : 10;

    // Single atomic upsert: insert the stats row, or increment in-place on conflict.
    const gameResult = await db.transaction(async (tx) => {
      // 0. Check for existing record to prevent double-counting
      const existing = await tx
        .select()
        .from(gameResultsTable)
        .where(sql`${gameResultsTable.gameId} = ${body.gameId} AND ${gameResultsTable.userId} = ${req.userId!}`)
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const [inserted] = await tx
        .insert(gameResultsTable)
        .values({
          id: randomUUID(),
          gameId: body.gameId,
          userId: req.userId!,
          role: body.role,
          won: body.won,
          alignment: body.alignment,
        })
        .returning();

      // Update Player Stats
      await tx
        .insert(playerStatsTable)
        .values({
          id: randomUUID(),
          userId: req.userId!,
          gamesPlayed: 1,
          gamesWon: winIncrement,
          gamesLost: lossIncrement,
        })
        .onConflictDoUpdate({
          target: playerStatsTable.userId,
          set: {
            gamesPlayed: sql`${playerStatsTable.gamesPlayed} + 1`,
            gamesWon: sql`${playerStatsTable.gamesWon} + ${winIncrement}`,
            gamesLost: sql`${playerStatsTable.gamesLost} + ${lossIncrement}`,
            updatedAt: new Date(),
          },
        });

      // Update User XP, Credits and Level
      const [user] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.userId!))
        .limit(1);

      if (user) {
        const newXp = user.xp + xpReward;
        const newLevel = Math.floor(newXp / 500) + 1;
        
        await tx.update(usersTable)
          .set({ 
            xp: newXp, 
            credits: sql`${usersTable.credits} + ${creditReward}`,
            level: newLevel 
          })
          .where(eq(usersTable.id, req.userId!));

        // Record Credit Transaction for History
        await tx.insert(creditTransactionsTable)
          .values({
            id: randomUUID(),
            userId: req.userId!,
            username: user.username,
            amount: creditReward,
            type: "REWARD",
            description: `Combat_Service_Reward: ${body.role.toUpperCase()}_Deployment (${body.won.toUpperCase()})`,
            createdAt: new Date()
          });

        // Record Operation History (Unified Log)
        await tx.insert(operationHistoryTable)
          .values({
            id: randomUUID(),
            userId: req.userId!,
            gameId: body.gameId,
            type: "MATCH_REWARD",
            xpGained: xpReward,
            creditsGained: creditReward,
            description: `Operation_${body.gameId.substring(0, 8)}: ${body.role.toUpperCase()}_DEPLOYMENT`,
            metadata: { role: body.role, won: body.won, alignment: body.alignment },
            createdAt: new Date()
          });

        // 5. Update Mission Progress
        const activeMissions = await tx
          .select({
            userId: userMissionsTable.userId,
            missionId: userMissionsTable.missionId,
            progress: userMissionsTable.progress,
            isCompleted: userMissionsTable.isCompleted,
            slug: missionsTable.slug,
            reqType: missionsTable.requirementType,
            reqValue: missionsTable.requirementValue,
            xpReward: missionsTable.xpReward,
            creditReward: missionsTable.creditReward,
          })
          .from(userMissionsTable)
          .innerJoin(missionsTable, eq(userMissionsTable.missionId, missionsTable.id))
          .where(sql`${userMissionsTable.userId} = ${req.userId!} AND ${userMissionsTable.isCompleted} = false`);

        for (const mission of activeMissions) {
          let progressIncrement = 0;
          if (mission.reqType === "GAMES_PLAYED") progressIncrement = 1;
          if (mission.reqType === "GAMES_WON" && isWin) progressIncrement = 1;

          if (progressIncrement > 0) {
            const newProgress = mission.progress + progressIncrement;
            const isNowCompleted = newProgress >= mission.reqValue;

            await tx.update(userMissionsTable)
              .set({ 
                progress: newProgress, 
                isCompleted: isNowCompleted,
                completedAt: isNowCompleted ? new Date() : null,
                updatedAt: new Date()
              })
              .where(sql`${userMissionsTable.userId} = ${req.userId!} AND ${userMissionsTable.missionId} = ${mission.missionId}`);

            if (isNowCompleted) {
              // Grant Mission Rewards
              await tx.update(usersTable)
                .set({ 
                  xp: sql`${usersTable.xp} + ${mission.xpReward}`,
                  credits: sql`${usersTable.credits} + ${mission.creditReward}`
                })
                .where(eq(usersTable.id, req.userId!));

              // Log Mission Completion
              await tx.insert(operationHistoryTable).values({
                id: randomUUID(),
                userId: req.userId!,
                type: "MISSION_COMPLETED",
                xpGained: mission.xpReward,
                creditsGained: mission.creditReward,
                description: `Mission_Success: ${mission.slug.toUpperCase()}`,
                metadata: { missionId: mission.missionId, slug: mission.slug },
                createdAt: new Date()
              });
            }
          }
        }

        // 6. Replenish missions if all completed (Runtime Trigger)
        try {
          await ensureUserMissions(req.userId!);
        } catch (err) {
          logger.error({ err, userId: req.userId }, "Failed to replenish missions during gameplay");
        }
      }

      return inserted;
    });

    if (!gameResult) {
      res.status(500).json({ error: "Failed to record game result" });
      return;
    }

    res.status(201).json({
      id: gameResult.id,
      gameId: gameResult.gameId,
      userId: gameResult.userId,
      role: gameResult.role,
      won: gameResult.won,
      completedAt: gameResult.completedAt,
      rewards: { xp: xpReward, credits: creditReward }
    });
  } catch (error) {
    logger.error({ err: error }, "Record game error");
    res.status(400).json({ error: "Invalid request" });
  }
});

// Get player stats
router.get("/stats/my-stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const stats = await db
      .select()
      .from(playerStatsTable)
      .where(eq(playerStatsTable.userId, req.userId))
      .limit(1);

    if (stats.length === 0) {
      const response: z.infer<typeof GetPlayerStatsResponse> = {
        id: randomUUID(),
        userId: req.userId,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        winRate: 0,
      };
      res.json(response);
      return;
    }

    const stat = stats[0];
    const winRate =
      stat.gamesPlayed === 0 ? 0 : (stat.gamesWon / stat.gamesPlayed) * 100;

    const response: z.infer<typeof GetPlayerStatsResponse> = {
      id: stat.id,
      userId: stat.userId,
      gamesPlayed: stat.gamesPlayed,
      gamesWon: stat.gamesWon,
      gamesLost: stat.gamesLost,
      winRate: parseFloat(winRate.toFixed(2)),
    };

    res.json(response);
  } catch (error) {
    logger.error({ err: error }, "Get stats error");
    res.status(500).json({ error: "Server error" });
  }
});

// Get leaderboard
router.get("/stats/leaderboard", leaderboardLimiter, async (req, res) => {
  try {
    const parsedLimit = parseInt(req.query.limit as string);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 10 : parsedLimit, 1), 100);

    // Single query: players with stats ordered by win rate, with total count in the same pass
    const [players, totalCount] = await Promise.all([
      db
        .select({
          userId: playerStatsTable.userId,
          username: usersTable.username,
          gamesPlayed: playerStatsTable.gamesPlayed,
          gamesWon: playerStatsTable.gamesWon,
          winRate: sql<number>`round(((cast(${playerStatsTable.gamesWon} as numeric) / ${playerStatsTable.gamesPlayed}) * 100), 2)`,
        })
        .from(playerStatsTable)
        .innerJoin(usersTable, eq(playerStatsTable.userId, usersTable.id))
        .where(sql`${playerStatsTable.gamesPlayed} > 0`)
        .orderBy(
          desc(
            sql`cast(${playerStatsTable.gamesWon} as float) / ${playerStatsTable.gamesPlayed}`
          )
        )
        .limit(limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(playerStatsTable)
        .where(sql`${playerStatsTable.gamesPlayed} > 0`),
    ]);

    const entries = players.map((player, index) => ({
      userId: player.userId,
      username: player.username,
      gamesPlayed: player.gamesPlayed,
      gamesWon: player.gamesWon,
      winRate: typeof player.winRate === "number" ? player.winRate : parseFloat(String(player.winRate)),
      rank: index + 1,
    }));

    const response: z.infer<typeof GetLeaderboardResponse> = {
      entries,
      totalPlayers: totalCount[0]?.count || 0,
    };

    res.json(response);
  } catch (error) {
    logger.error({ err: error }, "Get leaderboard error");
    res.status(500).json({ error: "Server error" });
  }
});

// Get stats by role for current user — aggregated in the DB with a single GROUP BY query
router.get("/stats/my-stats-by-role", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const roleStats = await db
      .select({
        role: gameResultsTable.role,
        gamesPlayed: sql<number>`cast(count(*) as int)`,
        gamesWon: sql<number>`cast(sum(case when ${gameResultsTable.won} = 'yes' then 1 else 0 end) as int)`,
      })
      .from(gameResultsTable)
      .where(eq(gameResultsTable.userId, req.userId))
      .groupBy(gameResultsTable.role)
      .orderBy(desc(sql`count(*)`));

    res.json(
      roleStats.map((s) => ({
        role: s.role,
        gamesPlayed: s.gamesPlayed,
        gamesWon: s.gamesWon,
        gamesLost: s.gamesPlayed - s.gamesWon,
        winRate:
          s.gamesPlayed === 0
            ? 0
            : parseFloat(((s.gamesWon / s.gamesPlayed) * 100).toFixed(2)),
      }))
    );
  } catch (error) {
    logger.error({ err: error }, "Get stats by role error");
    res.status(500).json({ error: "Server error" });
  }
});

// Get game history for current user
router.get("/stats/game-history", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const [gameHistory, totalCount] = await Promise.all([
      db
        .select({
          id: gameResultsTable.id,
          gameId: gameResultsTable.gameId,
          role: gameResultsTable.role,
          won: gameResultsTable.won,
          alignment: gameResultsTable.alignment,
          completedAt: gameResultsTable.completedAt,
        })
        .from(gameResultsTable)
        .where(eq(gameResultsTable.userId, req.userId))
        .orderBy(desc(gameResultsTable.completedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(gameResultsTable)
        .where(eq(gameResultsTable.userId, req.userId)),
    ]);

    res.json({
      games: gameHistory.map((game) => ({
        id: game.id,
        gameId: game.gameId,
        role: game.role,
        won: game.won,
        playedAt: game.completedAt,
      })),
      total: totalCount[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    logger.error({ err: error }, "Get game history error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
