import React, { useState, useRef, useEffect } from "react";
import { type ChatMessage, isPlayerMessage, isSystemMessage } from "@/hooks/useGameChat";

interface ChatDisplayProps {
  messages: ChatMessage[];
  currentUserId?: string;
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
  onDeleteMessage?: (timestamp: string) => void;
  disabled?: boolean;
}

export function ChatDisplay({
  messages,
  currentUserId,
  isLoading = false,
  onSendMessage,
  onDeleteMessage,
  disabled = false,
}: ChatDisplayProps) {
  const [inputValue, setInputValue] = useState("");
  const [hoveredMessageTime, setHoveredMessageTime] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  const scrollToBottom = () => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    // If user scrolled more than 80px from bottom, preserve their position
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distFromBottom > 80;
  };

  const handleSendMessage = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden border flex flex-col h-96"
      style={{ background: "hsl(220 28% 9%)", borderColor: "hsl(210 30% 25%)" }}
    >
      {/* Header */}
      <div
        className="p-4 border-b font-bold font-orbitron tracking-widest text-sm"
        style={{
          borderColor: "hsl(210 30% 25%)",
          color: "hsl(185 100% 50%)",
          background: "hsl(220 28% 12%)",
        }}
      >
        💬 GAME CHAT
      </div>

      {/* Messages Container */}
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading chat...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm ix-empty-pulse">No messages yet</div>
        ) : (
          messages.map((msg, idx) => {
            if (isSystemMessage(msg)) {
              return (
                <div
                  key={msg.id}
                  className="text-center text-xs py-1 ix-chat-msg"
                  style={{ color: "hsl(45 90% 65%)" }}
                >
                  ⚡ {msg.text}
                </div>
              );
            }

            if (!isPlayerMessage(msg)) return null;

            const isOwnMessage = msg.userId === currentUserId;
            const msgTime = new Date(msg.timestamp);
            const timeStr = msgTime.toLocaleTimeString(); 

            return (
              <div
                key={msg.id}
                className="group ix-chat-msg"
                onMouseEnter={() => setHoveredMessageTime(msg.timestamp)}
                onMouseLeave={() => setHoveredMessageTime(null)}
              >
                <div className="flex gap-2 text-xs">
                  <span style={{ color: "hsl(185 100% 50%)" }} className="font-semibold flex-shrink-0">
                    {msg.username}
                  </span>
                  <span style={{ color: "hsl(210 30% 50%)" }} className="flex-shrink-0">
                    {timeStr}
                  </span>
                  {isOwnMessage && hoveredMessageTime === msg.timestamp && onDeleteMessage && (
                    <button
                      onClick={() => onDeleteMessage(msg.timestamp)}
                      className="ml-auto text-red-500 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Delete (5 min window)"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div
                  className="mt-1 p-2 rounded text-sm break-words"
                  style={{
                    background: isOwnMessage
                      ? "hsl(270 70% 20%)"
                      : "hsl(210 30% 20%)",
                    color: "hsl(210 30% 80%)",
                  }}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!disabled && (
        <div
          className="p-3 border-t flex gap-2"
          style={{ borderColor: "hsl(210 30% 25%)" }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            maxLength={500}
            disabled={disabled}
            className="flex-1 px-3 py-2 rounded text-sm bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 ix-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || disabled}
            className="ix-btn px-4 py-2 rounded text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      )}

      {disabled && (
        <div className="p-3 border-t text-center text-xs text-gray-500" style={{ borderColor: "hsl(210 30% 25%)" }}>
          Game chat disabled
        </div>
      )}
    </div>
  );
}
