import { Router } from "express";
import { db, systemAuditLogsTable } from "@workspace/db";
import { authenticateAdmin } from "../lib/auth.js";
import { desc, eq, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

// Apply admin protection to all routes in this router
router.use(authenticateAdmin);

/**
 * GET /api/admin/logs
 * Fetch paginated and filterable audit logs.
 */
router.get("/logs", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const eventType = req.query.eventType as string;
    const userId = req.query.userId as string;
    const sessionId = req.query.sessionId as string;

    const conditions = [];

    if (eventType) {
      conditions.push(eq(systemAuditLogsTable.eventType, eventType));
    }
    if (userId) {
      conditions.push(eq(systemAuditLogsTable.userId, userId));
    }
    if (sessionId) {
      // Filter by sessionId inside the JSONB metadata
      conditions.push(sql`${systemAuditLogsTable.metadata}->>'sessionId' = ${sessionId}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(systemAuditLogsTable)
      .where(whereClause)
      .orderBy(desc(systemAuditLogsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination info
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemAuditLogsTable)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    res.json({
      logs: logs.map(l => ({ ...l, id: l.id.toString() })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch audit logs");
    res.status(500).json({ error: "Internal server error during log retrieval" });
  }
});

export default router;
