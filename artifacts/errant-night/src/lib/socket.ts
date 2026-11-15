import { io, type Socket } from "socket.io-client";
import { systemToast } from "@/components/common/SystemToast";
import { API_BASE_URL } from "@/lib/constants";

const API_URL = API_BASE_URL;

/** Toast display durations for connection-related notifications (ms). */
const TOAST_DURATION_ERROR = 4000;
const TOAST_DURATION_WARNING = 3500;
const TOAST_DURATION_SUCCESS = 3000;

let socket: Socket | null = null;
let lifecycleListenersAttached = false;

function isAppHidden(): boolean {
  return typeof document !== "undefined" && document.hidden === true;
}

function ensureLifecycleListeners() {
  if (lifecycleListenersAttached || typeof document === "undefined") return;
  lifecycleListenersAttached = true;

  const tryReconnect = () => {
    if (!document.hidden && socket && !socket.connected) {
      if (import.meta.env.DEV) console.log("[socket] foreground/network recovered — reconnecting");
      setConnectionState("reconnecting");
      socket.connect();
    }
  };

  document.addEventListener("visibilitychange", tryReconnect);
  window.addEventListener("focus", tryReconnect);
  window.addEventListener("online", tryReconnect);
}

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
  return () => {
    connectionListeners.delete(cb);
  };
}

export function getConnectionState(): ConnectionState {
  return connectionState;
}

export function getSocket(token?: string): Socket {
  ensureLifecycleListeners();
  if (!socket) {
    socket = io(API_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      auth: {
        token: token || localStorage.getItem("lp_auth_token"),
      },
    });

    socket.on("connect", () => {
      if (import.meta.env.DEV) console.log("[socket] connected:", socket?.id);
      setConnectionState("connected");
    });

    socket.on("disconnect", (reason) => {
      if (import.meta.env.DEV) console.warn("[socket] disconnected:", reason);
      if (reason === "io client disconnect") {
        setConnectionState("disconnected");
      } else {
        // Server or transport drop: Socket.IO will automatically attempt reconnection
        setConnectionState("reconnecting");
        if (!isAppHidden()) {
          systemToast("Connection interrupted — reconnecting…", "warning", TOAST_DURATION_WARNING, "connection");
        }
      }
    });

    socket.on("connect_error", (err) => {
      if (import.meta.env.DEV) console.error("[socket] connect_error:", err.message);
      // Keep reconnecting state rather than rapidly toggling to disconnected
      if (connectionState !== "reconnecting") {
        setConnectionState("reconnecting");
      }
    });

    socket.on("reconnect_attempt", (n) => {
      if (import.meta.env.DEV) console.log("[socket] reconnect attempt", n);
      setConnectionState("reconnecting");
      // Toast only once on initial attempt when foregrounded
      if (n === 1 && !isAppHidden()) {
        systemToast("Reconnecting to match…", "warning", TOAST_DURATION_WARNING, "connection");
      }
    });

    socket.on("reconnect", (n) => {
      if (import.meta.env.DEV) console.log("[socket] reconnected after", n, "attempt(s)");
      setConnectionState("connected");
      if (!isAppHidden()) {
        systemToast("Connection restored", "success", TOAST_DURATION_SUCCESS, "connection");
      }
    });

    socket.on("reconnect_failed", () => {
      if (import.meta.env.DEV) console.warn("[socket] reconnect attempts exhausted");
      setConnectionState("disconnected");
      if (!isAppHidden()) {
        systemToast("Could not reach game server. Tap retry.", "error", TOAST_DURATION_ERROR, "connection");
      }
    });
  } else if (token) {
    // Only disconnect & re-auth if token has genuinely changed!
    const currentToken = (socket.auth as any)?.token;
    if (currentToken !== token) {
      socket.auth = { token };
      if (socket.connected) {
        socket.disconnect().connect();
      }
    }
  }
  return socket!;
}

export function retryConnection(): void {
  if (!socket) {
    getSocket();
    return;
  }
  if (!socket.connected) {
    setConnectionState("reconnecting");
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  setConnectionState("disconnected");
}
