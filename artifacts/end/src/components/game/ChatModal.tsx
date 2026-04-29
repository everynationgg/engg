import { useState, useEffect, useRef } from "react";
import { useGameChat, isPlayerMessage, isSystemMessage } from "@/hooks/useGameChat";
import { useTTS } from "@/hooks/useTTS";
import ConnectionIndicator from "@/components/common/ConnectionIndicator";

interface ChatModalProps {
  gameId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onUnreadChange?: (count: number) => void;
  onTypingActivityChange?: (isActive: boolean) => void;
}

// Palette of vivid sci-fi colors — one entry per player slot.
// Each variant is pre-defined so no runtime string manipulation is needed.
const PLAYER_COLORS = [
  { name: "hsl(185 100% 60%)",  border: "hsl(185 100% 60% / 0.30)", shadow: "hsl(185 100% 60% / 0.40)" },  // cyan
  { name: "hsl(45 90% 62%)",    border: "hsl(45 90% 62% / 0.30)",   shadow: "hsl(45 90% 62% / 0.40)" },    // gold
  { name: "hsl(140 70% 55%)",   border: "hsl(140 70% 55% / 0.30)",  shadow: "hsl(140 70% 55% / 0.40)" },   // green
  { name: "hsl(300 70% 68%)",   border: "hsl(300 70% 68% / 0.30)",  shadow: "hsl(300 70% 68% / 0.40)" },   // magenta
  { name: "hsl(30 100% 65%)",   border: "hsl(30 100% 65% / 0.30)",  shadow: "hsl(30 100% 65% / 0.40)" },   // orange
  { name: "hsl(200 100% 67%)",  border: "hsl(200 100% 67% / 0.30)", shadow: "hsl(200 100% 67% / 0.40)" },  // sky blue
  { name: "hsl(0 75% 68%)",     border: "hsl(0 75% 68% / 0.30)",    shadow: "hsl(0 75% 68% / 0.40)" },     // red
  { name: "hsl(260 80% 72%)",   border: "hsl(260 80% 72% / 0.30)",  shadow: "hsl(260 80% 72% / 0.40)" },   // lavender
] as const;

function playerColor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length];
}

/** Returns true when the given chat message was sent by the local user. */
function isOwnMessage(
  msg: { userId: string | null; username: string | null },
  localUserId: string | null,
  guestName: string | undefined,
): boolean {
  return (
    (localUserId !== null && msg.userId !== null && msg.userId === localUserId) ||
    (localUserId === null && msg.userId === null && guestName != null && msg.username === guestName)
  );
}

