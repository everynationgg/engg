import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaWallet, FaHistory, FaShieldAlt, FaTrophy, FaEnvelope, FaArrowLeft, FaSkull, FaKey, FaSignOutAlt, FaSatelliteDish } from "react-icons/fa";
import WarpJump from "@/components/WarpJump";
import AlliesSidebar from "@/components/AlliesSidebar";
import { systemToast } from "../components/SystemToast";
import AntiGravity3D from "@/components/AntiGravity3D";

interface Activity {
  id: string;
  type: "purchase" | "game_result" | "auth";
  description: string;
  timestamp: string;
  amount?: number;
}

export default function Profile() {
  const { token, logout } = useAuth();
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
    <div className="min-h-screen bg-[#050510] text-white relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <AnimatePresence>
        {isWarping && <WarpJump />}
      </AnimatePresence>

      <AlliesSidebar />

      <AntiGravity3D />
      <div className="fixed inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050510]/80 to-[#050510]" />

      <main className="relative z-20 w-full max-w-[1400px] px-6 py-24 md:py-32 flex flex-col items-center">
        {loading ? (
          <div className="flex flex-col items-center gap-6 mt-32">
             <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
             <span className="font-inter text-sm tracking-widest text-cyan-500/60 animate-pulse font-medium">Authenticating Identity...</span>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-12">
            {/* Header HUD: Biometric Profile */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
               <div className="lg:col-span-5">
                  <div className="h-full bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                     <div className="p-10 flex flex-col items-center lg:items-start text-center lg:text-left gap-8">
                        <div className="relative">
                           <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-1 relative shadow-[0_0_30px_rgba(0,243,255,0.1)]">
                              <div className="w-full h-full bg-[#050510] rounded-full flex items-center justify-center overflow-hidden border border-white/5">
                                 <FaUser className="text-4xl text-white/50" />
                              </div>
                           </div>
                           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-inter text-[10px] font-bold tracking-widest uppercase shadow-lg">
                              {isVerified ? "Verified" : "Unverified"}
                           </div>
                        </div>
                        <div className="flex flex-col gap-2">
                           <span className="font-inter text-xs uppercase tracking-widest text-white/40 font-medium">Subject Identification</span>
                           <h1 className="font-inter text-4xl font-bold text-white tracking-tight">
                              {username}
                           </h1>
                           <div className="flex items-center gap-3 text-white/50 font-inter text-sm mt-2">
                              <FaEnvelope className="text-cyan-400" />
                              <span>{email}</span>
                           </div>
                        </div>
                        <div className="w-full h-px bg-white/10" />
                        <div className="flex items-center gap-8 w-full">
                           <div className="flex flex-col flex-1">
                              <span className="font-inter text-[10px] uppercase tracking-widest text-white/30 font-medium mb-1">Uptime</span>
                              <span className="font-inter text-sm text-white/80 font-medium">
                                 {new Date(createdAt).toLocaleDateString()}
                              </span>
                           </div>
                           <div className="flex flex-col flex-1">
                              <span className="font-inter text-[10px] uppercase tracking-widest text-white/30 font-medium mb-1">Sector</span>
                              <span className="font-inter text-sm text-white/80 font-medium">PRIME ROOT</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-full bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="p-10 flex flex-col gap-6 relative z-10">
                        <div className="flex items-center justify-between">
                           <span className="font-inter text-xs uppercase tracking-widest text-purple-400 font-medium">CC Assets</span>
                           <FaWallet className="text-purple-400/50" />
                        </div>
                        <div className="flex items-baseline gap-3">
                           <span className="font-inter text-5xl font-black text-white">{credits?.toLocaleString()}</span>
                           <span className="font-orbitron text-sm text-purple-400 font-bold tracking-widest">CC</span>
                        </div>
                        <p className="font-inter text-sm text-white/50 leading-relaxed mt-2">
                           Credits secured and ready for terminal deployment.
                        </p>
                        <button 
                           onClick={() => window.location.href = "/shop"}
                           className="mt-auto py-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all font-inter text-xs font-semibold tracking-wide text-purple-300"
                        >
                           Initialize Exchange
                        </button>
                     </div>
                  </div>

                  <div className="h-full bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="p-10 flex flex-col gap-6 relative z-10">
                        <div className="flex items-center justify-between">
                           <span className="font-inter text-xs uppercase tracking-widest text-cyan-400 font-medium">Combat Telemetry</span>
                           <FaTrophy className="text-cyan-400/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-8 mt-2">
                           <div className="flex flex-col gap-2">
                              <span className="font-inter text-3xl font-bold text-white">{stats?.totalGames || 0}</span>
                              <span className="font-inter text-[10px] uppercase tracking-widest text-white/40 font-medium">Sorties</span>
                           </div>
                           <div className="flex flex-col gap-2">
                              <span className="font-inter text-3xl font-bold text-white">{stats?.wins || 0}</span>
                              <span className="font-inter text-[10px] uppercase tracking-widest text-white/40 font-medium">Success</span>
                           </div>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (stats?.wins / Math.max(1, stats?.totalGames)) * 100 || 0)}%` }}
                              className="h-full bg-cyan-400 shadow-[0_0_10px_#00f3ff]"
                           />
                        </div>
                        <span className="font-inter text-[10px] uppercase tracking-widest text-white/30 text-right font-medium">Efficiency Rating</span>
                     </div>
                  </div>
               </div>
            </section>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               {/* Timeline: Operational Logs */}
               <div className="lg:col-span-8 flex flex-col gap-8">
                  <div className="flex items-center gap-6">
                     <FaHistory className="text-cyan-400/50" />
                     <h2 className="font-inter text-xl font-bold tracking-tight text-white">Operational Logs</h2>
                     <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>

                  <div className="flex flex-col gap-4">
                     {activities?.length > 0 ? (
                        activities.map((activity: Activity, idx: number) => (
                           <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                           >
                              <div className="p-6 bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl backdrop-blur-md transition-all shadow-sm flex items-center justify-between gap-6">
                                 <div className="flex items-center gap-6">
                                    <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${activity.type === "purchase" ? "text-purple-400" : "text-cyan-400"}`}>
                                       {activity.type === "purchase" ? <FaWallet /> : <FaSatelliteDish />}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                       <span className="font-inter text-[10px] uppercase tracking-widest text-white/40 font-medium">
                                          {new Date(activity.timestamp).toLocaleString()}
                                       </span>
                                       <p className="font-inter text-sm text-white/90">
                                          {activity.description}
                                       </p>
                                    </div>
                                 </div>
                                 {activity.amount && (
                                    <div className="flex flex-col items-end">
                                       <span className={`font-inter text-lg font-bold ${activity.type === "purchase" ? "text-purple-400" : "text-cyan-400"}`}>
                                          {activity.amount > 0 ? "+" : ""}{activity.amount}
                                       </span>
                                       <span className="font-orbitron text-[9px] text-white/30 uppercase tracking-widest font-bold">CC</span>
                                    </div>
                                 )}
                              </div>
                           </motion.div>
                        ))
                     ) : (
                        <div className="p-12 text-center border border-white/5 bg-white/5 rounded-2xl backdrop-blur-sm">
                           <p className="font-inter text-sm text-white/40">No logs found in secure storage.</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Control Panel: Security & Settings */}
               <div className="lg:col-span-4 flex flex-col gap-8">
                  <div className="flex items-center gap-6">
                     <FaShieldAlt className="text-white/50" />
                     <h2 className="font-inter text-xl font-bold tracking-tight text-white">Control Panel</h2>
                     <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>

                  <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-lg flex flex-col gap-8">
                     <div className="flex flex-col gap-3">
                        <span className="font-inter text-sm font-semibold tracking-wide text-white">Security Encryption</span>
                        <p className="font-inter text-sm text-white/50 leading-relaxed">
                           Manage your terminal access keys and encryption protocols.
                        </p>
                     </div>
                     
                     <div className="flex flex-col gap-4">
                        <button 
                           onClick={() => setShowCipherModal(true)}
                           className="w-full py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3 shadow-sm"
                        >
                           <FaKey className="text-xs text-white/60" />
                           <span className="font-inter text-sm font-medium tracking-wide">Update Cipher</span>
                        </button>

                        <button 
                           onClick={() => {
                             logout();
                             window.location.href = "/?login=true";
                           }}
                           className="w-full py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-white/80 hover:text-white shadow-sm"
                        >
                           <FaSignOutAlt className="text-xs opacity-60" />
                           <span className="font-inter text-sm font-medium tracking-wide">Logout Protocol</span>
                        </button>

                        <button 
                           onClick={() => setShowDeleteModal(true)}
                           className="w-full py-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all flex items-center justify-center gap-3 text-red-400 hover:text-red-300 shadow-sm"
                        >
                           <FaSkull className="text-xs opacity-60" />
                           <span className="font-inter text-sm font-medium tracking-wide">Account Termination</span>
                        </button>
                     </div>
                  </div>

                  <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-lg flex flex-col gap-6">
                     <div className="flex items-center justify-between">
                        <span className="font-inter text-sm font-semibold tracking-wide text-white">Achievements</span>
                        <FaTrophy className="text-yellow-400/50" />
                     </div>
                     <div className="flex flex-col gap-4">
                        {achievements?.length > 0 ? achievements.slice(0, 3).map((ach: any) => (
                           <div key={ach.id} className="flex items-center gap-4 group/ach p-2 hover:bg-white/5 rounded-lg transition-colors">
                              <div className="w-2 h-2 rounded-full bg-yellow-400/30 group-hover/ach:bg-yellow-400 transition-colors" />
                              <span className="font-inter text-sm text-white/80">{ach.title}</span>
                           </div>
                        )) : (
                           <span className="font-inter text-sm text-white/40 italic">No medals awarded yet.</span>
                        )}
                     </div>
                  </div>

                  <button 
                    onClick={handleReturn}
                    className="mt-auto py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 shadow-sm"
                  >
                    <FaArrowLeft className="text-xs text-white/60" />
                    <span className="font-inter text-sm font-medium tracking-wide">Return to Hub</span>
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
               className="absolute inset-0 bg-[#050510]/80 backdrop-blur-xl" 
               onClick={() => setShowCipherModal(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-lg"
            >
               <div className="p-10 rounded-[2rem] bg-white/5 border border-white/10 shadow-2xl flex flex-col gap-8 backdrop-blur-2xl">
                  <div className="flex flex-col gap-2 text-center">
                     <h3 className="font-inter text-2xl font-bold tracking-tight text-white">Cipher Update</h3>
                     <p className="font-inter text-sm text-white/50">Re-key your terminal's operational encryption.</p>
                  </div>

                  <form onSubmit={handleUpdateCipher} className="flex flex-col gap-6">
                     <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                           <label className="font-inter text-xs uppercase tracking-widest text-white/40 ml-2 font-medium">Current Key</label>
                           <input 
                              type="password" required
                              value={cipherForm.current}
                              onChange={e => setCipherForm({ ...cipherForm, current: e.target.value })}
                              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 font-mono text-sm tracking-widest text-white outline-none focus:border-cyan-500/50 transition-all focus:shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
                           />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="font-inter text-xs uppercase tracking-widest text-white/40 ml-2 font-medium">Next Key</label>
                           <input 
                              type="password" required
                              value={cipherForm.next}
                              onChange={e => setCipherForm({ ...cipherForm, next: e.target.value })}
                              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 font-mono text-sm tracking-widest text-white outline-none focus:border-cyan-500/50 transition-all focus:shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
                           />
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="font-inter text-xs uppercase tracking-widest text-white/40 ml-2 font-medium">Verify Next Key</label>
                           <input 
                              type="password" required
                              value={cipherForm.confirm}
                              onChange={e => setCipherForm({ ...cipherForm, confirm: e.target.value })}
                              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 font-mono text-sm tracking-widest text-white outline-none focus:border-cyan-500/50 transition-all focus:shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
                           />
                        </div>
                     </div>

                     <div className="flex gap-4 mt-4">
                        <button type="submit" disabled={isProcessing} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-inter font-semibold tracking-wide transition-all shadow-md disabled:opacity-50">
                           {isProcessing ? "Processing..." : "Commit Cipher"}
                        </button>
                        <button type="button" onClick={() => setShowCipherModal(false)} className="px-8 py-4 rounded-xl border border-white/10 font-inter font-semibold tracking-wide hover:bg-white/5 transition-all text-white/80">
                           Abort
                        </button>
                     </div>
                  </form>
               </div>
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
               className="absolute inset-0 bg-red-950/80 backdrop-blur-xl" 
               onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-lg"
            >
               <div className="p-10 rounded-[2rem] bg-[#050510]/80 border border-red-500/30 shadow-2xl flex flex-col gap-8 backdrop-blur-2xl">
                  <div className="flex items-center justify-center gap-4 text-red-500">
                     <FaSkull className="text-3xl" />
                     <h3 className="font-inter text-2xl font-bold tracking-tight">Final Termination</h3>
                  </div>
                  <p className="font-inter text-sm text-red-100/70 leading-relaxed text-center">
                     Danger: This will permanently wipe your operational history, CC assets, and neural identity from the ENGG mainframe. This action is irreversible.
                  </p>

                  <div className="flex flex-col gap-4">
                     <label className="font-inter text-xs uppercase tracking-widest text-red-400/80 font-medium ml-2">Type "TERMINATE" to confirm</label>
                     <input 
                        type="text"
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="TERMINATE"
                        className="w-full bg-red-950/50 border border-red-500/30 rounded-xl p-4 font-mono text-sm tracking-widest text-red-400 outline-none focus:border-red-500 transition-all focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                     />
                  </div>

                  <div className="flex gap-4 mt-2">
                     <button onClick={handleTerminateAccount} disabled={isProcessing} className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-inter font-semibold tracking-wide transition-all shadow-md disabled:opacity-50">
                        {isProcessing ? "Wiping..." : "Execute Termination"}
                     </button>
                     <button onClick={() => setShowDeleteModal(false)} className="px-8 py-4 rounded-xl border border-white/10 font-inter font-semibold tracking-wide hover:bg-white/5 transition-all text-white/80">
                        Abort
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
