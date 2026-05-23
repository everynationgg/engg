import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable, gameResultsTable, playerStatsTable, operationHistoryTable, userMissionsTable, missionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, registeredOnly, type AuthRequest } from "../auth/middleware";
import { logger } from "../../../lib/logger.js";
import crypto from "node:crypto";

const router: IRouter = Router();

router.get("/user/profile", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Fetch user basic info
    const [user] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        credits: usersTable.credits,
        xp: usersTable.xp,
        level: usersTable.level,
        isVerified: usersTable.isVerified,
        currentStreak: usersTable.currentStreak,
        lastClaimedAt: usersTable.lastClaimedAt,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Calculate XP for next level (simple linear for now: 500 XP per level)
    const xpForNextLevel = user.level * 500;
    const levelProgress = (user.xp % 500) / 500;

    // Fetch stats
    const [stats] = await db
      .select()
      .from(playerStatsTable)
      .where(eq(playerStatsTable.userId, userId))
      .limit(1);

    // Fetch unified activity history
    const history = await db
      .select()
      .from(operationHistoryTable)
      .where(eq(operationHistoryTable.userId, userId))
      .orderBy(desc(operationHistoryTable.createdAt))
      .limit(15);

    const activities = history.map(h => ({
      id: h.id,
      type: h.type.toLowerCase(),
      description: h.description,
      amount: h.creditsGained,
      xp: h.xpGained,
      timestamp: h.createdAt.toISOString(),
      metadata: h.metadata
    }));

    // Fetch active missions
    const missions = await db
      .select({
        id: missionsTable.id,
        name: missionsTable.name,
        description: missionsTable.description,
        progress: userMissionsTable.progress,
        reqValue: missionsTable.requirementValue,
        reqType: missionsTable.requirementType,
        xpReward: missionsTable.xpReward,
        creditReward: missionsTable.creditReward,
      })
      .from(userMissionsTable)
      .innerJoin(missionsTable, eq(userMissionsTable.missionId, missionsTable.id))
      .where(sql`${userMissionsTable.userId} = ${userId} AND ${userMissionsTable.isCompleted} = false`);

    res.json({
      user: {
        ...user,
        xpForNextLevel,
        levelProgress,
        currentStreak: user.currentStreak,
      },
      stats: stats || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 },
      activities: activities.slice(0, 15),
      missions,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch user profile");
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

export default router;
