import { io, type Socket } from "socket.io-client";
import { systemToast } from "@/components/SystemToast";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/** Toast display durations for connection-related notifications (ms). */
const TOAST_DURATION_ERROR = 4000;
const TOAST_DURATION_WARNING = 3500;
const TOAST_DURATION_SUCCESS = 3500;

let socket: Socket | null = null;

/* ---- Connection state (subscribable) ---- */

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

let connectionState: ConnectionState = "disconnected";
const connectionListeners = new Set<() => void>();

function setConnectionState(next: ConnectionState) {
  if (next === connectionState) return;
  connectionState = next;
  connectionListeners.forEach((fn) => fn());
}

/** Subscribe to connection state changes (for useSyncExternalStore). */
export function subscribeConnectionState(cb: () => void) {
  connectionListeners.add(cb);
  return () => { connectionListeners.delete(cb); };
}

export function getConnectionState() {
  return connectionState;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      if (import.meta.env.DEV) console.log("[socket] connected:", socket?.id);
      setConnectionState("connected");
    });
    socket.on("disconnect", (reason) => {
      if (import.meta.env.DEV) console.warn("[socket] disconnected:", reason);
      setConnectionState("disconnected");
      if (reason !== "io client disconnect") {
        systemToast("Connection lost", "error", TOAST_DURATION_ERROR, "connection");
      }
    });
    socket.on("connect_error", (err) => {
      if (import.meta.env.DEV) console.error("[socket] connect_error:", err.message);
    });
    socket.on("reconnect_attempt", (n) => {
      if (import.meta.env.DEV) console.log("[socket] reconnect attempt", n);
      setConnectionState("reconnecting");
      // Only toast on the first attempt to avoid spamming the user
      if (n === 1) systemToast("Reconnecting…", "warning", TOAST_DURATION_WARNING, "connection");
    });
    socket.on("reconnect", (n) => {
      if (import.meta.env.DEV) console.log("[socket] reconnected after", n, "attempt(s)");
      setConnectionState("connected");
      systemToast("Reconnected", "success", TOAST_DURATION_SUCCESS, "connection");
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  setConnectionState("disconnected");
}

