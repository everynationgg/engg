import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaGem, FaArrowLeft, FaShieldAlt, FaLock, FaCheckCircle, FaBolt, FaCrown, FaDatabase } from "react-icons/fa";

interface Pack {
  id: string;
  name: string;
  amount: number;
  price: string;
  currency: string;
  bonus?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// Hardcoded Fallback Packs to ensure Shop is never empty
const FALLBACK_PACKS: Pack[] = [
  { id: "pack_250", name: "Standard Core", amount: 250, price: "4.99", currency: "USD", rarity: "common" },
  { id: "pack_500", name: "Tactical Core", amount: 500, price: "8.99", currency: "USD", bonus: "+50 Bonus", rarity: "rare" },
  { id: "pack_1000", name: "Elite Core", amount: 1000, price: "15.99", currency: "USD", bonus: "+150 Bonus", rarity: "epic" },
  { id: "pack_2500", name: "Sovereign Core", amount: 2500, price: "34.99", currency: "USD", bonus: "+500 Bonus", rarity: "legendary" },
];

const creditCoreImg = "credit_core_asset_1776962578764.png";

export default function Shop() {
  const { isLoggedIn, credits, token, login, logout, refreshUser } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successCredits, setSuccessCredits] = useState<number | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);

  // Animated counter for credits
  const [displayCredits, setDisplayCredits] = useState(credits);

  useEffect(() => {
    let timeoutId: any;
    const countUp = () => {
      if (displayCredits < credits) {
        setDisplayCredits(prev => Math.min(prev + 5, credits));
        timeoutId = setTimeout(countUp, 20);
      } else if (displayCredits > credits) {
        setDisplayCredits(credits);
      }
    };
    countUp();
    return () => clearTimeout(timeoutId);
  }, [credits, displayCredits]);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/shop/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.packs && data.packs.length > 0) {
          setPacks(data.packs);
        } else {
          setPacks(FALLBACK_PACKS);
        }
      })
      .catch(() => setPacks(FALLBACK_PACKS))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateOrder = async () => {
    if (!selectedPack) return "";
    if (!isLoggedIn) {
      setError("Authentication Required: Please sign in to establish connection.");
      return "";
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shop/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packId: selectedPack.id }),
      });
      if (response.status === 401) {
        logout();
        setError("Session Synchronisation Lost: Re-authorization required.");
        return "";
      }
      const order = await response.json();
      if (!response.ok) {
        setError(order.error || `Server Response: ${response.status}`);
        return "";
      }
      return order.id;
    } catch (err) {
      setError("Network Handshake Failed. Verify server reachability.");
      return "";
    }
  };

  const handleApprove = async (data: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shop/capture-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderID: data.orderID, packId: selectedPack?.id }),
      });
      if (response.status === 401) {
        logout();
        setError("Handshake Interrupt: Session Expired.");
        return;
      }
      const captureData = await response.json();
      if (captureData.success) {
        setSuccessCredits(captureData.credits);
        setSelectedPack(null);
        refreshUser();
        setTimeout(() => setSuccessCredits(null), 5000);
      } else {
        setError(captureData.error || "Transfer failed. Credits not allocated.");
      }
    } catch (err) {
      setError("Verification failed. Handshake interrupted.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError("Authorization Error: Identity Mismatch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-root min-h-screen bg-[#020408] text-white relative overflow-hidden selection:bg-cyan-500/30 font-inter">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      <div className="scanline" />
      
      {/* Particle Overlay (CSS Only) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-cyan-400 animate-float"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-16 min-h-screen flex flex-col">
        
        {/* Header HUD */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-1.5 h-10 bg-cyan-500 shadow-[0_0_20px_#00f3ff]" />
              <h1 className="font-orbitron font-black text-4xl md:text-5xl tracking-[0.4em] uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                Credit <span className="text-cyan-400">Exchange</span>
              </h1>
            </div>
            <div className="flex items-center gap-4 ml-6 opacity-40">
               <span className="font-mono text-[10px] tracking-[0.4em] uppercase">Auth_Session: Stable</span>
               <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
               <span className="font-mono text-[10px] tracking-[0.4em] uppercase">Node: US-WEST-2</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-8"
          >
            <AnimatePresence mode="wait">
              {isLoggedIn && (
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase text-white/30 mb-1 tracking-[0.3em]">Operational Balance</p>
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-orbitron text-4xl text-cyan-400 font-bold tracking-tighter">
                      {displayCredits}
                    </span>
                    <span className="font-orbitron text-[12px] tracking-[0.2em] text-cyan-400/50 pt-2">CC</span>
                  </div>
                </div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => window.location.href = "/"}
              className="group flex items-center gap-3 px-6 py-3 border border-white/10 bg-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all backdrop-blur-md"
            >
              <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />
              <span className="font-orbitron text-[10px] uppercase tracking-[0.4em]">Return</span>
            </button>
          </motion.div>
        </header>

        {/* Status Messages */}
        <AnimatePresence>
          {successCredits && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-12 p-6 border-2 border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center gap-4 backdrop-blur-xl"
            >
              <FaCheckCircle className="text-cyan-400 text-2xl animate-pulse" />
              <p className="font-orbitron text-sm tracking-[0.2em] uppercase text-cyan-400">
                Authorized Transfer Complete: +{successCredits} Units Allocated
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(6,182,212,0.2)]" />
              <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-cyan-500 animate-pulse">Syncing Grid...</p>
            </div>
          ) : !isLoggedIn ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md p-10 bg-[#0a0f16]/80 border border-white/10 backdrop-blur-2xl relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/40" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-500/40" />
              
              <div className="text-center mb-10">
                <FaShieldAlt className="mx-auto text-4xl text-cyan-400/40 mb-4" />
                <h2 className="font-orbitron text-xl tracking-[0.3em] uppercase">Identity Verification</h2>
                <p className="font-mono text-[9px] uppercase tracking-widest opacity-30 mt-2">Required for Financial Synchronization</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-2">
                  <label className="block font-mono text-[9px] uppercase text-white/40 tracking-[0.2em]">Operator ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 p-4 font-mono text-sm focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all text-white"
                    placeholder="EMAIL_ADDRESS"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-mono text-[9px] uppercase text-white/40 tracking-[0.2em]">Access Key</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 p-4 font-mono text-sm focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-5 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all font-orbitron text-xs uppercase tracking-[0.4em] text-cyan-400 relative overflow-hidden group"
                >
                  <span className="relative z-10">Establish Connection</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              </form>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {packs.map((pack, idx) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedPack(pack)}
                  className={`relative group p-8 border transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center backdrop-blur-md ${
                    selectedPack?.id === pack.id 
                      ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.2)] scale-[1.05] z-20" 
                      : "bg-white/[0.02] border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Rarity Indicator */}
                  <div className="absolute top-4 left-4 font-mono text-[8px] opacity-20 tracking-tighter uppercase">
                    Tier_{pack.rarity}
                  </div>
                  <div className="absolute top-4 right-4">
                    {pack.rarity === "legendary" ? <FaCrown className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" /> : 
                     pack.rarity === "epic" ? <FaBolt className="text-purple-400" /> : 
                     pack.rarity === "rare" ? <FaGem className="text-cyan-400" /> : 
                     <FaDatabase className="text-white/20" />}
                  </div>

                  {/* Bonus Badge */}
                  {pack.bonus && (
                    <div className="absolute top-10 left-0 px-3 py-1 bg-gradient-to-r from-cyan-600 to-cyan-400 text-[#020408] font-orbitron text-[8px] font-black tracking-widest uppercase -rotate-2 shadow-lg">
                      {pack.bonus}
                    </div>
                  )}

                  {/* Asset Rendering */}
                  <div className="relative w-40 h-40 mb-8 mt-4 flex items-center justify-center">
                    <div className={`absolute inset-0 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ${
                      pack.rarity === "legendary" ? "bg-yellow-500/20" : "bg-cyan-400/20"
                    }`} />
                    <img 
                      src={creditCoreImg} 
                      alt="Core" 
                      className={`w-full h-full object-contain relative z-10 transition-all duration-700 ${
                        selectedPack?.id === pack.id ? "scale-110 drop-shadow-[0_0_20px_#00f3ff]" : "opacity-60 group-hover:opacity-100 group-hover:scale-105"
                      }`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                        if (fallback) (fallback as HTMLElement).style.opacity = '0.4';
                      }}
                    />
                    <FaDatabase className="fallback-icon text-6xl text-cyan-400/0 absolute group-hover:text-cyan-400/40 transition-colors pointer-events-none" />
                  </div>
                  
                  <h3 className="font-orbitron text-sm tracking-[0.3em] uppercase mb-1 text-white/90 group-hover:text-white transition-colors text-center">
                    {pack.name}
                  </h3>
                  <p className="font-mono text-[18px] font-bold text-white tracking-[0.1em] mb-8">
                    {pack.amount} <span className="text-[10px] text-cyan-400/50 tracking-widest">CC</span>
                  </p>
                  
                  <div className="mt-auto w-full pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center">
                       <span className="font-mono text-xs opacity-30 mt-1 mr-1">$</span>
                       <span className="font-orbitron text-2xl font-bold">{pack.price}</span>
                    </div>
                    
                    <div className="w-full">
                      {selectedPack?.id === pack.id ? (
                        <div className="animate-in fade-in zoom-in duration-300">
                          {import.meta.env.VITE_PAYPAL_CLIENT_ID ? (
                            <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
                              <PayPalButtons
                                style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                createOrder={handleCreateOrder}
                                onApprove={handleApprove}
                              />
                            </PayPalScriptProvider>
                          ) : (
                            <div className="p-4 border border-yellow-500/30 bg-yellow-500/5 rounded text-[10px] text-yellow-500/70 text-center font-mono uppercase tracking-wider">
                              Payment Gateway Offline: Missing Config
                            </div>
                          )}
                        </div>
                      ) : (
                        <button className="w-full py-3 bg-white/5 border border-white/10 font-orbitron text-[9px] uppercase tracking-[0.4em] group-hover:border-cyan-400/50 group-hover:text-cyan-400 transition-all">
                          Initialize Link
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>

        <footer className="mt-16 flex justify-between items-center border-t border-white/5 pt-10 font-mono text-[9px] uppercase tracking-[0.5em] text-white/20">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 bg-white/10" />
             <span>© 2026 ENGG_NET // CRYPTO_SHOP</span>
          </div>
          <div className="flex gap-12">
            <span className="animate-pulse text-cyan-500/40">LINK_ACTIVE</span>
          </div>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scanline {
          position: fixed;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 50%,
            rgba(0, 0, 0, 0.1) 50%
          );
          background-size: 100% 4px;
          z-index: 5;
          pointer-events: none;
          opacity: 0.5;
        }
        .shop-root::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.02;
          pointer-events: none;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}} />
    </div>
  );
}
