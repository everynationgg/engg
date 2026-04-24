import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaWallet, FaHistory, FaShieldAlt, FaTrophy, FaGamepad, FaLink, FaEnvelope, FaCalendarAlt, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import WarpJump from "@/components/WarpJump";
import AlliesSidebar from "@/components/AlliesSidebar";

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

  const { user, stats, activities } = data || {};
  const { username, email, credits, createdAt } = user || {};

  return (
    <div className="min-h-screen bg-[#020408] text-white pt-24 pb-20 px-6 md:px-16 relative overflow-y-auto selection:bg-cyan-500/30">
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
        <header className="mb-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 pb-12 border-b border-white/5">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-32 h-32 md:w-40 md:h-40"
            >
              <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.1)]" />
              <div className="absolute inset-2 border border-white/10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                <FaUser className="text-5xl md:text-6xl text-white/20" />
              </div>
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-cyan-500 rounded-full border-4 border-[#020408] flex items-center justify-center shadow-lg">
                <FaShieldAlt className="text-white text-sm" />
              </div>
            </motion.div>

            <div className="text-center md:text-left">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-orbitron text-4xl md:text-5xl font-black tracking-[0.2em] uppercase text-white mb-2"
              >
                {username}
              </motion.h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400">Verified_Account</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded">
                  <FaEnvelope className="text-[10px] text-white/30" />
                  <span className="font-mono text-[9px] lowercase tracking-wider text-white/60">{email}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded">
                  <FaCalendarAlt className="text-[10px] text-white/30" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/60">Registered_{new Date(createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end bg-cyan-500/5 border border-cyan-500/20 p-8 min-w-[240px]">
            <span className="font-mono text-[10px] uppercase text-white/30 mb-2 tracking-[0.4em]">Available_Credits</span>
            <div className="flex items-center gap-3">
              <span className="font-orbitron text-5xl font-black text-cyan-400 tracking-tighter">{credits}</span>
              <span className="font-orbitron text-sm text-cyan-400/50 mt-4 tracking-widest uppercase">CC</span>
            </div>
            <button 
              onClick={() => window.location.href = "/shop"}
              className="mt-6 w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/40 text-cyan-400 font-orbitron text-[9px] uppercase tracking-[0.4em] transition-all"
            >
              Allocate_More
            </button>
          </div>
        </header>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Stats Card */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-6 bg-cyan-500" />
                <h2 className="font-orbitron text-lg tracking-[0.4em] uppercase">Service_Record</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: "Matches", value: stats?.gamesPlayed || 0, icon: <FaGamepad className="text-cyan-400" /> },
                  { label: "Victories", value: stats?.gamesWon || 0, icon: <FaTrophy className="text-yellow-500" /> },
                  { label: "Losses", value: stats?.gamesLost || 0, icon: <FaArrowLeft className="text-red-400 rotate-180" /> },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-white/[0.03] border border-white/10 flex flex-col gap-4 group hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-sm">
                        {stat.icon}
                      </div>
                      <span className="font-orbitron text-2xl font-bold">{stat.value}</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Activity Feed */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-6 bg-cyan-500" />
                <h2 className="font-orbitron text-lg tracking-[0.4em] uppercase">Log_Archive</h2>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="p-12 border border-white/5 bg-white/[0.01] text-center">
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-20 animate-pulse">Retrieving Logs...</span>
                  </div>
                ) : activities?.length > 0 ? (
                  activities.map((activity: Activity, i: number) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 flex items-center justify-center border ${
                          activity.type === 'purchase' ? 'border-cyan-500/30 text-cyan-400' : 
                          activity.type === 'game_result' ? 'border-purple-500/30 text-purple-400' : 
                          'border-white/20 text-white/40'
                        }`}>
                          {activity.type === 'purchase' ? <FaWallet /> : 
                           activity.type === 'game_result' ? <FaTrophy /> : 
                           <FaHistory />}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-orbitron text-[10px] uppercase tracking-widest text-white/80">{activity.description}</span>
                          <span className="font-mono text-[8px] uppercase tracking-wider text-white/20">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {activity.amount && (
                        <span className="font-orbitron text-sm text-cyan-400">+{activity.amount} CC</span>
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

            {/* Medal Vault */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-6 bg-cyan-500" />
                <h2 className="font-orbitron text-lg tracking-[0.4em] uppercase">Medal_Vault</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square bg-white/[0.02] border border-white/5 animate-pulse" />
                  ))
                ) : data.achievements?.length > 0 ? (
                  data.achievements.map((medal: any, i: number) => (
                    <motion.div
                      key={medal.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`relative aspect-square flex flex-col items-center justify-center border transition-all duration-500 group ${
                        medal.unlocked 
                        ? 'bg-white/[0.04] border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/10' 
                        : 'bg-black/40 border-white/5 grayscale opacity-30'
                      }`}
                    >
                      <span className={`text-2xl mb-1 transition-transform duration-500 ${medal.unlocked ? 'group-hover:scale-125 group-hover:rotate-12' : ''}`}>
                        {medal.icon}
                      </span>
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#020408]/95 p-2 text-center pointer-events-none">
                        <span className="font-orbitron text-[7px] uppercase tracking-tighter text-white mb-1">{medal.name}</span>
                        <span className="font-mono text-[6px] uppercase tracking-widest text-white/40 leading-tight">{medal.description}</span>
                        {medal.unlocked && (
                          <span className="mt-1 font-mono text-[6px] text-cyan-400">+{medal.prestigeXp} XP</span>
                        )}
                      </div>
                      
                      {/* Rarity Indicator (Bottom Dot) */}
                      <div className={`absolute bottom-2 w-1 h-1 rounded-full ${
                        medal.rarity === 'legendary' ? 'bg-red-500 shadow-[0_0_5px_red]' :
                        medal.rarity === 'epic' ? 'bg-yellow-500 shadow-[0_0_5px_yellow]' :
                        medal.rarity === 'rare' ? 'bg-purple-500 shadow-[0_0_5px_purple]' :
                        'bg-cyan-500 shadow-[0_0_5px_cyan]'
                      }`} />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full p-12 border border-white/5 bg-white/[0.01] text-center">
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-20">No Medals Detected</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white/[0.03] border border-white/10 p-8">
              <h3 className="font-orbitron text-xs tracking-[0.3em] uppercase mb-6 text-white/60">Account_Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em] text-white flex items-center justify-between">
                  Update_Cipher <FaArrowRight className="text-[8px]" />
                </button>
                <button className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em] text-white flex items-center justify-between">
                  Verify_Email <FaArrowRight className="text-[8px]" />
                </button>
                <button className="w-full py-4 px-6 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em] text-red-400/80 flex items-center justify-between">
                  Terminate_Account <FaArrowRight className="text-[8px]" />
                </button>
              </div>
            </div>

            <div className="bg-cyan-500/5 border border-cyan-500/10 p-8">
              <h3 className="font-orbitron text-xs tracking-[0.3em] uppercase mb-4 text-cyan-400/60">Node_Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="font-mono text-[8px] uppercase text-white/20 tracking-widest">Protocol</span>
                  <span className="font-mono text-[8px] uppercase text-cyan-500 tracking-widest">WSS_SECURE</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="font-mono text-[8px] uppercase text-white/20 tracking-widest">Region</span>
                  <span className="font-mono text-[8px] uppercase text-cyan-500 tracking-widest">US-WEST-2</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[8px] uppercase text-white/20 tracking-widest">Latency</span>
                  <span className="font-mono text-[8px] uppercase text-cyan-500 tracking-widest">12ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
