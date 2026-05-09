import { Server as SocketIOServer } from "socket.io";

import type { Server as HttpServer } from "node:http";
import { logger } from "./lib/logger.js";

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

  // ── Redis adapter removed — running single-instance Socket.IO ──

  // ── Security Middleware: JWT Authentication (Optional) ──
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          // Attach verified identity to the socket object if available
          socket.data.userId = decoded.userId;
        }
      }

      // Allow all connections (Guests). Specific handlers (like spending credits)
      // will verify the presence of userId independently.
      next();
    } catch (err) {
      // Treat as guest even on verification error to prevent blocking players
      next();
    }
  });

  // Register all feature-based handlers (session, game, chat)
  initSockets(io);

  logger.info("Socket.IO server initialized (Memory Adapter)");
  return io;
}
