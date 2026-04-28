import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaWallet, FaHistory, FaShieldAlt, FaTrophy, FaEnvelope, FaLock, FaSkull, FaKey, FaSatelliteDish, FaTerminal, FaSignOutAlt } from "react-icons/fa";
import AlliesSidebar from "@/components/AlliesSidebar";
import { systemToast } from "../components/common/SystemToast";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/common/TacticalSlate";
import { SciFiButton } from "@/components/common/SciFiButton";
import { HUDOverlay } from "@/components/common/HUDOverlay";

interface Activity {
  id: string;
  type: "purchase" | "game_result" | "auth";
  description: string;
  timestamp: string;
  amount?: number;
}

export default function Profile() {
  const { x, y } = useParallax(15);
  const { token, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCipherModal, setShowCipherModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cipherForm, setCipherForm] = useState({ current: "", next: "", confirm: "" });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        // Log handled on server
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const { user, stats, activities, achievements } = data || {};
  const { username, email, credits, createdAt, isVerified } = user || {};

  const handleUpdateCipher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cipherForm.next.length < 6) {
      systemToast("Cipher must be at least 6 characters.", "error");
      return;
    }
    if (cipherForm.next !== cipherForm.confirm) {
      systemToast("Cipher mismatch.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/update-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          currentPassword: cipherForm.current,
          newPassword: cipherForm.next
        })
      });
      const result = await res.json();
      if (res.ok) {
        systemToast("Cipher updated.", "success");
        setShowCipherModal(false);
        setCipherForm({ current: "", next: "", confirm: "" });
      } else {
        systemToast(result.error || "Update rejected.", "error");
      }
    } catch (err) {
      systemToast("Handshake interrupted.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTerminateAccount = async () => {
    if (deleteConfirm !== "TERMINATE") {
      systemToast("Invalid protocol.", "warning");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/terminate`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        systemToast("Termination aborted.", "error");
      }
    } catch (err) {
      systemToast("Protocol error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <HUDOverlay pageLabel="COMMAND_PROFILE">
      <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
        <AlliesSidebar />

        {/* Cinematic Background Layer */}
        <motion.div 
          className="fixed inset-0 z-0 opacity-20 pointer-events-none grayscale"
          style={{ x, y }}
        >
          <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020408]/80 via-transparent to-[#020408]" />
        </motion.div>

        <main className="relative z-20 w-full max-w-[1400px] px-4 md:px-8 xl:px-12 pb-40 flex flex-col items-center">
          {/* Header Clearance Spacer */}
          <div className="h-[140px] lg:h-[180px] w-full shrink-0 pointer-events-none" />

          {loading ? (
            <div className="flex flex-col items-center gap-4 mt-32">
               <div className="w-8 h-8 border border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin" />
               <span className="font-mono text-[8px] uppercase tracking-[0.5em] text-cyan-400/40 animate-pulse">Syncing_Identity...</span>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-12">
              {/* HUD Header Section */}
              <header className="w-full flex flex-col items-center gap-4 mb-8 text-center px-4 md:px-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-[1px] bg-cyan-500/40" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.6em] text-cyan-400/60">Neural_Link_Active</span>
                </div>
                <h1 className="font-orbitron font-black text-4xl lg:text-5xl tracking-[0.4em] uppercase text-white leading-tight">
                  Command <span className="text-cyan-400">Nexus</span>
                </h1>
              </header>

              <div className="w-full flex flex-col gap-8">
                {/* Header HUD: Biometric Profile */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                   <div className="lg:col-span-5">
                      <TacticalSlate color="#00f3ff" className="h-full">
                         <div className="p-10 pt-16 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
                            <div className="relative">
                               <div className="w-24 h-24 border border-cyan-500/20 p-2 relative">
                                  <div className="absolute inset-0 border border-cyan-500/40 animate-[spin_10s_linear_infinite] border-t-transparent" />
                                  <div className="w-full h-full bg-cyan-500/5 flex items-center justify-center overflow-hidden">
                                     <FaUser className="text-2xl text-cyan-500/20" />
                                  </div>
                               </div>
                               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-500 text-[#020408] font-orbitron text-[7px] font-black tracking-widest uppercase">
                                  {isVerified ? "Verified" : "Unverified"}
                               </div>
                            </div>
                             <div className="flex flex-col gap-1">
                                <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-cyan-400/40">ID_SUBJECT</span>
                                <h2 className="font-orbitron text-3xl font-black uppercase text-white tracking-widest">
                                   {username}
                                </h2>
                               <div className="flex items-center gap-3 text-white/20 font-mono text-[9px] tracking-widest mt-1">
                                  <FaEnvelope className="text-cyan-500/20" />
                                  <span>{email}</span>
                               </div>
                            </div>
                            <div className="w-full h-[1px] bg-white/5" />
                            <div className="w-full flex items-center justify-between gap-6">
                               <div className="flex flex-col">
                                  <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/10">Uptime</span>
                                  <span className="font-orbitron text-[10px] text-white/40">
                                     {new Date(createdAt).toLocaleDateString()}
                                  </span>
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-purple-400/20">Authorized_Assets</span>
                                  <div className="flex items-center gap-1">
                                     <span className="font-orbitron text-lg font-black text-white">{credits?.toLocaleString()}</span>
                                     <span className="font-orbitron text-[8px] text-purple-500 font-bold">CC</span>
                                  </div>
                               </div>
                            </div>
                            <SciFiButton 
                               onClick={() => window.location.href = "/shop"}
                               className="w-full py-4 border border-purple-500/20 text-purple-400/60 hover:text-purple-400 text-[8px]"
                            >
                               Initialize_Exchange_Link
                            </SciFiButton>
                         </div>
                      </TacticalSlate>
                   </div>

                    <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Operator Rank & Progression */}
                       <TacticalSlate color="#00f3ff" showScanner={true} className="h-full">
                          <div className="p-10 pt-16 flex flex-col gap-6">
                             <div className="flex items-center justify-between">
                                <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-cyan-400/40">Operator_Rank</span>
                                <div className="px-2 py-0.5 border border-cyan-500/20 bg-cyan-500/5">
                                   <span className="font-mono text-[7px] text-cyan-400 uppercase tracking-widest">
                                      {user?.level < 6 ? "INITIATE" : 
                                       user?.level < 11 ? "OPERATIVE" :
                                       user?.level < 21 ? "ELITE" :
                                       user?.level < 51 ? "COMMANDER" : "LEGEND"}
                                   </span>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-6">
                                <div className="relative">
                                   <span className="font-orbitron text-5xl font-black text-white">{user?.level}</span>
                                   <span className="absolute -top-1 -right-4 font-mono text-[8px] text-cyan-400">LVL</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-end gap-2">
                                      <span className="font-orbitron text-xl font-bold text-white/80">{user?.xp?.toLocaleString()}</span>
                                      <span className="font-mono text-[8px] text-white/20 uppercase pb-1">/ {user?.xpForNextLevel?.toLocaleString()} XP</span>
                                   </div>
                                   <div className="w-full w-[160px] h-2 bg-white/5 relative overflow-hidden">
                                      <motion.div 
                                         className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_10px_#00f3ff]"
                                         initial={{ width: 0 }}
                                         animate={{ width: `${(user?.levelProgress || 0) * 100}%` }}
                                         transition={{ duration: 1.5, ease: "easeOut" }}
                                      />
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex justify-between items-center mt-2 pt-4 border-t border-white/5">
                                <span className="font-mono text-[7px] uppercase tracking-widest text-white/10">Sync_Progress</span>
                                <span className="font-orbitron text-[9px] text-cyan-400/60 font-bold">{Math.floor((user?.levelProgress || 0) * 100)}%</span>
                             </div>
                          </div>
                       </TacticalSlate>

                       {/* Telemetry (Sorties/Wins) */}
                       <TacticalSlate color="#eab308" showScanner={false} className="h-full">
                          <div className="p-10 pt-16 flex flex-col gap-4">
                             <div className="flex items-center justify-between">
                                <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-yellow-500/40">Sortie_Telemetry</span>
                                <FaTrophy className="text-yellow-500/20" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                   <span className="font-orbitron text-2xl font-black text-white">{stats?.totalGames || 0}</span>
                                   <span className="font-mono text-[7px] uppercase tracking-widest text-white/10">Sorties</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                   <span className="font-orbitron text-2xl font-black text-white">{stats?.wins || 0}</span>
                                   <span className="font-mono text-[7px] uppercase tracking-widest text-white/10">Success</span>
                                </div>
                             </div>
                             <div className="w-full flex gap-[2px] h-1.5 mt-2">
                                {[...Array(12)].map((_, i) => {
                                  const ratio = stats?.totalGames > 0 ? stats.wins / stats.totalGames : 0;
                                  const isActive = i < Math.floor(ratio * 12);
                                  return (
                                    <div key={i} className={`flex-1 h-full transition-all duration-500 ${isActive ? "bg-yellow-500/60" : "bg-white/5"}`} />
                                  );
                                })}
                             </div>
                          </div>
                       </TacticalSlate>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   {/* Operational Logs */}
                   <div className="lg:col-span-8 flex flex-col gap-6">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-1.5 h-1.5 bg-cyan-500 shadow-[0_0_8px_#00f3ff]" />
                        <h2 className="font-orbitron text-[12px] font-black uppercase tracking-[0.4em] text-white">Operational_Logs</h2>
                      </div>

                      <div className="flex flex-col gap-4">
                         {activities?.length > 0 ? (
                            activities.map((activity: Activity, idx: number) => (
                               <motion.div
                                  key={activity.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.03 }}
                               >
                                   <TacticalSlate color={activity.type === "purchase" ? "#a855f7" : "#00f3ff"} showScanner={false} className="p-4 group/log transition-all hover:bg-white/[0.01]">
                                      <div className="flex items-center justify-between gap-4">
                                         <div className="flex items-center gap-4">
                                            <div className={`p-3 border border-white/5 ${activity.type === "purchase" ? "text-purple-400" : "text-cyan-400"}`}>
                                               {activity.type === "purchase" ? <FaWallet className="text-xs" /> : <FaSatelliteDish className="text-xs" />}
                                            </div>
                                            <div className="flex flex-col">
                                               <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/10">
                                                  {new Date(activity.timestamp).toLocaleString()}
                                               </span>
                                               <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                                                  {activity.description}
                                               </p>
                                            </div>
                                         </div>
                                         {activity.amount && (
                                            <div className="text-right">
                                               <span className={`font-orbitron text-lg font-black ${activity.type === "purchase" ? "text-purple-400" : "text-cyan-400"}`}>
                                                  {activity.amount > 0 ? "+" : ""}{activity.amount}
                                               </span>
                                            </div>
                                         )}
                                      </div>
                                   </TacticalSlate>
                               </motion.div>
                            ))
                         ) : (
                            <div className="p-8 text-center border border-white/5 bg-white/[0.01]">
                               <p className="font-mono text-[8px] uppercase tracking-[0.5em] text-white/10">No secure logs found.</p>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Control Panel */}
                   <div className="lg:col-span-4 flex flex-col gap-6">
                      <div className="flex items-center gap-4 mb-2">
                         <FaShieldAlt className="text-red-500/40 text-xs" />
                         <h2 className="font-orbitron text-[12px] font-black uppercase tracking-[0.4em] text-white">Security_Console</h2>
                      </div>

                      <TacticalSlate color="#ef4444" showScanner={false} className="p-6">
                         <div className="flex flex-col gap-6">
                             <div className="flex flex-col gap-4">
                                 <button 
                                    onClick={() => setShowCipherModal(true)}
                                    className="w-full py-2 text-left px-4 font-orbitron text-[9px] uppercase tracking-[0.2em] text-white/40 border border-white/5 hover:border-white/10 transition-all flex items-center gap-3"
                                 >
                                    <FaKey className="text-[10px]" /> Update_Cipher
                                 </button>

                                 <button 
                                    onClick={() => {
                                      logout();
                                      window.location.href = "/login";
                                    }}
                                    className="w-full py-2 text-left px-4 font-orbitron text-[9px] uppercase tracking-[0.2em] text-cyan-400/60 border border-cyan-500/10 hover:border-cyan-500/20 transition-all flex items-center gap-3"
                                 >
                                    <FaSignOutAlt className="text-[10px]" /> Logout_Session
                                 </button>

                                 <button 
                                    onClick={() => setShowDeleteModal(true)}
                                    className="w-full py-2 text-left px-4 font-orbitron text-[9px] uppercase tracking-[0.2em] text-red-500/40 border border-red-500/10 hover:border-red-500/20 transition-all flex items-center gap-3"
                                 >
                                    <FaSkull className="text-[10px]" /> Termination
                                 </button>
                             </div>
                         </div>
                      </TacticalSlate>

                      <TacticalSlate color="#00f3ff" showScanner={false} className="p-6">
                         <div className="flex flex-col gap-4">
                            <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-cyan-400/40">Achievements</span>
                            <div className="flex flex-col gap-3">
                               {achievements?.length > 0 ? achievements.slice(0, 3).map((ach: any) => (
                                  <div key={ach.id} className="flex items-center gap-3">
                                     <div className="w-1 h-1 bg-cyan-500/40" />
                                     <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">{ach.title}</span>
                                  </div>
                               )) : (
                                  <span className="font-mono text-[8px] text-white/10 uppercase tracking-widest italic">Node_Empty</span>
                               )}
                            </div>
                         </div>
                      </TacticalSlate>
                   </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Cipher Modal */}
        <AnimatePresence>
          {showCipherModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#020408]/95 backdrop-blur-sm">
              <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="w-full max-w-sm"
              >
                 <TacticalSlate color="#00f3ff">
                    <div className="p-8 flex flex-col gap-6">
                       <h3 className="font-orbitron text-lg font-black uppercase tracking-[0.4em]">Cipher_Update</h3>
                       <form onSubmit={handleUpdateCipher} className="flex flex-col gap-4">
                          <div className="flex flex-col gap-3">
                             <input 
                                type="password" required placeholder="Current_Key"
                                value={cipherForm.current}
                                onChange={e => setCipherForm({ ...cipherForm, current: e.target.value })}
                                className="w-full bg-white/[0.02] border border-white/5 p-3 font-mono text-xs tracking-widest outline-none focus:border-cyan-500/20" 
                             />
                             <input 
                                type="password" required placeholder="New_Key"
                                value={cipherForm.next}
                                onChange={e => setCipherForm({ ...cipherForm, next: e.target.value })}
                                className="w-full bg-white/[0.02] border border-white/5 p-3 font-mono text-xs tracking-widest outline-none focus:border-cyan-500/20" 
                                minLength={6}
                             />
                             <input 
                                type="password" required placeholder="Verify_Key"
                                value={cipherForm.confirm}
                                onChange={e => setCipherForm({ ...cipherForm, confirm: e.target.value })}
                                className="w-full bg-white/[0.02] border border-white/5 p-3 font-mono text-xs tracking-widest outline-none focus:border-cyan-500/20" 
                                minLength={6}
                             />
                          </div>
                          <div className="flex gap-3">
                             <button type="submit" disabled={isProcessing} className="flex-1 py-2 bg-cyan-400 text-[#010204] font-orbitron text-[10px] font-black uppercase tracking-widest">
                                {isProcessing ? "Wait..." : "Update"}
                             </button>
                             <button type="button" onClick={() => setShowCipherModal(false)} className="flex-1 py-2 border border-white/10 text-white/40 font-orbitron text-[10px] uppercase tracking-widest">
                                Abort
                             </button>
                          </div>
                       </form>
                    </div>
                 </TacticalSlate>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-red-900/10 backdrop-blur-md">
              <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="w-full max-w-sm"
              >
                 <TacticalSlate color="#ef4444">
                    <div className="p-8 flex flex-col gap-6">
                       <div className="flex items-center gap-3 text-red-500">
                          <FaSkull className="text-xl" />
                          <h3 className="font-orbitron text-lg font-black uppercase tracking-[0.4em]">Final_Purge</h3>
                       </div>
                       <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 leading-relaxed">
                          Irreversible: Wipe all operational history and assets.
                       </p>
                       <div className="flex flex-col gap-4">
                          <input 
                             type="text"
                             value={deleteConfirm}
                             onChange={e => setDeleteConfirm(e.target.value)}
                             placeholder="Type TERMINATE"
                             className="w-full bg-red-500/5 border border-red-500/20 p-3 font-mono text-xs tracking-widest outline-none focus:border-red-500 text-red-500" 
                          />
                          <div className="flex gap-3">
                             <button onClick={handleTerminateAccount} disabled={isProcessing} className="flex-1 py-2 bg-red-500 text-white font-orbitron text-[10px] font-black uppercase tracking-widest">
                                Execute
                             </button>
                             <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 border border-white/10 text-white/40 font-orbitron text-[10px] uppercase tracking-widest">
                                Abort
                             </button>
                          </div>
                       </div>
                    </div>
                 </TacticalSlate>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </HUDOverlay>
  );
}