export default function ChatModal({ gameId, isOpen, onToggle, onUnreadChange, onTypingActivityChange }: ChatModalProps) {
  // Use the in-game callsign as the guest sender name when not logged in
  const guestName = sessionStorage.getItem("lp_callsign") ?? undefined;
  // Always poll (background when closed, full when open) to track unread messages.
  const { messages, isLoading, isLoadingHistory, userId, unreadCount, typingUsers, sessionDisabled, chatError, clearUnread, clearChatError, sendMessage, startTyping, stopTyping, deleteMessage } = useGameChat(gameId, isOpen, guestName);
  const { ttsEnabled, toggleTTS, speak, isTTSSupported } = useTTS();
  const [messageText, setMessageText] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userScrolledUpRef = useRef(false);
  // TTS tracking refs — anchor is reset each time a history fetch begins so
  // only genuinely new messages are spoken, not replayed history.
  const ttsAnchoredRef = useRef(false);
  const lastSpokenCountRef = useRef(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent of unread count changes
  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  useEffect(() => {
    onTypingActivityChange?.(typingUsers.length > 0);
  }, [typingUsers.length, onTypingActivityChange]);

  useEffect(() => {
    return () => {
      onTypingActivityChange?.(false);
    };
  }, [onTypingActivityChange]);

  // Clear unread when chat opens
  useEffect(() => {
    if (isOpen) {
      clearUnread();
    }
  }, [isOpen, clearUnread]);

  // Set body attribute so CSS can hide PlayerStatusList when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute("data-chat-open", "true");
    } else {
      document.body.removeAttribute("data-chat-open");
    }
    return () => {
      document.body.removeAttribute("data-chat-open");
    };
  }, [isOpen]);

  // Scroll to bottom whenever messages change (unless user scrolled up or loading history)
  useEffect(() => {
    if (!userScrolledUpRef.current && !isLoadingHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoadingHistory]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distFromBottom > 80;
  };

  useEffect(() => {
    if (isOpen) return;
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    stopTyping();
  }, [isOpen, stopTyping]);

  useEffect(() => {
    if (!gameId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        if (!isOpen) return;
        event.preventDefault();
        onToggle();
        return;
      }

      if (event.key !== "Enter" || event.repeat) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      // If the user is already typing in the chat input, let the default send handler work
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")) {
        return;
      }

      event.preventDefault();

      if (!isOpen) {
        // First Enter: open the chat
        onToggle();
      } else {
        // Second Enter: focus the text input
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gameId, isOpen, onToggle]);

  // Reset TTS anchor whenever a history load starts so history messages are never spoken.
  useEffect(() => {
    if (isLoading) {
      ttsAnchoredRef.current = false;
    }
  }, [isLoading]);

  // Speak new incoming player messages (not own, not history) when TTS is enabled.
  useEffect(() => {
    // While history is loading, hold off.
    if (isLoading) return;

    if (!ttsAnchoredRef.current) {
      // History just finished (or there was none) — snapshot current count; don't speak.
      ttsAnchoredRef.current = true;
      lastSpokenCountRef.current = messages.length;
      return;
    }

    if (messages.length <= lastSpokenCountRef.current) return;

    const newMessages = messages.slice(lastSpokenCountRef.current);
    lastSpokenCountRef.current = messages.length;

    // Compute own-user identity once outside the loop.
    const localUserId = userId ?? sessionStorage.getItem("lp_userId");

    // When multiple messages arrive at once (e.g. reconnect flush), speak only the
    // last non-own player message so we don't cancel-and-restart speechSynthesis
    // repeatedly and end up voicing nothing.
    let lastSpeakable: string | null = null;
    for (const msg of newMessages) {
      if (!isPlayerMessage(msg)) continue;
      if (isOwnMessage(msg, localUserId, guestName)) continue;
      lastSpeakable = `${msg.username ?? "Unknown"}: ${msg.message}`;
    }
    if (lastSpeakable !== null) {
      speak(lastSpeakable);
    }
  }, [messages, isLoading, speak, userId, guestName]);

  // Hooks must come before any conditional return (React rules of hooks).
  if (!gameId) return null;

  const handleSend = async () => {
    if (!messageText.trim()) return;
    setSendLoading(true);
    setSendError(null);
    try {
      await sendMessage(messageText);
      setMessageText("");
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
      stopTyping();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendLoading(false);
    }
  };

  const typingText =
    typingUsers.length === 0
      ? ""
      : typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
      : `${typingUsers[0]}, ${typingUsers[1]} +${typingUsers.length - 2} more are typing...`;

  return (
    <>
      {/* Chat Sidebar - Full Height */}
      <div
        className="fixed left-0 top-0 bottom-0 z-[60] w-96 border-r flex flex-col transition-all duration-300"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          borderColor: "hsl(185 100% 50% / 0.4)",
          background: "linear-gradient(160deg, hsl(220 30% 7%) 0%, hsl(220 28% 11%) 100%)",
          backdropFilter: "blur(12px)",
          boxShadow: isOpen ? "6px 0 48px hsl(185 100% 50% / 0.25), 2px 0 0 hsl(185 100% 50% / 0.15)" : "none",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between shrink-0"
          style={{
            borderColor: "hsl(210 30% 22%)",
            background: "linear-gradient(90deg, hsl(185 80% 12% / 0.6) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <span
              className="w-2 h-2 rounded-full animate-pulse shrink-0"
              style={{ background: "hsl(140 70% 55%)", boxShadow: "0 0 6px hsl(140 70% 55% / 0.8)" }}
            />
            <h3 className="font-orbitron text-sm tracking-[0.12em] uppercase" style={{ color: "hsl(185 100% 65%)" }}>
              💬 In-Game Chat
            </h3>
            <ConnectionIndicator />
          </div>
          <div className="flex items-center gap-1.5">
            {/* TTS toggle — only shown when browser supports Web Speech API */}
            {isTTSSupported && (
              <button
                onClick={toggleTTS}
                className="w-7 h-7 flex items-center justify-center rounded font-orbitron text-xs transition-all hover:scale-110"
                style={{
                  background: ttsEnabled ? "hsl(185 60% 18%)" : "hsl(220 28% 16%)",
                  border: `1px solid ${ttsEnabled ? "hsl(185 100% 45% / 0.6)" : "hsl(210 30% 28%)"}`,
                  color: ttsEnabled ? "hsl(185 100% 65%)" : "hsl(210 30% 48%)",
                  boxShadow: ttsEnabled ? "0 0 8px hsl(185 100% 50% / 0.25)" : "none",
                }}
                title={ttsEnabled ? "Text-to-speech ON — click to mute" : "Text-to-speech OFF — click to enable"}
                aria-label={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
              >
                {ttsEnabled ? "🔊" : "🔇"}
              </button>
            )}
            <button
              onClick={onToggle}
              className="w-7 h-7 flex items-center justify-center rounded font-orbitron text-xs transition-all hover:scale-110"
              style={{
                background: "hsl(220 28% 16%)",
                border: "1px solid hsl(210 30% 28%)",
                color: "hsl(190 60% 70%)",
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto px-3 py-4"
          style={{ background: "hsl(220 28% 5% / 0.85)" }}
        >
          {isLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div
                className="w-8 h-8 border-2 border-transparent rounded-full animate-spin"
                style={{
                  borderTopColor: "hsl(185 100% 50%)",
                  borderRightColor: "hsl(270 70% 60%)",
                }}
              />
              <p className="font-orbitron text-xs tracking-widest" style={{ color: "hsl(210 30% 50%)" }}>
                LOADING COMMS...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 ix-empty-pulse">
              <span aria-label="No messages" style={{ fontSize: "2.5rem", filter: "drop-shadow(0 0 12px hsl(185 100% 50% / 0.5))" }}>📡</span>
              <p className="font-orbitron text-xs tracking-widest" style={{ color: "hsl(210 30% 45%)" }}>
                CHANNEL OPEN
              </p>
              <p className="font-orbitron" style={{ color: "hsl(210 30% 32%)", fontSize: "0.65em" }}>
                Be the first to transmit a message
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg, idx) => {
                // System messages — small, muted, centered
                if (isSystemMessage(msg)) {
                  return (
                    <div
                      key={msg.id}
                      className="flex justify-center my-0.5 animate-in fade-in duration-200"
                    >
                      <span
                        className="font-orbitron text-center"
                        style={{
                          fontSize: "0.5em",
                          letterSpacing: "0.07em",
                          color: "hsl(45 60% 45% / 0.7)",
                        }}
                      >
                        ⚡ {msg.text}
                      </span>
                    </div>
                  );
                }

                if (!isPlayerMessage(msg)) return null;

                // Own message: logged-in users matched by userId; guests matched by callsign.
                // Fall back to lp_userId from sessionStorage to handle the case where
                // a stale session userId was sent during join_session while useAuth reports null.
                const localUserId = userId ?? sessionStorage.getItem("lp_userId");
                const isOwn = isOwnMessage(msg, localUserId, guestName);
                const displayName = msg.username ?? "UNKNOWN";
                const nameColor = playerColor(displayName);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                  >
                    {/* Sender name */}
                    <span
                      className="font-orbitron font-bold tracking-wide mb-1 px-1"
                      style={{
                        color: isOwn ? "hsl(270 80% 75%)" : nameColor.name,
                        fontSize: "0.7em",
                        letterSpacing: "0.1em",
                        textShadow: `0 0 10px ${isOwn ? "hsl(270 80% 55% / 0.6)" : nameColor.shadow}`,
                      }}
                    >
                      {isOwn ? "▶ YOU" : `◀ ${displayName}`}
                    </span>

                    {/* Bubble row — message + delete button for own */}
                    <div className={`group flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"} max-w-[88%]`}>
                      {/* Bubble */}
                      <div
                        style={{
                          background: isOwn
                            ? "linear-gradient(135deg, hsl(270 55% 20%), hsl(270 65% 27%))"
                            : `linear-gradient(135deg, hsl(215 22% 13%), hsl(215 25% 16%))`,
                          border: `1px solid ${isOwn ? "hsl(270 80% 55% / 0.5)" : nameColor.border}`,
                          borderRadius: isOwn ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                          padding: "8px 12px",
                          wordBreak: "break-word" as const,
                          boxShadow: isOwn
                            ? "0 2px 12px hsl(270 80% 50% / 0.2)"
                            : `0 2px 12px ${nameColor.shadow.replace("0.40", "0.12")}`,
                        }}
                      >
                        <p
                          className="font-orbitron leading-relaxed"
                          style={{ color: "hsl(210 20% 93%)", fontSize: "0.78em" }}
                        >
                          {msg.message}
                        </p>
                        <p
                          className="font-orbitron mt-1.5"
                          style={{
                            color: "hsl(210 30% 38%)",
                            fontSize: "0.58em",
                            textAlign: isOwn ? "right" : "left",
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {/* Delete button — own messages only, visible on hover */}
                      {isOwn && (
                        <button
                          onClick={() => deleteMessage(msg.timestamp)}
                          className="opacity-0 group-hover:opacity-100 transition-all mb-5 shrink-0 hover:scale-125"
                          title="Delete"
                          style={{ color: "hsl(0 70% 60%)", fontSize: "0.65em" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Anchor for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {sessionDisabled ? (
          <div
            className="px-3 py-4 border-t text-center shrink-0"
            style={{
              borderColor: "hsl(210 30% 22%)",
              background: "hsl(220 28% 8% / 0.9)",
            }}
          >
            <p
              className="font-orbitron text-xs tracking-[0.1em]"
              style={{ color: "hsl(0 60% 60%)" }}
            >
              ⚠ SESSION ENDED
            </p>
          </div>
        ) : (
        <div
          className="px-3 pt-3 pb-3 border-t shrink-0"
          style={{
            borderColor: "hsl(210 30% 22%)",
            background: "hsl(220 28% 8% / 0.9)",
          }}
        >
          <div className="mb-2 h-4">
            {(sendError || chatError) ? (
              <p
                className="font-orbitron text-[10px] tracking-[0.08em]"
                style={{ color: "hsl(0 75% 60%)" }}
                onClick={() => { setSendError(null); clearChatError(); }}
                role="alert"
              >
                ⚠ {sendError || chatError}
              </p>
            ) : typingText && (
              <p
                className="font-orbitron text-[10px] tracking-[0.08em] ix-typing-dots"
                style={{ color: "hsl(185 60% 62%)" }}
              >
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing`
                  : typingUsers.length === 2
                  ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                  : `${typingUsers[0]}, ${typingUsers[1]} +${typingUsers.length - 2} more are typing`
                }
                <span>.</span><span>.</span><span>.</span>
              </p>
            )}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => {
                const next = e.target.value.slice(0, 100);
                setMessageText(next);

                if (next.trim()) {
                  startTyping();
                  if (typingStopTimerRef.current) {
                    clearTimeout(typingStopTimerRef.current);
                  }
                  typingStopTimerRef.current = setTimeout(() => {
                    stopTyping();
                    typingStopTimerRef.current = null;
                  }, 1200);
                } else {
                  if (typingStopTimerRef.current) {
                    clearTimeout(typingStopTimerRef.current);
                    typingStopTimerRef.current = null;
                  }
                  stopTyping();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !sendLoading && messageText.trim()) {
                  handleSend();
                }
              }}
              placeholder="Transmit a message..."
              disabled={sendLoading}
              maxLength={100}
              className="flex-1 px-3 py-2.5 rounded-xl text-xs font-orbitron outline-none transition-all ix-input"
              style={{
                background: "hsl(220 28% 13%)",
                border: "1px solid hsl(210 30% 28%)",
                color: "hsl(210 25% 88%)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "hsl(185 100% 45%)";
                e.currentTarget.style.boxShadow = "0 0 0 2px hsl(185 100% 50% / 0.15), 0 0 12px hsl(185 100% 50% / 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "hsl(210 30% 28%)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleSend}
              disabled={sendLoading || !messageText.trim()}
              aria-label={sendLoading ? "Sending message" : "Send message"}
              className="ix-btn px-3 py-2 rounded-xl font-orbitron text-xs tracking-[0.05em] uppercase transition-all disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: messageText.trim() && !sendLoading ? "hsl(185 75% 22%)" : "hsl(210 20% 18%)",
                border: `1px solid ${messageText.trim() && !sendLoading ? "hsl(185 100% 45%)" : "hsl(210 30% 28%)"}`,
                color: messageText.trim() && !sendLoading ? "hsl(185 100% 65%)" : "hsl(210 30% 45%)",
                boxShadow: messageText.trim() && !sendLoading ? "0 0 10px hsl(185 100% 50% / 0.2)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!sendLoading && messageText.trim()) {
                  e.currentTarget.style.background = "hsl(185 80% 28%)";
                  e.currentTarget.style.boxShadow = "0 0 16px hsl(185 100% 50% / 0.5)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = messageText.trim() && !sendLoading ? "hsl(185 75% 22%)" : "hsl(210 20% 18%)";
                e.currentTarget.style.boxShadow = messageText.trim() && !sendLoading ? "0 0 10px hsl(185 100% 50% / 0.2)" : "none";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {sendLoading ? "⟳" : "▶"}
            </button>
          </div>
          {/* Character progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: "hsl(210 30% 18%)" }}>
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${(messageText.length / 100) * 100}%`,
                  background: messageText.length > 85
                    ? "hsl(0 75% 60%)"
                    : messageText.length > 60
                    ? "hsl(45 90% 55%)"
                    : "hsl(185 100% 50%)",
                  boxShadow: messageText.length > 0 ? `0 0 6px ${messageText.length > 85 ? "hsl(0 75% 60% / 0.6)" : "hsl(185 100% 50% / 0.4)"}` : "none",
                }}
              />
            </div>
            <p style={{ color: messageText.length > 85 ? "hsl(0 75% 60%)" : "hsl(210 30% 42%)", fontSize: "0.6em" }} className="font-orbitron shrink-0">
              {messageText.length}/100
            </p>
          </div>
        </div>
        )}
      </div>

      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[55] transition-opacity duration-300"
          style={{ background: "hsl(220 30% 4% / 0.3)" }}
          onClick={onToggle}
        />
      )}
    </>
  );
}

