import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable, gameResultsTable, playerStatsTable, operationHistoryTable, userMissionsTable, missionsTable } from "@workspace/db";
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

    // Base Reward: 10 CC + 50 XP
    let rewardAmount = 10;
    const xpAmount = 50;
    
    let leveledUp = false;
    let newLevel = 1;
    let newStreak = 1;

    await db.transaction(async (tx) => {
      // 1. Fetch current user
      const [currentUser] = await tx.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (currentUser?.lastClaimedAt) {
        const lastClaim = new Date(currentUser.lastClaimedAt);
        const now = new Date();
        const diffMs = now.getTime() - lastClaim.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 48) {
          // Streak continues if claimed within 48 hours
          newStreak = (currentUser.currentStreak || 0) + 1;
        } else if (diffHours < 72) {
          // Soft Reset: Drop streak by 1 instead of resetting (Safety Net)
          newStreak = Math.max((currentUser.currentStreak || 0) - 1, 1);
        } else {
          // Hard Reset
          newStreak = 1;
        }
      }

      // 1. Base Reward Logic
      // Streak Bonus: +2 CC per streak day, cap at +20
      const baseStreakBonus = Math.min((newStreak - 1) * 2, 20);
      rewardAmount += baseStreakBonus;

      // 2. Milestone Bonus (Day 3 / Day 7)
      let milestoneBonus = 0;
      if (newStreak === 3) milestoneBonus = 10;
      if (newStreak === 7) milestoneBonus = 50;
      
      rewardAmount += milestoneBonus;

      const updatedXp = (currentUser?.xp || 0) + xpAmount;
      newLevel = Math.floor(updatedXp / 500) + 1;
      leveledUp = newLevel > (currentUser?.level || 1);

      // 3. Update balance, XP, and Streak
      await tx
        .update(usersTable)
        .set({ 
          credits: sql`${usersTable.credits} + ${rewardAmount}`,
          xp: updatedXp,
          level: newLevel,
          currentStreak: newStreak,
          lastClaimedAt: new Date()
        })
        .where(eq(usersTable.id, userId));

      // 4. Record transaction
      await tx.insert(creditTransactionsTable).values({
        id: crypto.randomUUID(),
        userId,
        username: currentUser?.username || "Unknown",
        email: currentUser?.email || "Unknown",
        amount: rewardAmount,
        type: "daily_reward",
        description: `Daily_Sync_Success (Streak: ${newStreak})${milestoneBonus > 0 ? ` | MILESTONE_BONUS: +${milestoneBonus}` : ""}`,
      });

      // 5. Record Operation History (Unified Log)
      await tx.insert(operationHistoryTable).values({
        id: crypto.randomUUID(),
        userId,
        type: "DAILY_STREAK",
        xpGained: xpAmount,
        creditsGained: rewardAmount,
        description: `Daily_Tactical_Sync: ${newStreak}_DAY_STREAK${milestoneBonus > 0 ? " (MILESTONE)" : ""}`,
        metadata: { streak: newStreak, bonus: baseStreakBonus, milestone: milestoneBonus },
        createdAt: new Date()
      });
    });

    logger.info({ userId, newStreak, rewardAmount }, "Daily streak reward claimed");
    res.json({ success: true, amount: rewardAmount, xp: xpAmount, leveledUp, newLevel, streak: newStreak });
  } catch (error) {
    logger.error({ error }, "Failed to claim daily reward");
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;
