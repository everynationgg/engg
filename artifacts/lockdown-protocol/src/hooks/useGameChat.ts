import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { getSocket } from "@/lib/socket";

export type ChatMessage =
  | { type: "player"; id: string; gameId: string; userId: string | null; username: string | null; message: string; timestamp: string }
  | { type: "system"; id: string; text: string; timestamp: string };

/** Raw player message shape from HTTP API and socket events (before union tagging). */
interface RawPlayerMessage {
  id?: string;
  gameId: string;
  userId: string | null;
  username: string | null;
  message: string;
  timestamp: string;
}

/** Type guard for player messages */
export function isPlayerMessage(msg: ChatMessage): msg is ChatMessage & { type: "player" } {
  return msg.type === "player";
}

/** Type guard for system messages */
export function isSystemMessage(msg: ChatMessage): msg is ChatMessage & { type: "system" } {
  return msg.type === "system";
}

/** Auto-incrementing fallback counter for messages without server IDs. */
let fallbackIdCounter = 0;

/** Convert legacy message (from HTTP API / older events) to typed ChatMessage */
function toPlayerMessage(raw: RawPlayerMessage): ChatMessage {
  return { type: "player", id: raw.id ?? `local-${Date.now()}-${++fallbackIdCounter}`, ...raw };
}

interface ChatTypingEvent {
  gameId: string;
  playerId: string;
  username: string;
  isTyping: boolean;
}

interface SystemChatEvent {
  id?: string;
  type: "system";
  text: string;
  timestamp: string;
}

const POLL_INTERVAL_OPEN_MS = 5_000;
const POLL_INTERVAL_BACKGROUND_MS = 15_000;

