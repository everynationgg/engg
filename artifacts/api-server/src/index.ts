
import http from "node:http";
import app from "./app.js";
import { attachSocketIO } from "./socket.js";
import { logger } from "./lib/logger.js";
import { restoreSessionsFromDb, startSnapshotJob } from "./lib/session-persistence.js";
import { migrateDb } from "./lib/migrate.js";
import { pool } from "@workspace/db";
import { redisClient } from "./config/redis.js";


// Register SMTP email provider
import { setupSmtpEmailProvider } from "./setup-email-provider.js";
setupSmtpEmailProvider();

// Add /health endpoint for instant health checks
// This is a "Truthful Health Check" that verifies core dependencies.
app.get && app.get("/health", async (req, res) => {
  const status: Record<string, string> = {
    db: "unknown",
    redis: "unknown",
  };

  try {
    // 1. Database Liveness Probe with 2s timeout
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db_timeout")), 2000)
      ),
    ]);
    status.db = "up";

    // 2. Redis Readiness Probe
    // We use the internal status property of ioredis
    if (redisClient.status === "ready") {
      status.redis = "up";
    } else {
      status.redis = "degraded";
      logger.warn({ redisStatus: redisClient.status }, "HEALTH_CHECK: Redis is in a degraded state");
    }

    res.status(200).json({
      status: "OK",
      ...status,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    // If DB is down, we return 503 (Service Unavailable)
    // If only Redis is degraded, we still return 200 (since we fail-open),
    // but the status object will reflect the degradation.
    const isDbDown = status.db !== "up";
    res.status(isDbDown ? 503 : 200).json({
      status: isDbDown ? "DEGRADED" : "OK",
      ...status,
      error: err?.message || "internal_health_check_failure",
      timestamp: new Date().toISOString(),
    });
  }
});


const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 10000;
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Global error handlers to log all uncaught errors and promise rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (typeof logger !== 'undefined') logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  if (typeof logger !== 'undefined') logger.error({ reason }, 'Unhandled Rejection');
  process.exit(1);
});


const httpServer = http.createServer(app);
const io = attachSocketIO(httpServer);
app.set("io", io);

// Start listening IMMEDIATELY so Fly.io/health-checks pass.
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`>>> SERVER STARTING ON PORT ${port} (0.0.0.0)`);
  logger.info({ port }, "Server listening (initial phase)");

  // Start initialization tasks in the background so we don't block the health check.
  (async () => {
    try {
      console.log(">>> Starting DB migrations...");
      await migrateDb();

      console.log(">>> Restoring sessions from DB...");
      await restoreSessionsFromDb();

      // Optional Dev Seeding (Dynamic Import)
      if (process.env.NODE_ENV === "development") {
        try {
          const { seedDevUser } = await import("./seed-dev.js");
          console.log(">>> Seeding dev identities...");
          await seedDevUser();
        } catch (err) {
          console.log(">>> Skip dev seeding (seed-dev.ts not found or ignored)");
        }
      }


      console.log(">>> Starting snapshot job...");
      startSnapshotJob(30_000);

      console.log(">>> SERVER FULLY INITIALIZED");
    } catch (err) {
      console.error("!!! Background initialization failed:", err);
      logger.error({ err }, "Background initialization failed");
    }
  })();

  // Log TTS availability
  if (process.env.OPENAI_API_KEY) {
    logger.info("OpenAI TTS is configured");
  } else {
    logger.warn(
      "OPENAI_API_KEY is not set — the /api/tts endpoint will return 503.",
    );
  }
});

httpServer.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
