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
  clientId?: string; // For correlation
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

  // 1. ATOMIC STATE UPDATE LOGIC
  const upsertMessage = useCallback((msg: Message, options: { isIncoming: boolean } = { isIncoming: false }) => {
    if (!user?.id) return;
    const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;

    setConversations(prev => {
      const existing = prev[otherUserId] || [];
      
      // A: Deduplication by real ID
      if (existing.some(m => !m.isPending && m.id === msg.id)) return prev;

      let updated = [...existing];
      
      // B: Correlation Matching (Pending -> Real)
      if (!msg.isPending) {
        const pendingIdx = updated.findIndex(m => 
          m.isPending && (
            (msg.clientId && m.clientId === msg.clientId) || // Match by Correlation ID
            (m.message === msg.message && Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 10000) // Fallback: 10s window
          )
        );
        
        if (pendingIdx !== -1) {
          updated[pendingIdx] = msg;
        } else {
          updated.push(msg);
        }
      } else {
        updated.push(msg); // Just a pending message
      }

      return { 
        ...prev, 
        [otherUserId]: updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      };
    });

    // C: Side Effects (Unread counts) - Only for truly incoming new messages
    if (options.isIncoming && msg.senderId !== user.id && activeChatUserId !== otherUserId) {
      setUnreadCounts(prev => ({
        ...prev,
        [otherUserId]: (prev[otherUserId] || 0) + 1
      }));
    }
  }, [user?.id, activeChatUserId]);

  // 2. SOCKET MASTER HANDLER
  const handleIncomingMessage = useCallback((msg: Message) => {
    upsertMessage(msg, { isIncoming: true });
  }, [upsertMessage]);

  // 3. LIFECYCLE
  useEffect(() => {
    if (isLoggedIn && token) {
      if (socketRef.current) disconnectSocket();
      const socket = getSocket(token);
      socketRef.current = socket;
      socket.on("private_message", handleIncomingMessage);

      return () => {
        socket.off("private_message", handleIncomingMessage);
        disconnectSocket();
        socketRef.current = null;
      };
    } else {
      if (socketRef.current) disconnectSocket();
      socketRef.current = null;
      setConversations({});
      setUnreadCounts({});
      setActiveChatUserId(null);
      return undefined;
    }
  }, [isLoggedIn, token, handleIncomingMessage]);

  // 4. UNREAD SYNC
  useEffect(() => {
    if (activeChatUserId) {
      setUnreadCounts(prev => (prev[activeChatUserId] ? { ...prev, [activeChatUserId]: 0 } : prev));
    }
  }, [activeChatUserId]);

  // 5. HISTORY LOADING
  const loadConversationHistory = async (userId: string) => {
    if (!isLoggedIn || !token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/private/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data: Message[] = await res.json();
      setConversations(prev => ({
        ...prev,
        [userId]: data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }));
    } catch (err) { console.error("[Signal Error]", err); }
  };

  // 6. TRANSMISSION (Optimistic)
  const sendMessage = async (receiverId: string, text: string) => {
    if (!isLoggedIn || !token || !user?.id) return;

    const clientId = `cl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const optimisticMsg: Message = {
      id: clientId,
      clientId,
      senderId: user.id,
      receiverId,
      message: text,
      createdAt: new Date().toISOString(),
      isRead: true,
      isPending: true
    };

    upsertMessage(optimisticMsg);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId, message: text, clientId }) // We pass clientId even if server ignores it
      });

      if (!res.ok) throw new Error("Link Terminated");
    } catch (err) {
      console.error("[Transmission Error]", err);
      setConversations(prev => ({
        ...prev,
        [receiverId]: (prev[receiverId] || []).map(m => m.id === clientId ? { ...m, isError: true } : m)
      }));
    }
  };

  return (
    <MessagingContext.Provider value={{ 
      conversations, unreadCounts, activeChatUserId, setActiveChatUserId, sendMessage, loadConversationHistory 
    }}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) throw new Error("useMessaging must be used within a MessagingProvider");
  return context;
};
