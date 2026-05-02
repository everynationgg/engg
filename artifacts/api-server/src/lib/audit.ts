import { db, systemAuditLogsTable } from "@workspace/db";
import { type Request } from "express";
import { logger } from "./logger.js";

export async function logAudit(params: {
  userId?: string | null;
  eventType: string;
  description?: string;
  metadata?: Record<string, any>;
  req?: Request;
}) {
  const { userId, eventType, description, metadata, req } = params;
  
  // Extract IP if request object is provided
  const ipAddress = req ? (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress) : undefined;

  // Database column might be strict UUID; sanitize guest IDs
  const isUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const sanitizedUserId = isUuid ? userId : null;

  try {
    await db.insert(systemAuditLogsTable).values({
      userId: sanitizedUserId,
      eventType,
      description,
      metadata: metadata || {},
      ipAddress,
    });
  } catch (err) {
    // We log but don't crash if auditing fails, to prevent DoS on critical paths
    logger.error({ err, eventType, userId }, "Failed to persist audit log to database");
  }
}
