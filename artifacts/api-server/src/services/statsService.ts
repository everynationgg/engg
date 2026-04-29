import { randomUUID } from "node:crypto";
import { db, gameResultsTable, playerStatsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { syncUserAchievements } from "../routes/achievements.js";

export async function recordPlayerGameResult(
  sessionId: string,
  userId: string,
  role: string,
  wonStatus: "yes" | "no" | "draw",
  alignment?: string
): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(gameResultsTable)
        .where(sql`${gameResultsTable.gameId} = ${sessionId} AND ${gameResultsTable.userId} = ${userId}`)
        .limit(1);
      
      if (existing.length > 0) return false; 

      await tx.insert(gameResultsTable).values({
        id: randomUUID(),
        gameId: sessionId,
        userId: userId,
        role: role,
        won: wonStatus,
        alignment: alignment,
      });

      await tx.insert(playerStatsTable)
        .values({
          id: randomUUID(),
          userId: userId,
          gamesPlayed: 1,
          gamesWon: wonStatus === "yes" ? 1 : 0,
          gamesLost: wonStatus === "no" ? 1 : 0,
        })
        .onConflictDoUpdate({
          target: playerStatsTable.userId,
          set: {
            gamesPlayed: sql`${playerStatsTable.gamesPlayed} + 1`,
            gamesWon: wonStatus === "yes" ? sql`${playerStatsTable.gamesWon} + 1` : playerStatsTable.gamesWon,
            gamesLost: wonStatus === "no" ? sql`${playerStatsTable.gamesLost} + 1` : playerStatsTable.gamesLost,
            updatedAt: new Date(),
          }
        });

      return true;
    });
  } catch (err) {
    logger.error({ err, sessionId, userId }, "Failed to record player game result");
    return false;
  }
}
