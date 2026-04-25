import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { logReplay } from "./replay-log";
import * as Sentry from "@sentry/node";
import i18next from "./i18n";
import { BasicAIBot } from "./ai-bot";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  tracesSampleRate: 1.0,
});

const app: Express = express();
app.set("trust proxy", true); // Trust all proxies in the chain (Vercel + Fly.io)
// Security headers
app.use(helmet());

const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://engg.online",
  "https://www.engg.online",
  "https://end.engg.online",
]);

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true; // Non-browser clients / health probes

  if (/\.vercel\.app$/.test(origin)) return true;
  if (DEFAULT_ALLOWED_ORIGINS.has(origin)) return true;

  const envOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return envOrigins.includes(origin);
}

// CORS - allow explicit custom domains plus *.vercel.app previews.
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin ?? "unknown"}`));
  },
  credentials: true,
}));

// Health check — registered before rate limiters so uptime probes (Fly.io,
// Render, etc.) are never blocked by a 429, regardless of traffic.
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
app.get("/api/healthz", (_req, res) => {
  res.status(200).send("OK");
});

// Rate limiting - prevent brute force
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per window (increased from 100)
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip health checks and chat-poll endpoints. Chat polling has its own
  // dedicated chatPollLimiter in chat.ts, so counting it here too would
  // cause players to exhaust the global quota in minutes.
  skip: (req: Request) => {
    const path = req.originalUrl.split("?")[0];
    return (
      path === "/health" ||
      path === "/api/healthz" ||
      /^\/api\/games\/[^/]+\/chat\/since\//.test(path)
    );
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // increased from 10 to allow more breathing room for testing
  message: { error: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);

// Basic cheat detection middleware
function detectCheat(req: Request, res: Response, next: NextFunction) {
  // Example: Check for impossible moves or rate limits
  // Log suspicious actions for review
  // TODO: Expand with more rules as needed
  next();
}

app.use(detectCheat);

// Request logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(express.json({
  limit: "10kb",
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
})); // limit body size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use("/api", router);

// GDPR/CCPA endpoints
app.get("/api/privacy/export", (req, res) => {
  // TODO: Export user data
  res.json({ message: "Data export not implemented yet." });
});

app.delete("/api/privacy/delete", (req, res) => {
  // TODO: Delete user data
  res.json({ message: "Data deletion not implemented yet." });
});

// Global error handler - never expose internal errors
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

// Example: Call logReplay(gameId, replayData) at the end of each game session
app.use(logReplay);

// Example usage: i18next.t("welcome")
// TODO: Integrate with API responses and UI

// Example: Use BasicAIBot in game session logic where bots are needed
// Example usage: i18next.t("welcome")
// TODO: Integrate with API responses and UI

export default app;