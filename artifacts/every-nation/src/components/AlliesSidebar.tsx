import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserPlus, FaUserFriends, FaSearch, FaCheck, FaTimes, FaUserSecret, FaCircle, FaArrowLeft, FaSatelliteDish, FaArrowRight } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

interface Ally {
  id: string;
  username: string;
  status: "online" | "offline";
  friendshipStatus?: "pending" | "accepted";
}

export default function AlliesSidebar() {
  const { token, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchAllies();
      fetchPendingRequests();
    }
  }, [isLoggedIn, token]);

  // Poll for messages if chat is open
  useEffect(() => {
    let interval: any;
    if (activeChatAlly && isOpen) {
      fetchMessages(activeChatAlly.id);
      interval = setInterval(() => fetchMessages(activeChatAlly.id), 3000);
    }
    return () => clearInterval(interval);
  }, [activeChatAlly, isOpen]);

  const fetchMessages = async (otherUserId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/private/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setChatMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const sendMessage = async () => {
    if (!activeChatAlly || !messageInput.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ receiverId: activeChatAlly.id, message: messageInput })
      });
      if (res.ok) {
        setMessageInput("");
        fetchMessages(activeChatAlly.id);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const fetchAllies = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAllies(data.map((a: any) => ({ ...a, status: "online" }))); // Placeholder status
    } catch (err) {
      console.error("Failed to fetch allies", err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/friend-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPendingRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
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
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (friendId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/send-friend-request`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ friendId })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Request failed");
      }
      
      handleSearch(); // Refresh search to show pending status
    } catch (err) {
      console.error("Failed to send request", err);
    }
  };

  const acceptRequest = async (friendId: string) => {
    setIsAccepting(friendId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/accept-friend-request`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ friendId })
      });
      if (res.ok) {
        await Promise.all([fetchAllies(), fetchPendingRequests()]);
      }
    } catch (err) {
      console.error("Failed to accept", err);
    } finally {
      setIsAccepting(null);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-[100] w-14 h-14 md:w-16 md:h-16 bg-[#0a0b1e]/60 border border-cyan-500/20 backdrop-blur-xl hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-all shadow-[0_0_30px_rgba(6,182,212,0.1)] group flex items-center justify-center overflow-hidden"
        >
          {/* HUD Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 group-hover:border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 group-hover:border-cyan-400" />
          
          <div className="flex flex-col items-center gap-1 relative z-10">
            <FaUserFriends className="text-cyan-400 text-xl md:text-2xl group-hover:scale-110 transition-transform" />
            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-cyan-400/40 group-hover:text-cyan-400/80 transition-colors">Allies</span>
          </div>
          
          {/* Scanning Line Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-1/2 w-full -translate-y-full group-hover:animate-scan-vertical pointer-events-none" />

          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)] z-20">
              {pendingRequests.length}
            </span>
          )}
        </motion.button>
      )}

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 150 }}
              className="fixed top-[72px] lg:top-[88px] right-0 bottom-0 w-full sm:w-[350px] md:w-[420px] bg-[#020408]/90 border-l border-cyan-500/20 z-[1000] backdrop-blur-[40px] flex flex-col shadow-[-30px_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Premium Background FX */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(6,182,212,0.15)_0%,transparent_50%)]" />
              
              {/* Tactical Hex Grid Overlay */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                style={{ backgroundImage: `radial-gradient(cyan 1px, transparent 0)`, backgroundSize: '24px 24px' }} 
              />

              {/* Top Scanning Header */}
              <div className="relative pt-16 px-8 pb-6 border-b border-white/5">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
                      <span className="font-mono text-[10px] tracking-[0.6em] uppercase text-cyan-400/60">Subsystem_Active</span>
                    </div>
                    <h2 className="font-orbitron text-2xl font-black tracking-[0.2em] uppercase text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                      Allies_<span className="text-cyan-400">Net</span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => {
                      if (activeChatAlly) setActiveChatAlly(null);
                      else setIsOpen(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all group"
                  >
                    {activeChatAlly ? <FaArrowLeft className="text-white/20 group-hover:text-cyan-400 transition-colors" /> : <FaTimes className="text-white/20 group-hover:text-red-400 transition-colors" />}
                  </button>
                </div>
                <div className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/20">Encryption: AES-4096_QUANTUM</div>
              </div>

              {activeChatAlly ? (
                /* Chat View */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-cyan-500/5">
                    <div className="w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center">
                      <FaUserSecret className="text-cyan-400/60" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-orbitron text-[10px] uppercase text-white tracking-widest">{activeChatAlly.username}</span>
                      <span className="font-mono text-[7px] uppercase text-cyan-400/40">Secure_Channel_Established</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg, i) => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === activeChatAlly.id ? 'items-start' : 'items-end'}`}>
                          <div className={`max-w-[80%] p-3 rounded-sm font-mono text-[11px] leading-relaxed ${
                            msg.senderId === activeChatAlly.id 
                              ? 'bg-white/5 border border-white/10 text-white/80' 
                              : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-100'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="font-mono text-[7px] uppercase text-white/10 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
                        <FaSatelliteDish size={30} />
                        <span className="font-mono text-[9px] uppercase tracking-[0.3em]">No Signal History</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-black/40 border-t border-white/5">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Transmit message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="w-full bg-white/5 border border-white/10 p-4 font-mono text-[10px] uppercase tracking-widest outline-none focus:border-cyan-500/50 transition-all pr-12"
                      />
                      <button 
                        onClick={sendMessage}
                        disabled={isSending || !messageInput.trim()}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400/40 hover:text-cyan-400 disabled:opacity-20 transition-all"
                      >
                        <FaArrowRight />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tabs & List View */
                <>
                  {/* Tactical Tabs */}
                  <div className="flex p-6 gap-2">
                    {[
                      { id: "allies", label: "Roster", icon: <FaUserFriends /> },
                      { id: "search", label: "Scan_Grid", icon: <FaSearch /> }
                    ].map((tab) => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 font-orbitron text-[10px] uppercase tracking-[0.3em] transition-all relative overflow-hidden group ${
                          activeTab === tab.id 
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                            : "bg-white/[0.02] text-white/30 border border-white/5 hover:bg-white/[0.05] hover:text-white/60"
                        }`}
                      >
                        <span className={`text-xs ${activeTab === tab.id ? "text-cyan-400" : "text-white/20"}`}>
                          {tab.icon}
                        </span>
                        {tab.label}
                        {activeTab === tab.id && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_#00f3ff]" 
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar pb-12">
                    
                    {activeTab === "search" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                      >
                        <input
                          type="text"
                          placeholder="Enter Operator ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="w-full bg-[#0a0b1e]/60 border border-cyan-500/20 p-5 font-mono text-xs uppercase tracking-[0.3em] text-white focus:border-cyan-400/50 focus:outline-none transition-all pr-12 placeholder:text-white/10"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {loading ? (
                            <div className="w-4 h-4 border border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                          ) : (
                            <button onClick={handleSearch} className="text-cyan-400/40 hover:text-cyan-400 transition-colors">
                              <FaSearch />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                      {activeTab === "allies" ? (
                        <motion.div 
                          key="allies-list"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-6"
                        >
                          {/* Inbound Section */}
                          {pendingRequests.length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-1 h-3 bg-yellow-500/50" />
                                <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-yellow-500/60">Inbound_Signals ({pendingRequests.length})</span>
                              </div>
                              {pendingRequests.map((req) => (
                                <div key={req.id} className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-sm flex items-center justify-between group hover:bg-yellow-500/10 transition-all">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center rounded-full">
                                      <FaUserPlus className="text-yellow-500/60" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-orbitron text-xs uppercase text-white tracking-widest">{req.username}</span>
                                      <span className="font-mono text-[7px] uppercase text-yellow-500/40">
                                        {isAccepting === req.id ? 'Synchronizing...' : 'Handshake_Pending'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => acceptRequest(req.id)}
                                      disabled={isAccepting === req.id}
                                      className="w-9 h-9 flex items-center justify-center bg-yellow-500/20 border border-yellow-500/40 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all disabled:opacity-50"
                                    >
                                      {isAccepting === req.id ? <div className="w-4 h-4 border border-yellow-500/40 border-t-yellow-500 rounded-full animate-spin" /> : <FaCheck />}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Active Roster */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-3 bg-cyan-500" />
                              <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-cyan-400/60">Tactical_Roster</span>
                            </div>
                            {allies.length > 0 ? (
                              allies.map((ally) => (
                                <motion.div 
                                  key={ally.id}
                                  whileHover={{ x: 5 }}
                                  onClick={() => setActiveChatAlly(ally)}
                                  className="relative p-5 bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all group overflow-hidden cursor-pointer"
                                >
                                  {/* Corner Accents */}
                                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/0 group-hover:border-cyan-500/60 transition-all" />
                                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/0 group-hover:border-cyan-500/60 transition-all" />

                                  <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                      <div className="relative">
                                        <div className="w-12 h-12 bg-[#0a0b1e] border border-white/10 rounded-full flex items-center justify-center overflow-hidden">
                                          <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                                          <FaUserSecret className="text-white/20 text-xl relative z-10 group-hover:text-cyan-400/40 transition-colors" />
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-4 border-[#020408] ${
                                          ally.status === 'online' ? 'bg-cyan-500 shadow-[0_0_10px_#00f3ff]' : 'bg-white/10'
                                        }`} />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-orbitron text-sm uppercase text-white tracking-widest group-hover:text-cyan-400 transition-colors">{ally.username}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/30">
                                            {ally.status === 'online' ? 'Uplink_Established' : 'Signal_Lost'}
                                          </span>
                                          {ally.status === 'online' && <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" />}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-4">
                                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-400/40">Open_Channel</span>
                                      <FaCircle className="text-[6px] text-cyan-400 animate-ping" />
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="py-20 text-center border border-white/5 bg-white/[0.01]">
                                <div className="mb-4 opacity-10 flex justify-center"><FaUserFriends size={40} /></div>
                                <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/20">Grid_Empty: No Allies Linked</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="search-results"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          {searchResults.length > 0 ? (
                            searchResults.map((user) => (
                              <div key={user.id} className="p-5 bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all relative overflow-hidden">
                                <div className="flex flex-col gap-1">
                                  <span className="font-orbitron text-xs uppercase text-white tracking-widest">{user.username}</span>
                                  <span className="font-mono text-[7px] uppercase text-white/20 tracking-[0.4em]">Node_ID: {user.id.slice(0, 8)}</span>
                                </div>
                                
                                <div className="relative z-10">
                                  {user.friendshipStatus === 'accepted' ? (
                                    <div className="flex items-center gap-2 text-cyan-400/40">
                                      <FaCheck className="text-[10px]" />
                                      <span className="font-mono text-[8px] uppercase tracking-widest">Linked</span>
                                    </div>
                                  ) : user.friendshipStatus === 'pending' ? (
                                    <div className="flex items-center gap-2 text-yellow-500/40">
                                      <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                                      <span className="font-mono text-[8px] uppercase tracking-widest">Transmitting</span>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => sendRequest(user.id)}
                                      className="px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-orbitron text-[9px] uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all relative group/btn"
                                    >
                                      Add_Ally
                                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : searchQuery.length >= 2 ? (
                            <div className="py-20 text-center">
                              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/20">Scan_Complete: No Matches</span>
                            </div>
                          ) : (
                            <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                              <FaSearch size={30} />
                              <span className="font-mono text-[10px] uppercase tracking-[0.4em]">Awaiting_Input...</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Bottom System Status */}
              <div className="mt-auto p-8 border-t border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[8px] uppercase text-white/20 tracking-widest">Neural_Link</span>
                    <span className="font-mono text-[9px] uppercase text-cyan-500 tracking-[0.2em]">Established</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[8px] uppercase text-white/20 tracking-widest">Latency</span>
                    <span className="font-mono text-[9px] uppercase text-cyan-500 tracking-[0.2em]">14.2ms</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-white/5 relative overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 h-full bg-cyan-500/40" 
                  />
                </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
        }
        @keyframes scan-vertical {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .animate-scan-vertical {
          animation: scan-vertical 2s linear infinite;
        }
      `}} />
    </>
  );
}
