import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaWallet, FaHistory, FaShieldAlt, FaTrophy, FaGamepad, FaLink, FaEnvelope, FaCalendarAlt, FaArrowLeft, FaArrowRight, FaLock, FaSkull, FaKey, FaCheckCircle } from "react-icons/fa";
import WarpJump from "@/components/WarpJump";
import AlliesSidebar from "@/components/AlliesSidebar";
import { systemToast } from "../components/SystemToast";

interface Activity {
  id: string;
  type: "purchase" | "game_result" | "auth";
  description: string;
  timestamp: string;
  amount?: number;
}

export default function Profile() {
  const { token, refreshUser } = useAuth();
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
        // Log handled on server, silent on client for security
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
        systemToast("Account terminated. Data wiped.", "success");
        sessionStorage.clear();
        window.location.href = "/";
      } else {
        systemToast("Termination blocked. Admin override required.", "error");
      }
    } catch (err) {
      systemToast("Protocol error. Termination aborted.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white pt-60 md:pt-72 pb-20 px-6 md:px-16 relative overflow-y-auto selection:bg-cyan-500/30">
      <AlliesSidebar />
      <AnimatePresence>
        {isWarping && <WarpJump />}
      </AnimatePresence>

      <button 
        onClick={handleReturn}
        className="fixed top-8 left-8 z-[110] flex items-center gap-3 font-orbitron text-[9px] uppercase tracking-[0.4em] text-white/40 hover:text-cyan-400 transition-all group hidden md:flex"
      >
        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10">
          <FaArrowLeft className="text-[10px]" />
        </div>
        Return_to_Base
      </button>

      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(6,182,212,0.15)_0%,transparent_50%)]" />

      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

      <div className="w-full relative z-10">
        {/* Profile Header */}
        <header className="mb-16 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 pb-12 border-b-2 border-white/10 relative">
          {/* Tactical Header Accents */}
          <div className="absolute bottom-[-2px] left-0 w-32 h-[2px] bg-cyan-500 shadow-[0_0_15px_#00f3ff]" />
          
          <div className="flex flex-col md:flex-row items-center gap-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-32 h-32 md:w-44 md:h-44"
            >
              <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-[pulse_4s_infinite] shadow-[0_0_50px_rgba(6,182,212,0.15)]" />
              <div className="absolute inset-3 border border-white/10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                <FaUser className="text-6xl text-white/20" />
                {/* Animated HUD Ring */}
                <div className="absolute inset-0 border-t-2 border-cyan-500/40 rounded-full animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="absolute bottom-2 right-2 w-12 h-12 bg-cyan-500 rounded-full border-4 border-[#020408] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] z-20">
                <FaShieldAlt className="text-white text-base" />
              </div>
            </motion.div>
 
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#00f3ff]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.6em] text-cyan-400">Status: Active_Engagement</span>
              </div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-orbitron text-4xl md:text-6xl font-black tracking-[0.2em] uppercase text-white mb-6"
              >
                {username}
              </motion.h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/40 rounded shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]">
                  <FaCheckCircle className="text-cyan-400 text-xs" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold">Verified_Operative</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded">
                  <FaEnvelope className="text-[10px] text-white/30" />
                  <span className="font-mono text-[9px] lowercase tracking-wider text-white/60">{email}</span>
                </div>
              </div>
            </div>
          </div>
 
          <div className="flex flex-col items-center md:items-end p-8 w-full md:min-w-[320px] relative overflow-hidden group">
            {/* Background Polish */}
            <div className="absolute inset-0 bg-cyan-500/[0.03] border border-cyan-500/20 group-hover:bg-cyan-500/[0.06] transition-colors" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30" />
            
            <div className="relative z-10 flex flex-col items-center md:items-end">
              <span className="font-mono text-[9px] uppercase text-white/30 mb-2 tracking-[0.5em] font-bold">Asset_Allocation</span>
              <div className="flex items-center gap-3">
                <span className="font-orbitron text-6xl font-black text-cyan-400 tracking-tighter drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">{credits?.toLocaleString()}</span>
                <span className="font-orbitron text-sm text-cyan-400/50 mt-4 tracking-widest uppercase font-bold">CC</span>
              </div>
              <button 
                onClick={() => window.location.href = "/shop"}
                className="mt-8 px-12 py-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 text-cyan-400 font-orbitron text-[10px] uppercase tracking-[0.4em] transition-all relative overflow-hidden group/btn"
              >
                <span className="relative z-10">Initialize_Purchase</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              </button>
            </div>
          </div>
        </header>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT COLUMN: Summary & Actions */}
          <div className="lg:col-span-4 space-y-10">
            {/* Account Progress */}
            <div className="bg-white/[0.03] border border-white/10 p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rotate-45 translate-x-12 -translate-y-12" />
               <h3 className="font-orbitron text-xs tracking-[0.3em] uppercase mb-8 text-white/60 border-l-2 border-cyan-500 pl-4">Operative_Status</h3>
               <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="font-mono text-[9px] uppercase text-white/30 tracking-widest">Level_Progress</span>
                      <span className="font-orbitron text-xs text-cyan-400 font-bold">LVL 24</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "65%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-cyan-500 shadow-[0_0_10px_#00f3ff]" 
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[7px] text-white/20 tracking-tighter uppercase">
                      <span>14,250 XP</span>
                      <span>20,000 XP</span>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 border border-white/5 rounded text-center">
                       <span className="block font-orbitron text-lg font-bold text-white mb-1">0.65</span>
                       <span className="font-mono text-[7px] uppercase tracking-widest text-white/30">Win_Rate</span>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5 rounded text-center">
                       <span className="block font-orbitron text-lg font-bold text-white mb-1">12</span>
                       <span className="font-mono text-[7px] uppercase tracking-widest text-white/30">Medals</span>
                    </div>
                 </div>
               </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-orbitron text-xs tracking-[0.3em] uppercase text-white/60 border-l-2 border-cyan-500 pl-4">Tactical_Actions</h3>
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              </div>
              <div className="space-y-4">
                <button 
                  onClick={() => setShowCipherModal(true)}
                  className="w-full py-5 px-6 bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em] text-white flex items-center justify-between group"
                >
                  Update_Cipher <FaKey className="text-[10px] text-cyan-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
                {!isVerified && (
                  <button 
                    onClick={() => window.location.href = "/verify"}
                    className="w-full py-5 px-6 bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em] text-white flex items-center justify-between group"
                  >
                    Verify_Email <FaLink className="text-[10px] text-cyan-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-5 px-6 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em] text-red-400/80 flex items-center justify-between group"
                >
                  Terminate_Account <FaSkull className="text-[10px] text-red-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Service Records & Logs */}
          <div className="lg:col-span-8 space-y-12">
            {/* Stats & Medal Vault Combined */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Stats */}
               <section className="bg-white/[0.02] border border-white/5 p-8 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-cyan-500/30" />
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-1 h-6 bg-cyan-500" />
                    <h2 className="font-orbitron text-sm tracking-[0.4em] uppercase">Service_Record</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: "Total Engagements", value: stats?.gamesPlayed || 0, icon: <FaGamepad className="text-cyan-400" /> },
                      { label: "Confirmed Victories", value: stats?.gamesWon || 0, icon: <FaTrophy className="text-yellow-500" /> },
                      { label: "Operation Failures", value: stats?.gamesLost || 0, icon: <FaArrowLeft className="text-red-400 rotate-180" /> },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        className="p-4 bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-sm">
                             {stat.icon}
                           </div>
                           <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">{stat.label}</span>
                        </div>
                        <span className="font-orbitron text-xl font-bold">{stat.value.toLocaleString()}</span>
                      </motion.div>
                    ))}
                  </div>
               </section>

               {/* Medals Summary */}
               <section className="bg-white/[0.02] border border-white/5 p-8 relative">
                  <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-500/30" />
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-1 h-6 bg-cyan-500" />
                    <h2 className="font-orbitron text-sm tracking-[0.4em] uppercase">Medal_Vault</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-square bg-white/[0.02] border border-white/5 animate-pulse" />
                      ))
                    ) : achievements?.length > 0 ? (
                      achievements.slice(0, 6).map((medal: any, i: number) => (
                        <div key={medal.id} className={`aspect-square flex items-center justify-center border ${medal.unlocked ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 opacity-20'}`}>
                           <span className="text-xl">{medal.icon}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center border border-white/5 bg-white/[0.01]">
                        <span className="font-mono text-[8px] uppercase tracking-widest opacity-20">No Medals</span>
                      </div>
                    )}
                  </div>
                  <button className="w-full mt-6 py-2 border border-white/5 font-mono text-[8px] uppercase tracking-[0.4em] text-white/30 hover:text-white hover:bg-white/5 transition-all">
                     View_Full_Archive
                  </button>
               </section>
            </div>

            {/* Logs & Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {/* Activity Log */}
               <section className="md:col-span-2">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-1 h-6 bg-cyan-500" />
                    <h2 className="font-orbitron text-sm tracking-[0.4em] uppercase">Log_Archive</h2>
                  </div>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="p-12 border border-white/5 bg-white/[0.01] text-center">
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-20 animate-pulse">Retrieving Logs...</span>
                      </div>
                    ) : activities?.length > 0 ? (
                      activities.slice(0, 5).map((activity: Activity, i: number) => (
                        <motion.div
                          key={activity.id}
                          className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-6"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 flex items-center justify-center border text-xs ${
                              activity.type === 'purchase' ? 'border-cyan-500/30 text-cyan-400' : 
                              activity.type === 'game_result' ? 'border-purple-500/30 text-purple-400' : 
                              'border-white/20 text-white/40'
                            }`}>
                              {activity.type === 'purchase' ? <FaWallet /> : 
                               activity.type === 'game_result' ? <FaTrophy /> : 
                               <FaHistory />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-orbitron text-[9px] uppercase tracking-widest text-white/80">{activity.description}</span>
                              <span className="font-mono text-[7px] uppercase tracking-wider text-white/20">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {activity.amount && (
                            <span className="font-orbitron text-xs text-cyan-400 font-bold">+{activity.amount.toLocaleString()} CC</span>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-12 border border-white/5 bg-white/[0.01] text-center">
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-20">No Logs Recorded</span>
                      </div>
                    )}
                  </div>
               </section>

               {/* Node Info */}
               <section>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-1 h-6 bg-cyan-500" />
                    <h2 className="font-orbitron text-sm tracking-[0.4em] uppercase">Telemetry</h2>
                  </div>
                  <div className="bg-cyan-500/5 border border-cyan-500/10 p-6 relative">
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/40" />
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="font-mono text-[7px] uppercase text-white/20 tracking-widest block">Connection_Node</span>
                        <div className="flex justify-between border-b border-white/10 pb-1">
                          <span className="font-mono text-[9px] uppercase text-cyan-500 tracking-widest">US-WEST-2</span>
                          <span className="font-mono text-[9px] uppercase text-cyan-500 tracking-widest">12ms</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="font-mono text-[7px] uppercase text-white/20 tracking-widest block">Neural_Uptime</span>
                        <div className="flex justify-between border-b border-white/10 pb-1">
                          <span className="font-mono text-[9px] uppercase text-cyan-500 tracking-widest">99.98%</span>
                          <span className="font-mono text-[9px] uppercase text-cyan-500 tracking-widest">SECURE</span>
                        </div>
                      </div>
                      <div className="pt-4 flex flex-col gap-2">
                         <div className="h-[2px] w-full bg-cyan-500/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-cyan-500/40 animate-[shimmer_2s_infinite]" />
                         </div>
                         <span className="font-mono text-[6px] uppercase tracking-[0.3em] text-cyan-500/40">Encryption: Quantum_Grade_AES</span>
                      </div>
                    </div>
                  </div>
               </section>
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <AnimatePresence>
        {showCipherModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCipherModal(false)}
              className="absolute inset-0 bg-[#020408]/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0b1e] border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)]"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-6 bg-cyan-500 shadow-[0_0_10px_#00f3ff]" />
                <h2 className="font-orbitron text-lg tracking-[0.4em] uppercase">Cipher_Update</h2>
              </div>
              <form onSubmit={handleUpdateCipher} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Current_Protocol_Cipher</label>
                  <input 
                    type="password" 
                    required
                    value={cipherForm.current}
                    onChange={(e) => setCipherForm({ ...cipherForm, current: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 font-mono text-sm focus:border-cyan-500/50 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Next_Protocol_Cipher</label>
                  <input 
                    type="password" 
                    required
                    value={cipherForm.next}
                    onChange={(e) => setCipherForm({ ...cipherForm, next: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 font-mono text-sm focus:border-cyan-500/50 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Verify_Next_Cipher</label>
                  <input 
                    type="password" 
                    required
                    value={cipherForm.confirm}
                    onChange={(e) => setCipherForm({ ...cipherForm, confirm: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 font-mono text-sm focus:border-cyan-500/50 outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCipherModal(false)}
                    className="flex-1 py-3 border border-white/10 font-orbitron text-[9px] uppercase tracking-[0.4em] hover:bg-white/5 transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron text-[9px] uppercase tracking-[0.4em] transition-all disabled:opacity-50"
                  >
                    {isProcessing ? "PROCESSING..." : "Update_Cipher"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-[#020408]/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0b1e] border border-red-500/30 p-8 shadow-[0_0_50px_rgba(239,68,68,0.1)]"
            >
              <div className="flex items-center gap-4 mb-6 text-red-500">
                <FaSkull />
                <h2 className="font-orbitron text-lg tracking-[0.4em] uppercase">Critical_Alert</h2>
              </div>
              <p className="font-mono text-[10px] text-white/60 mb-8 leading-relaxed uppercase tracking-wider">
                You are initiating a full account termination protocol. This will permanently wipe your credits, service history, and medal vault. This action is <span className="text-red-500 font-bold">IRREVERSIBLE</span>.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Type "TERMINATE" to confirm</label>
                  <input 
                    type="text" 
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full bg-red-500/5 border border-red-500/20 px-4 py-3 font-mono text-sm focus:border-red-500/50 outline-none text-red-400 transition-colors"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 border border-white/10 font-orbitron text-[9px] uppercase tracking-[0.4em] hover:bg-white/5 transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    disabled={isProcessing || deleteConfirm !== "TERMINATE"}
                    onClick={handleTerminateAccount}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-orbitron text-[9px] uppercase tracking-[0.4em] transition-all disabled:opacity-30"
                  >
                    {isProcessing ? "TERMINATING..." : "Execute_Termination"}
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
