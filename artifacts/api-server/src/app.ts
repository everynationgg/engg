import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();
app.set("trust proxy", 1);
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
  max: 10, // stricter limit for auth routes
  message: { error: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);

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

app.use(express.json({ limit: "10kb" })); // limit body size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use("/api", router);

// Global error handler - never expose internal errors
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;