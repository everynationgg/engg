import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserPlus, FaUserFriends, FaSearch, FaCheck, FaTimes, FaUserSecret, FaCircle } from "react-icons/fa";
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

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchAllies();
      fetchPendingRequests();
    }
  }, [isLoggedIn, token]);

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
      await fetch(`${import.meta.env.VITE_API_URL}/api/user/send-friend-request`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ friendId })
      });
      handleSearch(); // Refresh search to show pending status
    } catch (err) {
      console.error("Failed to send request", err);
    }
  };

  const acceptRequest = async (friendId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/user/accept-friend-request`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ friendId })
      });
      fetchAllies();
      fetchPendingRequests();
    } catch (err) {
      console.error("Failed to accept", err);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-1/2 -right-1 transform -translate-y-1/2 z-[100] bg-[#0a0b1e]/80 border border-cyan-500/30 p-4 rounded-l-xl backdrop-blur-xl hover:bg-cyan-500/10 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)] group"
      >
        <FaUserFriends className="text-cyan-400 text-xl group-hover:scale-110 transition-transform" />
        {pendingRequests.length > 0 && (
          <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
            {pendingRequests.length}
          </span>
        )}
      </button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[320px] md:w-[380px] bg-[#020408]/95 border-l border-white/5 z-[1000] backdrop-blur-3xl p-8 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-cyan-500" />
                  <span className="font-orbitron text-xs tracking-[0.3em] uppercase text-white/40">Subsystem</span>
                </div>
                <h2 className="font-orbitron text-xl font-black tracking-[0.1em] uppercase text-white">Allies_Network</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center border border-white/5 hover:border-red-500/50 hover:bg-red-500/10 transition-all rounded"
              >
                <FaTimes className="text-white/20 hover:text-red-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setActiveTab("allies")}
                className={`flex-1 py-3 font-orbitron text-[9px] uppercase tracking-[0.3em] border transition-all ${
                  activeTab === "allies" ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-white/5 border-white/5 text-white/30 hover:text-white/60"
                }`}
              >
                Roster
              </button>
              <button 
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-3 font-orbitron text-[9px] uppercase tracking-[0.3em] border transition-all ${
                  activeTab === "search" ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-white/5 border-white/5 text-white/30 hover:text-white/60"
                }`}
              >
                Scan_Grid
              </button>
            </div>

            {/* Search Bar */}
            {activeTab === "search" && (
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Scan for Usernames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-white/5 border border-white/10 p-4 font-mono text-xs uppercase tracking-widest text-white focus:border-cyan-500/50 focus:outline-none transition-all pr-12"
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <FaSearch />
                </button>
              </div>
            )}

            {/* List Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {activeTab === "allies" ? (
                <>
                  {/* Pending Requests Header */}
                  {pendingRequests.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4 opacity-40">
                        <FaUserPlus className="text-[10px]" />
                        <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Inbound_Signals</span>
                      </div>
                      <div className="space-y-3">
                        {pendingRequests.map((req) => (
                          <div key={req.id} className="p-4 bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-orbitron text-[10px] uppercase text-white tracking-widest">{req.username}</span>
                              <span className="font-mono text-[7px] uppercase text-cyan-400/60 tracking-widest">Pending_Approval</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => acceptRequest(req.id)}
                                className="w-8 h-8 flex items-center justify-center bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 transition-all rounded"
                              >
                                <FaCheck className="text-xs" />
                              </button>
                              <button className="w-8 h-8 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 transition-all rounded">
                                <FaTimes className="text-xs" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allies List */}
                  <div className="flex items-center gap-2 mb-4 opacity-40">
                    <FaUserFriends className="text-[10px]" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Active_Allies</span>
                  </div>
                  {allies.length > 0 ? (
                    allies.map((ally) => (
                      <div key={ally.id} className="p-4 bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                              <FaUserSecret className="text-white/20 group-hover:text-cyan-500/40 transition-colors" />
                            </div>
                            <FaCircle className={`absolute bottom-0 right-0 text-[10px] ${ally.status === 'online' ? 'text-cyan-400 shadow-[0_0_5px_#00f3ff]' : 'text-white/10'}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-orbitron text-[11px] uppercase text-white tracking-widest">{ally.username}</span>
                            <span className="font-mono text-[7px] uppercase text-white/20 tracking-widest">{ally.status === 'online' ? 'Connected' : 'Offline'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 opacity-20">
                      <span className="font-mono text-[9px] uppercase tracking-[0.3em]">No Allies Linked</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-30">Scanning Frequency...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <div key={user.id} className="p-4 bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-orbitron text-[10px] uppercase text-white tracking-widest">{user.username}</span>
                          <span className="font-mono text-[7px] uppercase text-white/20 tracking-widest">Operator_{user.id.slice(0, 8)}</span>
                        </div>
                        {user.friendshipStatus === 'accepted' ? (
                          <span className="font-mono text-[8px] uppercase text-cyan-400/40 tracking-widest">Linked</span>
                        ) : user.friendshipStatus === 'pending' ? (
                          <span className="font-mono text-[8px] uppercase text-yellow-500/40 tracking-widest">Sent</span>
                        ) : (
                          <button 
                            onClick={() => sendRequest(user.id)}
                            className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-orbitron text-[8px] uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all rounded"
                          >
                            Add_Ally
                          </button>
                        )}
                      </div>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-12 opacity-20">
                      <span className="font-mono text-[9px] uppercase tracking-[0.3em]">No Match Found</span>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Bottom Info */}
            <div className="mt-6 pt-6 border-t border-white/5 opacity-20">
              <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Net_Node: US-WEST-2 // SECURE</span>
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
      `}} />
    </>
  );
}
