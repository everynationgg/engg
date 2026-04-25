import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FaUser, FaWallet, FaHistory, FaShieldAlt, FaTrophy, FaGamepad, FaLink, FaEnvelope, FaCalendarAlt, FaArrowLeft, FaArrowRight, FaLock, FaSkull, FaKey, FaCheckCircle, FaSatelliteDish, FaTerminal, FaSignOutAlt } from "react-icons/fa";
import WarpJump from "@/components/WarpJump";
import AlliesSidebar from "@/components/AlliesSidebar";
import { systemToast } from "../components/SystemToast";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/TacticalSlate";

interface Activity {
  id: string;
  type: "purchase" | "game_result" | "auth";
  description: string;
  timestamp: string;
  amount?: number;
}

export default function Profile() {
  const { x, y } = useParallax(20);
  const { token, refreshUser, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWarping, setIsWarping] = useState(false);
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

  const handleReturn = () => {
    setIsWarping(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  };

  const { user, stats, activities, achievements } = data || {};
  const { username, email, credits, createdAt, isVerified } = user || {};

  const handleUpdateCipher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cipherForm.next !== cipherForm.confirm) {
      systemToast("Cipher mismatch. Keys do not align.", "error");
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
        systemToast("Cipher updated successfully. Security re-established.", "success");
        setShowCipherModal(false);
        setCipherForm({ current: "", next: "", confirm: "" });
      } else {
        systemToast(result.error || "Update rejected. Invalid credentials.", "error");
      }
    } catch (err) {
      systemToast("Handshake interrupted. Encryption failure.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTerminateAccount = async () => {
    if (deleteConfirm !== "TERMINATE") {
      systemToast("Confirmation protocol invalid. Type TERMINATE to proceed.", "warning");
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
        systemToast("Protocol error. Termination aborted.", "error");
      }
    } catch (err) {
      systemToast("Protocol error. Termination aborted.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <AnimatePresence>
        {isWarping && <WarpJump />}
      </AnimatePresence>

      <AlliesSidebar />

      {/* Biometric Parallax Background */}
      <motion.div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{ x, y }}
      >
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020408]/80 via-transparent to-[#020408]" />
        
        {/* Floating Data Nodes */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
      </motion.div>

      {/* Global Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <main className="relative z-20 w-full max-w-[1400px] px-6 py-24 md:py-32 flex flex-col items-center">
        {loading ? (
          <div className="flex flex-col items-center gap-6 mt-32">
             <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
             <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-cyan-500/60 animate-pulse">Scanning_Biometrics...</span>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-12">
            {/* Header HUD: Biometric Profile */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
               <div className="lg:col-span-5">
                  <TacticalSlate color="#00f3ff" className="h-full">
                     <div className="p-10 flex flex-col items-center lg:items-start text-center lg:text-left gap-8">
                        <div className="relative">
                           <div className="w-32 h-32 rounded-full border-2 border-cyan-500/20 p-2 relative">
                              <div className="absolute inset-0 border-2 border-cyan-500/40 rounded-full animate-[spin_10s_linear_infinite] border-t-transparent" />
                              <div className="w-full h-full bg-cyan-500/10 rounded-full flex items-center justify-center overflow-hidden">
                                 <FaUser className="text-4xl text-cyan-500/40" />
                              </div>
                           </div>
                           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-[#020408] font-orbitron text-[8px] font-black tracking-widest uppercase">
                              {isVerified ? "Verified_Op" : "Unverified"}
                           </div>
                        </div>
                        <div className="flex flex-col gap-2">
                           <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">Subject_Identification</span>
                           <h1 className="font-orbitron text-4xl font-black uppercase text-white tracking-tighter">
                              {username}
                           </h1>
                           <div className="flex items-center gap-4 text-white/40 font-mono text-[10px] tracking-widest mt-2">
                              <FaEnvelope className="text-cyan-500/40" />
                              <span>{email}</span>
                           </div>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-cyan-500/20 via-cyan-500/5 to-transparent" />
                        <div className="flex items-center gap-8">
                           <div className="flex flex-col">
                              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20">Operational_Uptime</span>
                              <span className="font-orbitron text-xs text-white/60">
                                 {new Date(createdAt).toLocaleDateString()}
                              </span>
                           </div>
                           <div className="flex flex-col">
                              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20">Assigned_Sector</span>
                              <span className="font-orbitron text-xs text-white/60">PRIME_ROOT</span>
                           </div>
                        </div>
                     </div>
                  </TacticalSlate>
               </div>

               <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <TacticalSlate color="#a855f7" showScanner={false} className="h-full">
                     <div className="p-10 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                           <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-purple-400/60">CC_Assets</span>
                           <FaWallet className="text-purple-400/40" />
                        </div>
                        <div className="flex items-baseline gap-3">
                           <span className="font-orbitron text-5xl font-black text-white">{credits?.toLocaleString()}</span>
                           <span className="font-orbitron text-xs text-purple-500 font-bold tracking-widest">CC</span>
                        </div>
                        <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest leading-relaxed">
                           Credits secured and ready for terminal deployment.
                        </p>
                        <button 
                           onClick={() => window.location.href = "/shop"}
                           className="mt-4 py-4 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em] text-purple-400"
                        >
                           Initialize_Exchange
                        </button>
                     </div>
                  </TacticalSlate>

                  <TacticalSlate color="#eab308" showScanner={false} className="h-full">
                     <div className="p-10 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                           <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-yellow-500/60">Combat_Telemetry</span>
                           <FaTrophy className="text-yellow-500/40" />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                           <div className="flex flex-col gap-1">
                              <span className="font-orbitron text-2xl font-black text-white">{stats?.totalGames || 0}</span>
                              <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">Sorties</span>
                           </div>
                           <div className="flex flex-col gap-1">
                              <span className="font-orbitron text-2xl font-black text-white">{stats?.wins || 0}</span>
                              <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">Success</span>
                           </div>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (stats?.wins / stats?.totalGames) * 100 || 0)}%` }}
                              className="h-full bg-yellow-500 shadow-[0_0_10px_#eab308]"
                           />
                        </div>
                        <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/20 text-right">Efficiency_Rating</span>
                     </div>
                  </TacticalSlate>
               </div>
            </section>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               {/* Timeline: Operational Logs */}
               <div className="lg:col-span-8 flex flex-col gap-8">
                  <div className="flex items-center gap-6">
                     <FaHistory className="text-cyan-500/40" />
                     <h2 className="font-orbitron text-lg font-black uppercase tracking-[0.4em]">Operational_Logs</h2>
                     <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
                  </div>

                  <div className="flex flex-col gap-6">
                     {activities?.length > 0 ? (
                        activities.map((activity: Activity, idx: number) => (
                           <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                           >
                              <TacticalSlate color={activity.type === "purchase" ? "#a855f7" : "#00f3ff"} showScanner={false} className="p-6">
                                 <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                       <div className={`p-3 rounded bg-white/[0.03] border border-white/5 ${activity.type === "purchase" ? "text-purple-400" : "text-cyan-400"}`}>
                                          {activity.type === "purchase" ? <FaWallet /> : <FaSatelliteDish />}
                                       </div>
                                       <div className="flex flex-col gap-1">
                                          <span className="font-mono text-[7px] uppercase tracking-widest text-white/20">
                                             {new Date(activity.timestamp).toLocaleString()}
                                          </span>
                                          <p className="font-mono text-xs uppercase tracking-wider text-white/80">
                                             {activity.description}
                                          </p>
                                       </div>
                                    </div>
                                    {activity.amount && (
                                       <div className="flex flex-col items-end">
                                          <span className={`font-orbitron text-sm font-black ${activity.type === "purchase" ? "text-purple-400" : "text-cyan-400"}`}>
                                             {activity.amount > 0 ? "+" : ""}{activity.amount}
                                          </span>
                                          <span className="font-mono text-[7px] text-white/20 uppercase tracking-widest">Units</span>
                                       </div>
                                    )}
                                 </div>
                              </TacticalSlate>
                           </motion.div>
                        ))
                     ) : (
                        <div className="p-12 text-center border border-white/5 bg-white/[0.02] rounded-xl">
                           <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/20">No logs found in secure storage.</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Control Panel: Security & Settings */}
               <div className="lg:col-span-4 flex flex-col gap-8">
                  <div className="flex items-center gap-6">
                     <FaShieldAlt className="text-red-500/40" />
                     <h2 className="font-orbitron text-lg font-black uppercase tracking-[0.4em]">Control_Panel</h2>
                  </div>

                  <TacticalSlate color="#ef4444" showScanner={false} className="p-8">
                     <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                           <span className="font-orbitron text-[11px] font-black uppercase tracking-[0.2em] text-white/80">Security_Encryption</span>
                           <p className="font-mono text-[9px] uppercase tracking-widest text-white/30 leading-relaxed">
                              Manage your terminal access keys and encryption protocols.
                           </p>
                        </div>
                        
                         <div className="flex flex-col gap-4">
                            <button 
                               onClick={() => setShowCipherModal(true)}
                               className="w-full py-4 border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-4"
                            >
                               <FaKey className="text-xs opacity-40" />
                               <span className="font-orbitron text-[9px] uppercase tracking-[0.4em]">Update_Cipher</span>
                            </button>

                            <button 
                               onClick={() => {
                                 logout();
                                 window.location.href = "/?login=true";
                               }}
                               className="w-full py-4 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-4 text-cyan-400"
                            >
                               <FaSignOutAlt className="text-xs opacity-40" />
                               <span className="font-orbitron text-[9px] uppercase tracking-[0.4em]">Logout_Protocol</span>
                            </button>

                            <button 
                               onClick={() => setShowDeleteModal(true)}
                               className="w-full py-4 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all flex items-center justify-center gap-4 text-red-500/60"
                            >
                               <FaSkull className="text-xs opacity-40" />
                               <span className="font-orbitron text-[9px] uppercase tracking-[0.4em]">Account_Termination</span>
                            </button>
                         </div>
                     </div>
                  </TacticalSlate>

                  <TacticalSlate color="#00f3ff" showScanner={false} className="p-8">
                     <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                           <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-cyan-400">Achv_Protocol</span>
                           <FaTerminal className="text-cyan-400/40" />
                        </div>
                        <div className="flex flex-col gap-4">
                           {achievements?.length > 0 ? achievements.slice(0, 3).map((ach: any) => (
                              <div key={ach.id} className="flex items-center gap-4 group/ach">
                                 <div className="w-2 h-2 rounded-full bg-cyan-500/20 group-hover/ach:bg-cyan-500 transition-colors" />
                                 <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">{ach.title}</span>
                              </div>
                           )) : (
                              <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest italic">No medals awarded yet.</span>
                           )}
                        </div>
                     </div>
                  </TacticalSlate>

                  <button 
                    onClick={handleReturn}
                    className="mt-auto py-5 bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-4"
                  >
                    <FaArrowLeft className="text-xs opacity-40" />
                    <span className="font-orbitron text-[10px] uppercase tracking-[0.5em]">Command_Base</span>
                  </button>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Cipher Modal */}
      <AnimatePresence>
        {showCipherModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#020408]/90 backdrop-blur-md" 
               onClick={() => setShowCipherModal(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-lg"
            >
               <TacticalSlate color="#00f3ff">
                  <div className="p-12 flex flex-col gap-8">
                     <div className="flex flex-col gap-2">
                        <h3 className="font-orbitron text-xl font-black uppercase tracking-[0.4em]">Cipher_Update</h3>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">Re-key your terminal's operational encryption.</p>
                     </div>

                     <form onSubmit={handleUpdateCipher} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                           <div className="flex flex-col gap-2">
                              <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/40 ml-2">Current_Key</label>
                              <input 
                                 type="password" required
                                 value={cipherForm.current}
                                 onChange={e => setCipherForm({ ...cipherForm, current: e.target.value })}
                                 className="w-full bg-white/[0.03] border border-white/10 p-4 font-mono text-sm tracking-widest outline-none focus:border-cyan-500/50 transition-all" 
                              />
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/40 ml-2">Next_Key</label>
                              <input 
                                 type="password" required
                                 value={cipherForm.next}
                                 onChange={e => setCipherForm({ ...cipherForm, next: e.target.value })}
                                 className="w-full bg-white/[0.03] border border-white/10 p-4 font-mono text-sm tracking-widest outline-none focus:border-cyan-500/50 transition-all" 
                              />
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/40 ml-2">Verify_Next_Key</label>
                              <input 
                                 type="password" required
                                 value={cipherForm.confirm}
                                 onChange={e => setCipherForm({ ...cipherForm, confirm: e.target.value })}
                                 className="w-full bg-white/[0.03] border border-white/10 p-4 font-mono text-sm tracking-widest outline-none focus:border-cyan-500/50 transition-all" 
                              />
                           </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                           <button type="submit" disabled={isProcessing} className="flex-1 py-5 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-orbitron text-[10px] uppercase tracking-[0.4em] hover:bg-cyan-500/20 disabled:opacity-50">
                              {isProcessing ? "Processing..." : "Commit_Cipher"}
                           </button>
                           <button type="button" onClick={() => setShowCipherModal(false)} className="px-8 py-5 border border-white/10 font-orbitron text-[10px] uppercase tracking-[0.4em] hover:bg-white/5">
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
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-red-900/40 backdrop-blur-md" 
               onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-lg"
            >
               <TacticalSlate color="#ef4444">
                  <div className="p-12 flex flex-col gap-8">
                     <div className="flex items-center gap-4 text-red-500">
                        <FaSkull className="text-2xl" />
                        <h3 className="font-orbitron text-xl font-black uppercase tracking-[0.4em]">Final_Termination</h3>
                     </div>
                     <p className="font-mono text-xs uppercase tracking-wider text-white/60 leading-relaxed">
                        Danger: This will permanently wipe your operational history, CC assets, and neural identity from the ENGG mainframe. This action is irreversible.
                     </p>

                     <div className="flex flex-col gap-4">
                        <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-red-500/60 ml-2">Type "TERMINATE" to confirm</label>
                        <input 
                           type="text"
                           value={deleteConfirm}
                           onChange={e => setDeleteConfirm(e.target.value)}
                           placeholder="TERMINATE"
                           className="w-full bg-red-500/5 border border-red-500/20 p-4 font-mono text-sm tracking-widest outline-none focus:border-red-500 transition-all text-red-500" 
                        />
                     </div>

                     <div className="flex gap-4">
                        <button onClick={handleTerminateAccount} disabled={isProcessing} className="flex-1 py-5 bg-red-500/10 border border-red-500/50 text-red-500 font-orbitron text-[10px] uppercase tracking-[0.4em] hover:bg-red-500/20 disabled:opacity-50">
                           {isProcessing ? "Wiping..." : "Execute_Termination"}
                        </button>
                        <button onClick={() => setShowDeleteModal(false)} className="px-8 py-5 border border-white/10 font-orbitron text-[10px] uppercase tracking-[0.4em] hover:bg-white/5">
                           Abort
                        </button>
                     </div>
                  </div>
               </TacticalSlate>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
