import http from "node:http";
import app from "./app.js";
import { attachSocketIO } from "./socket.js";
import { logger } from "./lib/logger.js";
import { restoreSessionsFromDb, startSnapshotJob } from "./lib/session-persistence.js";
import { migrateDb } from "./lib/migrate.js";

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 10000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = http.createServer(app);
attachSocketIO(httpServer);

// Ensure required DB tables exist before restoring sessions or accepting traffic.
// Failures are caught inside migrateDb — the server always starts.
await migrateDb();

// Restore persisted sessions from PostgreSQL into Redis before accepting traffic.
// Failures are caught inside restoreSessionsFromDb — the server always starts.
await restoreSessionsFromDb();

httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening");

  // Log TTS availability so operators can spot a missing key early.
  if (process.env.OPENAI_API_KEY) {
    logger.info("OpenAI TTS is configured");
  } else {
    logger.warn(
      "OPENAI_API_KEY is not set — the /api/tts endpoint will return 503. " +
        "Set it via `fly secrets set OPENAI_API_KEY=sk-...` or in your environment.",
    );
  }

  // Start the periodic snapshot job after the server is ready.
  // Snapshots every 30 s; set to 60_000 to reduce DB writes in low-traffic envs.
  startSnapshotJob(30_000);
});

httpServer.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});
