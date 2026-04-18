import { Router, type IRouter } from "express";
import { sessionMetrics, getRedisState } from "../sessions.js";

// ── /api/metrics — Prometheus-compatible text endpoint ────────────────────────
//
// Format: Prometheus text exposition format v0.0.4.
// Scrape with Prometheus (job `api_server`) or curl:
//   curl -s http://localhost:3000/api/metrics
//
// All counters are monotonically increasing since process start.
// Gauges reflect current state at scrape time.
//
// Security: this endpoint is mounted under /api and inherits the global
// rate limiter.  If you expose it to an external Prometheus scraper, ensure
// it is behind network controls (e.g. internal-only ingress, mTLS) so you
// do not leak operational data to the public internet.

const router: IRouter = Router();

/** Format a single Prometheus metric block (HELP + TYPE + value line). */
function metric(
  name: string,
  type: "counter" | "gauge",
  help: string,
  value: number | string,
): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} ${type}\n${name} ${value}\n`;
}

router.get("/metrics", (_req, res) => {
  const m = sessionMetrics;
  const redisState = getRedisState();

  // Conflict rate: proportion of saveSession calls that resulted in a CAS conflict.
  // Useful for spotting hot sessions (many concurrent writers) or mis-sized retry windows.
  const conflictRate =
    m.saveSessionTotal > 0
      ? (m.casConflicts / m.saveSessionTotal).toFixed(4)
      : "0";

  // Average latencies — accumulated sum / total calls.
  // Reset to 0 gracefully before the first call.
  const avgGetLatencyMs =
    m.getSessionTotal > 0
      ? (m.getSessionLatencyMsSum / m.getSessionTotal).toFixed(2)
      : "0";
  const avgSaveLatencyMs =
    m.saveSessionTotal > 0
      ? (m.saveSessionLatencyMsSum / m.saveSessionTotal).toFixed(2)
      : "0";

  const body = [
    // ── CAS / concurrency ──────────────────────────────────────────────────
    metric(
      "session_cas_conflicts_total",
      "counter",
      "Total CAS version conflicts — concurrent writes collided on the same session",
      m.casConflicts,
    ),
    metric(
      "session_cas_retries_total",
      "counter",
      "Total CAS retry loop iterations triggered by version conflicts",
      m.casRetries,
    ),
    metric(
      "session_cas_conflict_rate",
      "gauge",
      "Proportion of saveSession calls that resulted in a CAS conflict (0–1)",
      conflictRate,
    ),

    // ── Lock contention ────────────────────────────────────────────────────
    metric(
      "session_lock_acquisitions_total",
      "counter",
      "Total successful distributed lock acquisitions (create_session only)",
      m.lockAcquisitions,
    ),
    metric(
      "session_lock_timeouts_total",
      "counter",
      "Total times a lock acquisition timed out — high value indicates Redis contention",
      m.lockTimeouts,
    ),

    // ── Redis health / backpressure ────────────────────────────────────────
    metric(
      "session_redis_ops_inflight",
      "gauge",
      "Current number of in-flight Redis commands",
      m.redisOpsInFlight,
    ),
    metric(
      "session_redis_errors_total",
      "counter",
      "Total Redis command errors (connection failures, timeouts, Lua eval errors)",
      m.redisErrors,
    ),
    metric(
      "session_redis_degraded",
      "gauge",
      "1 when the session layer is serving reads from the in-memory fallback cache, 0 when healthy",
      redisState === "degraded" ? 1 : 0,
    ),

    // ── In-memory fallback ─────────────────────────────────────────────────
    metric(
      "session_cache_hits_total",
      "counter",
      "Total session reads served from the in-memory fallback cache during Redis degradation",
      m.sessionCacheHits,
    ),

    // ── Latency ───────────────────────────────────────────────────────────
    metric(
      "session_get_latency_ms_avg",
      "gauge",
      "Average getSession end-to-end latency in milliseconds (since process start)",
      avgGetLatencyMs,
    ),
    metric(
      "session_save_latency_ms_avg",
      "gauge",
      "Average saveSession end-to-end latency in milliseconds (since process start)",
      avgSaveLatencyMs,
    ),
    metric(
      "session_get_total",
      "counter",
      "Total getSession calls completed (success + error)",
      m.getSessionTotal,
    ),
    metric(
      "session_save_total",
      "counter",
      "Total saveSession calls completed (success + conflict + error)",
      m.saveSessionTotal,
    ),
  ].join("");

  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(body);
});

export default router;
