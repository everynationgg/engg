import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserFriends,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaTrash,
  FaSearch,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/context/UIContext";
import { useMessaging } from "@/context/MessagingContext";

interface Ally {
  id: string;
  username: string;
  status: "online" | "offline";
  friendshipStatus?: "pending" | "accepted";
}

export default function AlliesSidebar() {
  const { token, isLoggedIn } = useAuth();
  const { activePanel, togglePanel, closeAll } = useUI();
  const [searchQuery, setSearchQuery] = useState("");
  const [allies, setAllies] = useState<Ally[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Ally[]>([]);
  const [searchResults, setSearchResults] = useState<Ally[]>([]);
  const [activeTab, setActiveTab] = useState<"allies" | "search">("allies");
  const [loading, setLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const {
    conversations,
    unreadCounts,
    sendMessage: transmitMessage,
    loadConversationHistory,
    setActiveChatUserId,
  } = useMessaging();

  const [activeChatAlly, setActiveChatAlly] = useState<Ally | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatMessages = activeChatAlly ? conversations[activeChatAlly.id] || [] : [];

  useEffect(() => {
    if (isLoggedIn && token && !token.startsWith("dev_")) {
      fetchAllies();
      fetchPendingRequests();
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (activeChatAlly) {
      loadConversationHistory(activeChatAlly.id);
      setActiveChatUserId(activeChatAlly.id);
    } else {
      setActiveChatUserId(null);
    }
  }, [activeChatAlly, loadConversationHistory, setActiveChatUserId]);

  const sendMessage = async () => {
    if (!activeChatAlly || !messageInput.trim() || isSending) return;
    setIsSending(true);
    try {
      await transmitMessage(activeChatAlly.id, messageInput);
      setMessageInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const fetchAllies = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/user/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/user/friend-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setPendingRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/user/remove-friend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        setConfirmRemoveId(null);
        fetchAllies();
        if (activeChatAlly?.id === friendId) setActiveChatAlly(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/user/search-friends?query=${encodeURIComponent(
          searchQuery.trim()
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (friendId: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/user/send-friend-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ friendId }),
        }
      );
      if (res.ok) handleSearch();
    } catch (err) {
      console.error(err);
    }
  };

  const acceptRequest = async (friendId: string) => {
    if (isAccepting) return;
    setIsAccepting(friendId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/user/accept-friend-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ friendId }),
        }
      );
      if (res.ok) await Promise.all([fetchAllies(), fetchPendingRequests()]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAccepting(null);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {activePanel !== "allies" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePanel("allies");
          }}
          data-allies-trigger
          className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-xl bg-[#0b101b]/90 border border-cyan-500/30 hover:bg-cyan-500/15 hover:border-cyan-400 transition-all flex lg:hidden items-center justify-center group shadow-lg cursor-pointer"
          aria-label="Open Friends Panel"
        >
          <FaUserFriends className="text-cyan-400 text-lg" />
          {(pendingRequests.length > 0 || Object.keys(unreadCounts).length > 0) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white/20" />
          )}
        </motion.button>
      )}

      <AnimatePresence>
        {activePanel === "allies" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => closeAll()}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[340px] z-[100] flex flex-col bg-[#080d16] border-l border-white/10"
            >
              {/* Header */}
              <div className="pt-6 px-6 pb-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-orbitron text-base font-bold tracking-wider uppercase text-white">
                    Friends &amp; Chat
                  </h2>
                  <span className="font-sans text-xs text-white/50">
                    {allies.filter((a) => a.status === "online").length} online
                  </span>
                </div>
                <button
                  onClick={() => (activeChatAlly ? setActiveChatAlly(null) : closeAll())}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  aria-label={activeChatAlly ? "Back to friends list" : "Close friends panel"}
                >
                  {activeChatAlly ? <FaArrowLeft className="text-xs" /> : <FaTimes className="text-xs" />}
                </button>
              </div>

              {activeChatAlly ? (
                /* Chat View */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activeChatAlly.status === "online" ? "bg-emerald-400" : "bg-white/25"
                        }`}
                      />
                      <span className="font-sans text-sm font-bold text-white">
                        {activeChatAlly.username}
                      </span>
                    </div>
                    {confirmRemoveId === activeChatAlly.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFriend(activeChatAlly.id)}
                          className="text-[11px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Confirm Remove
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="text-[11px] text-white/50 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(activeChatAlly.id)}
                        className="text-white/30 hover:text-red-400 p-1 transition-colors cursor-pointer"
                        title="Remove friend"
                      >
                        <FaTrash size={11} />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {chatMessages.length === 0 ? (
                      <p className="text-center text-xs text-white/40 py-8">
                        No messages yet. Say hello!
                      </p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            msg.senderId === activeChatAlly.id ? "items-start" : "items-end"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed border ${
                              msg.senderId === activeChatAlly.id
                                ? "bg-white/5 border-white/10 text-white/85"
                                : "bg-cyan-500/15 border-cyan-500/30 text-cyan-50"
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-white/30 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 border-t border-white/10">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Write a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-cyan-400 transition-all pr-10"
                      />
                      <button
                        onClick={sendMessage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        aria-label="Send message"
                      >
                        <FaArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Friends / Add Friend View */
                <>
                  <div className="flex p-4 gap-2">
                    {(["allies", "search"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`flex-1 py-2 rounded-lg font-sans text-xs font-bold transition-all border cursor-pointer ${
                          activeTab === t
                            ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                            : "bg-white/[0.02] text-white/50 border-white/10 hover:text-white"
                        }`}
                      >
                        {t === "allies" ? `Friends (${allies.length})` : "Add Friend"}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar pb-8">
                    {activeTab === "search" && (
                      <div className="relative flex gap-2">
                        <input
                          type="text"
                          placeholder="Search by username..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-cyan-400"
                        />
                        <button
                          onClick={handleSearch}
                          disabled={loading}
                          className="px-3.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 flex items-center justify-center cursor-pointer"
                          aria-label="Search friends"
                        >
                          <FaSearch size={12} />
                        </button>
                      </div>
                    )}

                    {activeTab === "allies" ? (
                      <div className="space-y-2.5">
                        {pendingRequests.length > 0 && (
                          <div className="space-y-2 pb-2 border-b border-white/10">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                              Friend Requests ({pendingRequests.length})
                            </span>
                            {pendingRequests.map((req) => (
                              <div
                                key={req.id}
                                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between"
                              >
                                <span className="font-sans text-xs font-semibold text-white">
                                  {req.username}
                                </span>
                                <button
                                  onClick={() => acceptRequest(req.id)}
                                  disabled={isAccepting === req.id}
                                  className="px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <FaCheck size={9} />
                                  <span>Accept</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {allies.length === 0 ? (
                          <p className="text-center text-xs text-white/40 py-8">
                            Your friends list is empty. Use &quot;Add Friend&quot; to connect with other players.
                          </p>
                        ) : (
                          allies.map((ally) => (
                            <div
                              key={ally.id}
                              onClick={() => setActiveChatAlly(ally)}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      ally.status === "online"
                                        ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                                        : "bg-white/20"
                                    }`}
                                  />
                                  <span className="font-sans text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                                    {ally.username}
                                  </span>
                                </div>
                                {unreadCounts[ally.id] ? (
                                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                    {unreadCounts[ally.id]}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-white/30">
                                    {ally.status === "online" ? "Online" : "Offline"}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                          >
                            <span className="font-sans text-xs font-semibold text-white">
                              {u.username}
                            </span>
                            <button
                              onClick={() => sendRequest(u.id)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-sans text-xs font-bold border border-cyan-500/30 cursor-pointer"
                            >
                              Add Friend
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
