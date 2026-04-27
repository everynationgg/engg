import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable, gameResultsTable, playerStatsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";
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

    // Fetch recent credit transactions
    const transactions = await db
      .select()
      .from(creditTransactionsTable)
      .where(eq(creditTransactionsTable.userId, userId))
      .orderBy(desc(creditTransactionsTable.createdAt))
      .limit(10);

    // Fetch recent game results
    const results = await db
      .select()
      .from(gameResultsTable)
      .where(eq(gameResultsTable.userId, userId))
      .orderBy(desc(gameResultsTable.completedAt))
      .limit(10);

    // Combine into activity feed
    const activities = [
      ...transactions.map(t => ({
        id: `tx_${t.id}`,
        type: "purchase",
        description: t.description || "Operational Credits Allocated",
        amount: t.amount,
        timestamp: t.createdAt.toISOString(),
      })),
      ...results.map(r => ({
        id: `game_${r.id}`,
        type: "game_result",
        description: `Match as ${r.role} - ${r.won === "yes" ? "VICTORY" : "DEFEAT"}`,
        timestamp: r.completedAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      user: {
        ...user,
        xpForNextLevel,
        levelProgress,
      },
      stats: stats || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 },
      activities: activities.slice(0, 15),
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch user profile");
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

router.post("/user/claim-daily", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check if claimed in last 24 hours
    const lastReward = await db
      .select()
      .from(creditTransactionsTable)
      .where(sql`${creditTransactionsTable.userId} = ${userId} AND ${creditTransactionsTable.type} = 'daily_reward' AND ${creditTransactionsTable.createdAt} > NOW() - INTERVAL '24 hours'`)
      .limit(1);

    if (lastReward.length > 0) {
      res.status(400).json({ error: "DAILY_REWARD_ALREADY_CLAIMED" });
      return;
    }

    // Grant 10 CC + 50 XP
    const rewardAmount = 10;
    const xpAmount = 50;
    
    let leveledUp = false;
    let newLevel = 1;

    await db.transaction(async (tx) => {
      // 1. Fetch current user
      const [currentUser] = await tx.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      
      const updatedXp = (currentUser?.xp || 0) + xpAmount;
      newLevel = Math.floor(updatedXp / 500) + 1;
      leveledUp = newLevel > (currentUser?.level || 1);

      // 2. Update balance and XP
      await tx
        .update(usersTable)
        .set({ 
          credits: sql`${usersTable.credits} + ${rewardAmount}`,
          xp: updatedXp,
          level: newLevel
        })
        .where(eq(usersTable.id, userId));

      // 3. Record transaction
      await tx.insert(creditTransactionsTable).values({
        id: crypto.randomUUID(),
        userId,
        username: currentUser?.username || "Unknown",
        email: currentUser?.email || "Unknown",
        amount: rewardAmount,
        type: "daily_reward",
        description: leveledUp 
          ? `Daily Tactical Briefing Synchronized. PROMOTION_ACHIEVED: LEVEL ${newLevel}`
          : "Daily Tactical Briefing Synchronized",
      });
    });

    logger.info({ userId, leveledUp, newLevel }, "Daily reward claimed");
    res.json({ success: true, amount: rewardAmount, xp: xpAmount, leveledUp, newLevel });
  } catch (error) {
    logger.error({ error }, "Failed to claim daily reward");
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;
