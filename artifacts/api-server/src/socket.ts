import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "node:http";
import { logger } from "./lib/logger.js";
import { redisPub, redisSub } from "./config/redis.js";
import { initSockets } from "./modules/core/sockets/init.js";

/**
 * Initialize the Socket.IO server, attach it to the HTTP server,
 * and register all game event handlers.
 */
export function attachSocketIO(httpServer: HttpServer): SocketIOServer {
  const envOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
  const defaultAllowedOrigins = new Set([
    "https://every-nation.vercel.app",
    "https://errant-night.vercel.app",
    "https://engg.online",
    "https://www.engg.online",
    "https://end.engg.online",
  ]);

  const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow server-to-server or non-browser requests
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowed =
      /\.vercel\.app$/.test(origin)
      || defaultAllowedOrigins.has(origin)
      || defaultAllowedOrigins.has(origin.replace(/\/$/, "")) // Handle trailing slash
      || envOrigins.includes(origin);

    if (allowed) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  };

  const io = new SocketIOServer(httpServer, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"], credentials: true },
    path: "/socket.io",
    transports: ["polling", "websocket"],
    pingTimeout: 90000,
    pingInterval: 25000,
  });

  // ── Redis adapter — enables multi-instance Socket.IO (rooms/emits across nodes) ──
  io.adapter(createAdapter(redisPub, redisSub));

  // Register all feature-based handlers (session, game, chat)
  initSockets(io);

  logger.info("Socket.IO server initialized with Redis adapter");
  return io;
}
