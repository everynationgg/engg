import { db, missionsTable, userMissionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

/**
 * Ensures a user has a set of active missions.
 * If they have none, it pulls a random set from the pool.
 */
export async function ensureUserMissions(userId: string) {
  // 1. Check for active missions
  const activeMissions = await db
    .select()
    .from(userMissionsTable)
    .where(sql`${userMissionsTable.userId} = ${userId} AND ${userMissionsTable.isCompleted} = false`);

  if (activeMissions.length > 0) return activeMissions;

  // 2. Fetch missions by tier
  const dailyPool = await db.select().from(missionsTable).where(eq(missionsTable.tier, "DAILY"));
  const weeklyPool = await db.select().from(missionsTable).where(eq(missionsTable.tier, "WEEKLY"));
  
  if (dailyPool.length === 0 && weeklyPool.length === 0) return [];

  // 3. Select balanced set: 2 Daily + 1 Weekly (if available)
  const selection = [];
  
  // Pick 2 Daily
  const selectedDailies = dailyPool
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);
  selection.push(...selectedDailies);

  // Pick 1 Weekly
  const selectedWeekly = weeklyPool
    .sort(() => 0.5 - Math.random())
    .slice(0, 1);
  selection.push(...selectedWeekly);

  // 4. Assign to user
  for (const m of selection) {
    await db.insert(userMissionsTable).values({
      userId,
      missionId: m.id,
      progress: 0,
      isCompleted: false,
      updatedAt: new Date()
    }).onConflictDoNothing();
  }

  return selection;
}
