
import http from "node:http";
import app from "./app.js";
import { attachSocketIO } from "./socket.js";
import { logger } from "./lib/logger.js";
import { restoreSessionsFromDb, startSnapshotJob } from "./lib/session-persistence.js";
import { migrateDb } from "./lib/migrate.js";

// Add /health endpoint for instant health checks
app.get && app.get("/health", (req, res) => {
  res.status(200).send("OK");
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
attachSocketIO(httpServer);

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