export function useGameChat(gameId: string | null, enabled = true, guestName?: string) {
  const { token, userId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [sessionDisabled, setSessionDisabled] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  // Use refs so timestamp updates never cause the interval to be recreated
  const lastFetchTimeRef = useRef<number>(Date.now());
  const lastSeenIdRef = useRef<string | null>(null);
  const backoffUntilRef = useRef<number>(0);
  const isTypingRef = useRef(false);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Track whether the chat panel is open so background polls know to increment unread
  const enabledRef = useRef(enabled);
  // Flag to suppress auto-scroll during history load
  const loadingHistoryRef = useRef(false);

  // Keep enabledRef in sync so the background-poll callback reads the latest value
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const appendIncomingMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;

    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const dedupedNew = incoming.filter((m) => !existingIds.has(m.id));

      if (dedupedNew.length === 0) return prev;
      if (!enabledRef.current) {
        setUnreadCount((c) => c + dedupedNew.length);
      }
      // Merge and sort chronologically by timestamp then id for stable ordering
      const merged = [...prev, ...dedupedNew];
      merged.sort((a, b) => {
        const tDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        if (tDiff !== 0) return tDiff;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      // Track latest seen id for cursor-based polling
      for (const m of dedupedNew) {
        if (m.type === "player" && m.id && !m.id.startsWith("local-") && !m.id.startsWith("sys-")) {
          if (!lastSeenIdRef.current || m.id > lastSeenIdRef.current) {
            lastSeenIdRef.current = m.id;
          }
        }
      }

      return merged;
    });

    lastFetchTimeRef.current = Date.now();
  }, []);

  const fetchChatHistory = useCallback(async () => {
    if (!gameId) return;

    setIsLoading(true);
    loadingHistoryRef.current = true;
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/games/${gameId}/chat?limit=50`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }

      const data = await response.json();
      const historyMessages: ChatMessage[] = (data.messages ?? []).map(toPlayerMessage);
      // Track latest seen id from history
      for (const m of historyMessages) {
        if (m.type === "player" && m.id && !m.id.startsWith("local-") && !m.id.startsWith("sys-")) {
          if (!lastSeenIdRef.current || m.id > lastSeenIdRef.current) {
            lastSeenIdRef.current = m.id;
          }
        }
      }
      // Preserve any system messages already received via socket — they are not
      // returned by the HTTP history endpoint so a plain setMessages() would wipe them.
      setMessages((prev) => {
        const sysMessages = prev.filter((m) => m.type === "system");
        const historyIds = new Set(historyMessages.map((m) => m.id));
        const uniqueSys = sysMessages.filter((m) => !historyIds.has(m.id));
        const merged = [...historyMessages, ...uniqueSys];
        merged.sort((a, b) => {
          const tDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          if (tDiff !== 0) return tDiff;
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });
        return merged;
      });
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch chat history";
      setError(message);
    } finally {
      setIsLoading(false);
      loadingHistoryRef.current = false;
    }
  }, [gameId]);

  const fetchNewMessages = useCallback(async () => {
    if (!gameId) return;
    // Respect backoff period after a 429
    if (Date.now() < backoffUntilRef.current) return;

    try {
      // Use cursor-based fetch when we have a last seen id, fallback to timestamp
      const cursorParam = lastSeenIdRef.current ? `?after_id=${lastSeenIdRef.current}` : "";
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/games/${gameId}/chat/since/${lastFetchTimeRef.current}${cursorParam}`
      );

      if (response.status === 429) {
        // Back off 30 s before retrying
        backoffUntilRef.current = Date.now() + 30_000;
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch new messages");
      }

      const data = await response.json();
      if (data.newMessageCount > 0) {
        appendIncomingMessages((data.messages as RawPlayerMessage[]).map(toPlayerMessage));
      }
    } catch (err) {
      // Silently fail on polling errors
      console.error("Error fetching new messages:", err);
    }
  }, [appendIncomingMessages, gameId]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const startTyping = useCallback(() => {
    if (!gameId) return;
    if (isTypingRef.current) return;

    const socket = getSocket();
    if (!socket.connected) return;
    isTypingRef.current = true;
    socket.emit("chat_typing_start", { sessionId: gameId });
  }, [gameId]);

  const stopTyping = useCallback(() => {
    if (!gameId) return;
    if (!isTypingRef.current) return;

    const socket = getSocket();
    isTypingRef.current = false;
    if (socket.connected) {
      socket.emit("chat_typing_stop", { sessionId: gameId });
    }
  }, [gameId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!gameId) {
        setError("No game selected");
        return;
      }
      // Guests must have a callsign to send
      if (!token && !guestName?.trim()) {
        setError("Enter a callsign before chatting");
        return;
      }

      // Clear any previous error so stale failures don't persist across retries
      setChatError(null);

      try {
        stopTyping();
        const socket = getSocket();
        if (socket.connected) {
          const socketResp = await new Promise<{ success: boolean; error?: string }>((resolve) => {
            socket.emit("send_chat_message", { sessionId: gameId, message }, (resp: { success: boolean; error?: string }) => {
              resolve(resp);
            });
          });

          if (!socketResp.success) {
            throw new Error(socketResp.error || "Failed to send message");
          }
          return;
        }

        // Socket not connected yet; fall back to HTTP send.
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const body: Record<string, string> = { message };
        if (!token && guestName?.trim()) {
          body.guestName = guestName.trim();
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/games/${gameId}/chat`,
          { method: "POST", headers, body: JSON.stringify(body) }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send message");
        }

        // Fetch new messages immediately after sending
        await fetchNewMessages();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send message";
        setError(message);
        setChatError(message);
      }
    },
    [token, guestName, gameId, fetchNewMessages, stopTyping]
  );

  const deleteMessage = useCallback(
    async (timestamp: string) => {
      if (!token || !gameId) {
        setError("Not authenticated or game not selected");
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/games/${gameId}/chat/${new Date(timestamp).getTime()}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete message");
        }

        // Remove message from state
        setMessages((prev) => prev.filter((msg) => msg.timestamp !== timestamp));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete message";
        setError(message);
      }
    },
    [token, gameId]
  );

  // Fetch initial chat history when enabled (e.g. modal opens)
  useEffect(() => {
    if (gameId && enabled) {
      fetchChatHistory();
    }
  }, [gameId, enabled, fetchChatHistory]);

  // Poll for new messages every 5 seconds when chat is open,
  // or every 15 seconds in background so unread count stays up-to-date.
  useEffect(() => {
    if (!gameId) return;

    const interval = setInterval(fetchNewMessages, enabled ? POLL_INTERVAL_OPEN_MS : POLL_INTERVAL_BACKGROUND_MS);
    return () => clearInterval(interval);
  }, [gameId, enabled, fetchNewMessages]);

  // Real-time receive path via Socket.IO; polling remains as resilience fallback.
  useEffect(() => {
    if (!gameId) return;

    const socket = getSocket();
    const onChatMessage = (msg: RawPlayerMessage) => {
      if (msg.gameId !== gameId) return;
      appendIncomingMessages([toPlayerMessage(msg)]);
    };

    socket.on("chat_message", onChatMessage);
    return () => {
      socket.off("chat_message", onChatMessage);
    };
  }, [appendIncomingMessages, gameId]);

  // System chat messages (lifecycle events rendered inline in chat)
  useEffect(() => {
    if (!gameId) return;

    const socket = getSocket();
    const onSystemChatMessage = (msg: SystemChatEvent) => {
      const id = msg.id ?? `sys-${Date.now()}-${++fallbackIdCounter}`;
      appendIncomingMessages([{ type: "system", id, text: msg.text, timestamp: msg.timestamp }]);
    };

    socket.on("chat_system_message", onSystemChatMessage);
    return () => {
      socket.off("chat_system_message", onSystemChatMessage);
    };
  }, [appendIncomingMessages, gameId]);

  // Chat history delivery on reconnect (last 20 messages)
  useEffect(() => {
    if (!gameId) return;

    const socket = getSocket();
    const onChatHistory = (msgs: RawPlayerMessage[]) => {
      appendIncomingMessages(msgs.map(toPlayerMessage));
    };

    socket.on("chat_history", onChatHistory);
    return () => {
      socket.off("chat_history", onChatHistory);
    };
  }, [appendIncomingMessages, gameId]);

  // Disable chat on session_closed
  useEffect(() => {
    if (!gameId) return;

    const socket = getSocket();
    const onSessionClosed = () => {
      setSessionDisabled(true);
    };

    socket.on("session_closed", onSessionClosed);
    return () => {
      socket.off("session_closed", onSessionClosed);
    };
  }, [gameId]);

  // Clear stale chat error whenever the socket reconnects so players see a
  // clean input state after their connection is restored.
  useEffect(() => {
    if (!gameId) return;

    const socket = getSocket();
    const onConnect = () => setChatError(null);

    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
    };
  }, [gameId]);

  // Listen for server-side chat_error events
  useEffect(() => {
    if (!gameId) return;

    const socket = getSocket();
    const onChatError = (data: { message: string }) => {
      setChatError(data.message);
    };

    socket.on("chat_error", onChatError);
    return () => {
      socket.off("chat_error", onChatError);
    };
  }, [gameId]);

  const clearChatError = useCallback(() => {
    setChatError(null);
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const socket = getSocket();
    const onChatTyping = (evt: ChatTypingEvent) => {
      if (evt.gameId !== gameId) return;
      if (!evt.username) {
        return;
      }

      if (evt.isTyping) {
        setTypingUsers((prev) => (prev.includes(evt.username) ? prev : [...prev, evt.username]));
        const prevTimer = typingTimeoutsRef.current.get(evt.username);
        if (prevTimer) clearTimeout(prevTimer);
        const timer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== evt.username));
          typingTimeoutsRef.current.delete(evt.username);
        }, 2500);
        typingTimeoutsRef.current.set(evt.username, timer);
      } else {
        const prevTimer = typingTimeoutsRef.current.get(evt.username);
        if (prevTimer) clearTimeout(prevTimer);
        typingTimeoutsRef.current.delete(evt.username);
        setTypingUsers((prev) => prev.filter((u) => u !== evt.username));
      }
    };

    socket.on("chat_typing", onChatTyping);
    return () => {
      socket.off("chat_typing", onChatTyping);
      for (const timer of typingTimeoutsRef.current.values()) {
        clearTimeout(timer);
      }
      typingTimeoutsRef.current.clear();
      setTypingUsers([]);
      stopTyping();
    };
  }, [gameId, stopTyping]);

  return {
    messages,
    isLoading,
    isLoadingHistory: loadingHistoryRef.current,
    error,
    chatError,
    userId,
    unreadCount,
    typingUsers,
    sessionDisabled,
    clearUnread,
    clearChatError,
    sendMessage,
    startTyping,
    stopTyping,
    deleteMessage,
    fetchChatHistory,
  };
}
