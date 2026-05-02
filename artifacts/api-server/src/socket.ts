import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "node:http";
import { logger } from "./lib/logger.js";
import { redisPub, redisSub } from "./config/redis.js";
import { initSockets } from "./modules/core/sockets/init.js";
import { verifyToken } from "./lib/auth.js";

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
      /^https?:\/\/.*\.vercel\.app\/?$/.test(origin)
      || /^https?:\/\/.*\.fly\.dev\/?$/.test(origin)
      || defaultAllowedOrigins.has(origin)
      || defaultAllowedOrigins.has(origin.replace(/\/$/, ""))
      || envOrigins.includes(origin);

    if (!allowed) {
      logger.warn({ origin }, "CORS blocked for origin");
    }

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

  // ── Security Middleware: JWT Authentication ──
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        // Allow guest sockets for lobby browsing? No, we require auth for all operations.
        return next(new Error("Unauthorized: Signal Uplink requires a valid identity token."));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error("Unauthorized: Identity token invalid or expired."));
      }

      // Attach verified identity to the socket object
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Unauthorized: Authentication failure."));
    }
  });

  // Register all feature-based handlers (session, game, chat)
  initSockets(io);

  logger.info("Socket.IO server initialized with Redis adapter");
  return io;
}
