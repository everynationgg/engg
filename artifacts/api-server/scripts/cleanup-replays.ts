// Cron job to clean up old replays (run every hour)
import { cleanupOldReplays } from "./replay-log";

(async () => {
  await cleanupOldReplays();
  process.exit(0);
})();
