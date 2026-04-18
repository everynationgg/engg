import { Router, type IRouter } from "express";
import { db, achievementsTable, userAchievementsTable, playerStatsTable, gameResultsTable } from "@workspace/db";
import type { Achievement } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// Achievement definitions — seeded idempotently on first request
const ACHIEVEMENTS_SEED: Omit<Achievement, "createdAt">[] = [
  { id: "achievement_first_win",        slug: "first_win",            name: "First Victory",  description: "Win your first game",                         icon: "🏆", rarity: "common",    pointsRequired: 0 },
  { id: "achievement_5_wins",           slug: "5_wins",               name: "Getting Started", description: "Achieve 5 wins",                             icon: "⭐", rarity: "common",    pointsRequired: 0 },
  { id: "achievement_10_wins",          slug: "10_wins",              name: "Rising Star",    description: "Achieve 10 wins",                             icon: "✨", rarity: "common",    pointsRequired: 0 },
  { id: "achievement_25_wins",          slug: "25_wins",              name: "Veteran",        description: "Achieve 25 wins",                             icon: "💪", rarity: "rare",      pointsRequired: 0 },
  { id: "achievement_50_wins",          slug: "50_wins",              name: "Legendary",      description: "Achieve 50 wins",                             icon: "👑", rarity: "epic",      pointsRequired: 0 },
  { id: "achievement_100_games",        slug: "100_games",            name: "Collector",      description: "Play 100 games",                              icon: "🎮", rarity: "rare",      pointsRequired: 0 },
  { id: "achievement_crew_master",      slug: "crew_master",          name: "Crew Master",    description: "Win 10 games as crew",                        icon: "👨‍🚀", rarity: "rare",   pointsRequired: 0 },
  { id: "achievement_alien_master",     slug: "alien_master",         name: "Alien Master",   description: "Win 10 games as alien",                       icon: "👽", rarity: "rare",      pointsRequired: 0 },
  { id: "achievement_50_percent_winrate", slug: "50_percent_winrate", name: "Balanced",       description: "Achieve 50% win rate (10+ games)",            icon: "⚖️", rarity: "epic",     pointsRequired: 0 },
  { id: "achievement_unstoppable",      slug: "unstoppable",          name: "Unstoppable",    description: "Achieve 75% win rate (20+ games)",            icon: "🚀", rarity: "legendary", pointsRequired: 0 },
];

/** IDs that should be unlocked given a player's current stats and per-role win counts. */
function eligibleAchievementIds(
  stats: { gamesPlayed: number; gamesWon: number },
  roleWins: Record<string, number>,
): string[] {
  const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0;
  const ids: string[] = [];
  if (stats.gamesWon >= 1)  ids.push("achievement_first_win");
  if (stats.gamesWon >= 5)  ids.push("achievement_5_wins");
  if (stats.gamesWon >= 10) ids.push("achievement_10_wins");
  if (stats.gamesWon >= 25) ids.push("achievement_25_wins");
  if (stats.gamesWon >= 50) ids.push("achievement_50_wins");
  if (stats.gamesPlayed >= 100) ids.push("achievement_100_games");
  if ((roleWins["crew"] ?? 0) >= 10)  ids.push("achievement_crew_master");
  if ((roleWins["alien"] ?? 0) >= 10) ids.push("achievement_alien_master");
  if (stats.gamesPlayed >= 10 && winRate >= 50)  ids.push("achievement_50_percent_winrate");
  if (stats.gamesPlayed >= 20 && winRate >= 75)  ids.push("achievement_unstoppable");
  return ids;
}

// Get all achievements
router.get("/achievements", async (_req, res) => {
  try {
    // onConflictDoNothing makes this idempotent and race-safe
    await db.insert(achievementsTable).values(ACHIEVEMENTS_SEED).onConflictDoNothing();
    const achievements = await db.select().from(achievementsTable);
    res.json(achievements);
  } catch (error) {
    logger.error({ err: error }, "Get achievements error");
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's achievements
router.get("/user/achievements", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Fetch everything needed in parallel, including per-role wins for role-based achievements
    const [unlockedAchievements, allAchievements, userStats, roleStats] = await Promise.all([
      db
        .select({
          achievement: achievementsTable,
          unlockedAt: userAchievementsTable.unlockedAt,
        })
        .from(userAchievementsTable)
        .innerJoin(achievementsTable, eq(userAchievementsTable.achievementId, achievementsTable.id))
        .where(eq(userAchievementsTable.userId, req.userId)),
      db.select().from(achievementsTable),
      db
        .select({ gamesPlayed: playerStatsTable.gamesPlayed, gamesWon: playerStatsTable.gamesWon })
        .from(playerStatsTable)
        .where(eq(playerStatsTable.userId, req.userId))
        .limit(1),
      // Per-role win counts — needed for crew_master / alien_master achievements
      db
        .select({
          role: gameResultsTable.role,
          wins: sql<number>`cast(sum(case when ${gameResultsTable.won} = 'yes' then 1 else 0 end) as int)`,
        })
        .from(gameResultsTable)
        .where(eq(gameResultsTable.userId, req.userId))
        .groupBy(gameResultsTable.role),
    ]);

    const stats = userStats[0];
    // Build role → wins map for role-specific achievement checks
    const roleWins: Record<string, number> = Object.fromEntries(
      roleStats.map((r) => [r.role, r.wins]),
    );
    const unlockedIds = new Set(unlockedAchievements.map((ua) => ua.achievement.id));

    // Unlock new achievements if eligible
    if (stats) {
      const toUnlock = eligibleAchievementIds(stats, roleWins).filter((id) => !unlockedIds.has(id));

      if (toUnlock.length > 0) {
        await db
          .insert(userAchievementsTable)
          .values(toUnlock.map((achievementId) => ({ userId: req.userId!, achievementId })))
          .onConflictDoNothing();

        // Reflect newly unlocked items in the response
        toUnlock.forEach((id) => unlockedIds.add(id));
      }
    }

    // Re-fetch unlocked timestamps (includes any just inserted)
    const finalUnlocked = await db
      .select({
        achievement: achievementsTable,
        unlockedAt: userAchievementsTable.unlockedAt,
      })
      .from(userAchievementsTable)
      .innerJoin(achievementsTable, eq(userAchievementsTable.achievementId, achievementsTable.id))
      .where(eq(userAchievementsTable.userId, req.userId));

    const unlockedAtMap = new Map(
      finalUnlocked.map((ua) => [ua.achievement.id, ua.unlockedAt])
    );
    const unlockedSet = new Set(unlockedAtMap.keys());

    res.json({
      totalAchievements: allAchievements.length,
      unlockedCount: finalUnlocked.length,
      achievements: allAchievements.map((achievement) => ({
        ...achievement,
        unlocked: unlockedSet.has(achievement.id),
        unlockedAt: unlockedAtMap.get(achievement.id) ?? null,
      })),
    });
  } catch (error) {
    logger.error({ err: error }, "Get user achievements error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
