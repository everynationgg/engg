import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  isPending?: boolean;
  isError?: boolean;
  clientId?: string;
}

interface MessagingContextType {
  conversations: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  activeChatUserId: string | null;
  setActiveChatUserId: (userId: string | null) => void;
  sendMessage: (receiverId: string, text: string) => Promise<void>;
  loadConversationHistory: (userId: string) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isLoggedIn } = useAuth();
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);

  const socketRef = useRef<any>(null);

  const upsertMessage = useCallback(
    (msg: Message, options: { isIncoming: boolean } = { isIncoming: false }) => {
      if (!user?.id) return;
      const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;

      setConversations((prev) => {
        const existing = prev[otherUserId] || [];

        if (existing.some((m) => !m.isPending && m.id === msg.id)) return prev;

        const updated = [...existing];

        if (!msg.isPending) {
          const pendingIdx = updated.findIndex(
            (m) =>
              m.isPending &&
              ((msg.clientId && m.clientId === msg.clientId) ||
                (m.message === msg.message &&
                  Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) <
                    10000))
          );

          if (pendingIdx !== -1) {
            updated[pendingIdx] = msg;
          } else {
            updated.push(msg);
          }
        } else {
          updated.push(msg);
        }

        return {
          ...prev,
          [otherUserId]: updated.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        };
      });

      if (options.isIncoming && msg.senderId !== user.id && activeChatUserId !== otherUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [otherUserId]: (prev[otherUserId] || 0) + 1,
        }));
      }
    },
    [user?.id, activeChatUserId]
  );

  const handleIncomingMessage = useCallback(
    (msg: Message) => {
      upsertMessage(msg, { isIncoming: true });
    },
    [upsertMessage]
  );

  useEffect(() => {
    if (isLoggedIn && token && !token.startsWith("dev_")) {
      const socket = getSocket(token);
      socketRef.current = socket;

      fetch(`${import.meta.env.VITE_API_URL || ""}/api/messages/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            const counts: Record<string, number> = {};
            for (const row of data) {
              if (row?.senderId && Number(row.count) > 0) {
                counts[row.senderId] = Number(row.count);
              }
            }
            setUnreadCounts(counts);
          }
        })
        .catch(() => {});

      return () => {};
    } else {
      if (socketRef.current) disconnectSocket();
      socketRef.current = null;
      setConversations({});
      setUnreadCounts({});
      setActiveChatUserId(null);
      return undefined;
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("private_message", handleIncomingMessage);
    return () => {
      socket.off("private_message", handleIncomingMessage);
    };
  }, [handleIncomingMessage]);

  useEffect(() => {
    if (activeChatUserId) {
      setUnreadCounts((prev) => (prev[activeChatUserId] ? { ...prev, [activeChatUserId]: 0 } : prev));
    }
  }, [activeChatUserId]);

  const loadConversationHistory = async (userId: string) => {
    if (!isLoggedIn || !token || token.startsWith("dev_")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/messages/private/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;
      const data: Message[] = await res.json();
      setConversations((prev) => ({
        ...prev,
        [userId]: data.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      }));
    } catch (err) {
      console.error("[Messaging Error]", err);
    }
  };

  const sendMessage = async (receiverId: string, text: string) => {
    if (!isLoggedIn || !token || !user?.id) return;

    const clientId = `cl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg: Message = {
      id: clientId,
      clientId,
      senderId: user.id,
      receiverId,
      message: text,
      createdAt: new Date().toISOString(),
      isRead: true,
      isPending: true,
    };

    upsertMessage(optimisticMsg);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId, message: text, clientId }),
      });

      if (!res.ok) throw new Error("Failed to send message");
    } catch (err) {
      console.error("[Messaging Error]", err);
      setConversations((prev) => ({
        ...prev,
        [receiverId]: (prev[receiverId] || []).map((m) =>
          m.id === clientId ? { ...m, isError: true } : m
        ),
      }));
    }
  };

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        unreadCounts,
        activeChatUserId,
        setActiveChatUserId,
        sendMessage,
        loadConversationHistory,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) throw new Error("useMessaging must be used within a MessagingProvider");
  return context;
};
