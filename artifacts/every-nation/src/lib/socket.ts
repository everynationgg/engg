import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "";

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io(API_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      auth: {
        token: token || localStorage.getItem("lp_auth_token")
      }
    });

    socket.on("connect", () => {
      console.log("[Signal Uplink] Connected:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[Signal Uplink] Connection Error:", err.message);
    });
  } else if (token) {
    // Update token if provided and already connected
    socket.auth = { token };
    if (socket.connected) {
      // Some versions of socket.io-client might need a manual refresh or just 
      // rely on the next reconnect, but for private rooms we usually want to 
      // reconnect if the token changes.
      socket.disconnect().connect();
    }
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
