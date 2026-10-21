import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable, gameResultsTable, playerStatsTable, operationHistoryTable, userMissionsTable, missionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, registeredOnly, type AuthRequest } from "../auth/middleware";
import { logger } from "../../../lib/logger.js";
import { hashPassword, comparePassword } from "../../../lib/auth.js";
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
        credits: user.credits ?? 0,
        xp: user.xp ?? 0,
        level: user.level ?? 1,
        lastDailyClaim: user.lastClaimedAt,
        xpForNextLevel,
        levelProgress,
        currentStreak: user.currentStreak,
      },
      lastDailyClaim: user.lastClaimedAt,
      lastClaimedAt: user.lastClaimedAt,
      stats: stats || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 },
      activities: activities.slice(0, 15),
      missions,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch user profile");
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

router.post("/user/update-password", authMiddleware, registeredOnly, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      res.status(400).json({ error: "New password must contain at least one letter and one number" });
      return;
    }

    const [user] = await db
      .select({ id: usersTable.id, passwordHash: usersTable.passwordHash })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ error: "Incorrect current password" });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db
      .update(usersTable)
      .set({ passwordHash: newHash })
      .where(eq(usersTable.id, userId));

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to update password");
    res.status(500).json({ error: "Failed to update password" });
  }
});

router.post("/user/claim-daily", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const DAILY_CREDIT_REWARD = 50;
    const DAILY_XP_REWARD = 25;
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;

    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user) {
        return { status: "not_found" as const };
      }

      if (
        user.lastClaimedAt &&
        Date.now() - new Date(user.lastClaimedAt).getTime() < COOLDOWN_MS
      ) {
        return { status: "cooldown" as const };
      }

      const now = new Date();
      const newXp = (user.xp ?? 0) + DAILY_XP_REWARD;
      const newLevel = Math.floor(newXp / 500) + 1;
      const newStreak = (user.currentStreak || 0) + 1;

      const [updated] = await tx
        .update(usersTable)
        .set({
          credits: sql`COALESCE(${usersTable.credits}, 0) + ${DAILY_CREDIT_REWARD}`,
          xp: newXp,
          level: newLevel,
          currentStreak: newStreak,
          lastClaimedAt: now,
        })
        .where(eq(usersTable.id, userId))
        .returning({
          credits: usersTable.credits,
          xp: usersTable.xp,
          level: usersTable.level,
          currentStreak: usersTable.currentStreak,
          lastClaimedAt: usersTable.lastClaimedAt,
        });

      await tx.insert(creditTransactionsTable).values({
        id: crypto.randomUUID(),
        userId,
        username: user.username,
        email: user.email,
        amount: DAILY_CREDIT_REWARD,
        type: "reward",
        description: "Daily Login Reward",
        createdAt: now,
      });

      await tx.insert(operationHistoryTable).values({
        id: crypto.randomUUID(),
        userId,
        type: "DAILY_BONUS",
        xpGained: DAILY_XP_REWARD,
        creditsGained: DAILY_CREDIT_REWARD,
        description: "Daily Login Reward",
        createdAt: now,
      });

      return {
        status: "claimed" as const,
        credits: updated.credits,
        xp: updated.xp,
        level: updated.level,
        currentStreak: updated.currentStreak,
        lastDailyClaim: updated.lastClaimedAt,
      };
    });

    if (result.status === "not_found") {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (result.status === "cooldown") {
      res.status(400).json({ error: "Daily reward already claimed today." });
      return;
    }

    res.json({
      success: true,
      credits: result.credits,
      xp: result.xp,
      level: result.level,
      currentStreak: result.currentStreak,
      lastDailyClaim: result.lastDailyClaim,
    });
  } catch (error) {
    logger.error({ error }, "Failed to claim daily reward");
    res.status(500).json({ error: "Failed to claim daily reward" });
  }
});

export default router;
