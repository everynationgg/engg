import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable, gameResultsTable, playerStatsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

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
      user,
      stats: stats || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 },
      activities: activities.slice(0, 15),
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch user profile");
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

export default router;
