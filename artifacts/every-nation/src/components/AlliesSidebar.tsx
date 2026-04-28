import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserPlus, FaUserFriends, FaSearch, FaCheck, FaTimes, FaUserSecret, FaCircle, FaArrowLeft, FaSatelliteDish, FaArrowRight, FaTrash, FaExclamationCircle } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { getSocket } from "@/lib/socket";
import { useUI } from "@/context/UIContext";

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

  // Chat State
  const [activeChatAlly, setActiveChatAlly] = useState<Ally | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isAllyTyping, setIsAllyTyping] = useState(false);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchAllies();
      fetchPendingRequests();
      fetchUnreadCounts();
      
      const interval = setInterval(() => {
        fetchUnreadCounts();
      }, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isLoggedIn, token]);

  useEffect(() => {
    let interval: any;
    if (activeChatAlly && activePanel === "allies") {
      fetchMessages(activeChatAlly.id);
      interval = setInterval(() => fetchMessages(activeChatAlly.id), 10000);
    }
    return () => clearInterval(interval);
  }, [activeChatAlly, activePanel]);

  useEffect(() => {
    if (!isLoggedIn || !token) return undefined;
    const socket = getSocket(token);
    
    const onPrivateMessage = (msg: any) => {
      if (activeChatAlly && (msg.senderId === activeChatAlly.id || msg.receiverId === activeChatAlly.id)) {
        setIsAllyTyping(false);
        setChatMessages(prev => {
          const exists = prev.find(m => m.id === msg.id);
          if (exists) return prev;
          if (msg.senderId === activeChatAlly.id) playNotificationSound();
          return [...prev, msg];
        });
        if (msg.senderId === activeChatAlly.id) fetchMessages(activeChatAlly.id);
      } else {
        fetchUnreadCounts();
      }
    };

    const onTypingUpdate = (data: { senderId: string; isTyping: boolean }) => {
      if (activeChatAlly && data.senderId === activeChatAlly.id) setIsAllyTyping(data.isTyping);
    };

    const onReadReceipt = (data: { receiverId: string; readAt: string }) => {
      if (activeChatAlly && data.receiverId === activeChatAlly.id) {
        setChatMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    };

    socket.on("private_message", onPrivateMessage);
    socket.on("pm_typing_update", onTypingUpdate);
    socket.on("pm_read_receipt", onReadReceipt);
    return () => {
      socket.off("private_message", onPrivateMessage);
      socket.off("pm_typing_update", onTypingUpdate);
      socket.off("pm_read_receipt", onReadReceipt);
    };
  }, [isLoggedIn, token, activeChatAlly]);

  const handleTyping = (text: string) => {
    setMessageInput(text);
    if (!activeChatAlly || !token) return;

    const socket = getSocket(token);
    if (!isTypingRef.current && text.length > 0) {
      isTypingRef.current = true;
      socket.emit("pm_typing_update", { receiverId: activeChatAlly.id, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("pm_typing_update", { receiverId: activeChatAlly.id, isTyping: false });
    }, 3000);
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/private/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.length > lastMessageCount) {
        const latest = data[data.length - 1];
        if (latest.senderId === otherUserId) playNotificationSound();
      }
      setChatMessages(data);
      setLastMessageCount(data.length);
      fetchUnreadCounts();
    } catch (err) { console.error(err); }
  };

  const fetchUnreadCounts = async () => {
    if (!isLoggedIn || !token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const counts: Record<string, number> = {};
      let totalUnread = 0;
      data.forEach((item: any) => {
        counts[item.senderId] = item.count;
        totalUnread += item.count;
      });
      const prevTotal = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
      if (totalUnread > prevTotal && !activeChatAlly) playNotificationSound();
      setUnreadCounts(counts);
    } catch (err) { console.error(err); }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!activeChatAlly || !messageInput.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: activeChatAlly.id, message: messageInput })
      });
      if (res.ok) {
        setMessageInput("");
        fetchMessages(activeChatAlly.id);
      }
    } catch (err) { console.error(err); } finally { setIsSending(false); }
  };

  const fetchAllies = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAllies(data);
    } catch (err) { console.error(err); }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/friend-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPendingRequests(data);
    } catch (err) { console.error(err); }
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm("Terminate secure link?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/remove-friend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendId })
      });
      if (res.ok) {
        fetchAllies();
        if (activeChatAlly?.id === friendId) setActiveChatAlly(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/search-friends?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const sendRequest = async (friendId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/send-friend-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendId })
      });
      if (res.ok) handleSearch();
    } catch (err) { console.error(err); }
  };

  const acceptRequest = async (friendId: string) => {
    setIsAccepting(friendId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/accept-friend-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendId })
      });
      if (res.ok) await Promise.all([fetchAllies(), fetchPendingRequests()]);
    } catch (err) { console.error(err); } finally { setIsAccepting(null); }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {activePanel !== "allies" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => togglePanel("allies")}
          data-allies-trigger
          className="fixed bottom-6 right-6 z-[100] w-12 h-12 bg-[#0a0b1e]/80 border border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-all flex lg:hidden items-center justify-center group overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)]"
        >
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/40" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/40" />
          <FaUserFriends className="text-cyan-400/60 text-lg group-hover:text-cyan-400 transition-colors" />
          {(pendingRequests.length > 0 || Object.keys(unreadCounts).length > 0) && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white/20" />
          )}
        </motion.button>
      )}

      <AnimatePresence>
        {activePanel === "allies" && (
          <>
            {/* Click-Away Overlay (Backdrop) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => closeAll()}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[320px] z-[60] flex flex-col bg-[#020408] border-l border-white/5"
            >
              {/* Scanline Header */}
              <div className="relative pt-12 px-6 pb-4 border-b border-white/5">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/20" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <h2 className="font-orbitron text-xl font-black tracking-[0.2em] uppercase text-white">
                      Allies <span className="text-cyan-400">Net</span>
                    </h2>
                    <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-cyan-400/40 mt-1.5">Status: Active</span>
                  </div>
                  <button onClick={() => activeChatAlly ? setActiveChatAlly(null) : closeAll()} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 transition-colors">
                    {activeChatAlly ? <FaArrowLeft className="text-xs text-white/20" /> : <FaTimes className="text-xs text-white/20" />}
                  </button>
                </div>
              </div>

              {activeChatAlly ? (
                /* Chat View */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3 bg-cyan-500/[0.02]">
                    <FaUserSecret className="text-cyan-400/40 text-xs" />
                    <span className="font-orbitron text-[11px] uppercase text-white tracking-widest">{activeChatAlly.username}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.senderId === activeChatAlly.id ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[90%] p-3 font-mono text-[11px] leading-relaxed border ${
                          msg.senderId === activeChatAlly.id ? 'bg-white/5 border-white/5 text-white/70' : 'bg-cyan-500/5 border-cyan-500/10 text-cyan-100/80'
                        }`}>
                          {msg.message}
                        </div>
                        <span className="font-mono text-[6px] uppercase text-white/10 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    {isAllyTyping && <span className="font-mono text-[9px] uppercase text-cyan-400/40 animate-pulse">Receiving...</span>}
                  </div>
                  <div className="p-4 border-t border-white/5">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="TRANSMIT..."
                        value={messageInput}
                        onChange={(e) => handleTyping(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="w-full bg-white/[0.02] border border-white/10 p-3 font-mono text-[9px] uppercase tracking-widest outline-none focus:border-cyan-500/30 transition-all pr-10"
                      />
                      <button onClick={sendMessage} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/40"><FaArrowRight size={10} /></button>
                    </div>
                  </div>
                </div>
              ) : (
                /* List View */
                <>
                  <div className="flex p-4 gap-2">
                    {['allies', 'search'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`flex-1 py-2 font-orbitron text-[8px] uppercase tracking-widest transition-all border ${
                          activeTab === t ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-white/[0.01] text-white/20 border-white/5"
                        }`}
                      >
                        {t === 'allies' ? 'Roster' : 'Scan'}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar pb-8">
                    {activeTab === 'search' && (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="OPERATOR_ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="w-full bg-white/[0.02] border border-white/10 p-3 font-mono text-[9px] uppercase tracking-widest text-white outline-none"
                        />
                      </div>
                    )}

                    {activeTab === 'allies' ? (
                      <div className="space-y-4">
                        {pendingRequests.map(req => (
                          <div key={req.id} className="p-3 bg-yellow-500/5 border border-yellow-500/10 flex items-center justify-between">
                            <span className="font-orbitron text-[9px] uppercase text-white">{req.username}</span>
                            <button onClick={() => acceptRequest(req.id)} className="w-6 h-6 flex items-center justify-center bg-yellow-500/20 text-yellow-500"><FaCheck size={8} /></button>
                          </div>
                        ))}
                        {allies.map(ally => (
                          <div 
                            key={ally.id}
                            onClick={() => setActiveChatAlly(ally)}
                            className="p-3 bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${ally.status === 'online' ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-white/10'}`} />
                                <span className="font-orbitron text-[12px] uppercase text-white/60 group-hover:text-white transition-colors">{ally.username}</span>
                              </div>
                              {unreadCounts[ally.id] && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map(u => (
                          <div key={u.id} className="p-3 bg-white/[0.02] border border-white/5 flex items-center justify-between">
                            <span className="font-orbitron text-[11px] uppercase text-white">{u.username}</span>
                            <button onClick={() => sendRequest(u.id)} className="px-4 py-1.5 bg-cyan-500/10 text-cyan-400 font-orbitron text-[8px] uppercase border border-cyan-500/30">Add</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="mt-auto p-6 border-t border-white/5 bg-black/20">
                <div className="flex justify-between items-center opacity-20">
                  <span className="font-mono text-[9px] uppercase tracking-widest">Link_Latency</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest">14ms</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 1px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); }
      `}} />
    </>
  );
}
