import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaGem, FaArrowLeft, FaShieldAlt, FaLock, FaCheckCircle, FaBolt, FaCrown, FaDatabase } from "react-icons/fa";
import { Link } from "wouter";
import WarpJump from "@/components/WarpJump";

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

const creditCoreImg = "credit_core_asset.png";

const RARITY_CONFIG = {
  common: { color: "hsl(185 100% 50%)", glow: "rgba(6, 182, 212, 0.2)", label: "Standard" },
  rare: { color: "hsl(270 80% 60%)", glow: "rgba(168, 85, 247, 0.25)", label: "Tactical" },
  epic: { color: "hsl(45 90% 55%)", glow: "rgba(234, 179, 8, 0.3)", label: "Elite" },
  legendary: { color: "hsl(0 100% 60%)", glow: "rgba(239, 68, 68, 0.4)", label: "Sovereign" }
};

export default function Shop() {
  const { isLoggedIn, credits, token, logout, refreshUser } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successCredits, setSuccessCredits] = useState<number | null>(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWarping, setIsWarping] = useState(false);

  // Animated counter for credits
  const [displayCredits, setDisplayCredits] = useState(credits);

  useEffect(() => {
    if (displayCredits === credits) return;

    let timeoutId: any;
    const countUp = () => {
      const diff = credits - displayCredits;
      if (diff > 0) {
        // High-velocity step: faster if the gap is large, minimum 1
        const step = Math.max(1, Math.ceil(diff / 15));
        setDisplayCredits(prev => Math.min(prev + step, credits));
        timeoutId = setTimeout(countUp, 16); // ~60fps target
      } else if (diff < 0) {
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

  const handlePackSelect = (pack: Pack) => {
    if (selectedPack?.id === pack.id) return;
    setSelectedPack(pack);
    setIsSyncing(true);
    // Cinematic handshake delay
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const handleReturn = () => {
    setIsWarping(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  };

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
        setIsInjecting(true);
        setSuccessCredits(captureData.credits);
        setSelectedPack(null);
        refreshUser();
        setTimeout(() => {
          setIsInjecting(false);
          setSuccessCredits(null);
        }, 6000);
      } else {
        setError(captureData.error || "Transfer failed. Credits not allocated.");
      }
    } catch (err) {
      setError("Verification failed. Handshake interrupted.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white pt-64 md:pt-80 pb-24 px-6 md:px-16 relative overflow-x-hidden selection:bg-cyan-500/30 shop-root">
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

      <div className="relative z-10 w-full px-6 md:px-16 pb-24 min-h-screen flex flex-col">

        {/* Header HUD */}
        <header className="flex flex-col lg:flex-row justify-between items-center lg:items-end mb-16 md:mb-24 gap-8 md:gap-12 border-b border-white/5 pb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="flex flex-col gap-1 mb-6">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="w-1 h-6 bg-cyan-500 shadow-[0_0_15px_#00f3ff]" />
                <span className="font-mono text-[9px] tracking-[0.5em] uppercase text-cyan-400/60">Operational_Hub</span>
              </div>
              <h1 className="font-orbitron font-black text-3xl md:text-5xl lg:text-6xl tracking-[0.2em] uppercase text-white leading-tight">
                Credit <span className="text-cyan-400">Exchange</span>
              </h1>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 opacity-30">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] tracking-[0.3em] uppercase">Auth_Session: Stable</span>
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] tracking-[0.3em] uppercase">Node: US-WEST-2</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-auto"
          >
            <AnimatePresence mode="wait">
              {/* Redundant balance removed to prevent overlap with Navbar HUD */}
            </AnimatePresence>
          </motion.div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-center gap-6"
        >
          <button
            onClick={handleReturn}
            className="group relative px-10 py-5 bg-white/5 border-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all flex items-center gap-4 overflow-hidden"
          >
            {/* Tactical Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/60" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/60" />
            
            <FaArrowLeft className="text-cyan-400 group-hover:-translate-x-2 transition-transform duration-500" />
            <div className="flex flex-col items-start">
              <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.6em] text-white/80 group-hover:text-white">
                Return_to_Base
              </span>
              <span className="font-mono text-[7px] uppercase tracking-widest text-cyan-500/40">Sector_01_Central</span>
            </div>

            {/* Hover Scan Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
          
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence>
          {(successCredits || error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mb-16 p-8 border-2 flex flex-col md:flex-row items-center justify-center gap-6 backdrop-blur-xl ${error ? "border-red-500/50 bg-red-500/10" : "border-cyan-500/50 bg-cyan-500/10"
                }`}
            >
              {error ? (
                <div className="w-3 h-3 bg-red-500 animate-pulse rounded-full" />
              ) : (
                <FaCheckCircle className="text-cyan-400 text-3xl animate-pulse" />
              )}
              <p className={`font-orbitron text-base tracking-[0.2em] uppercase text-center ${error ? "text-red-400" : "text-cyan-400"}`}>
                {error ? error : `Authorized Transfer Complete: +${successCredits?.toLocaleString()} Units Allocated`}
              </p>
              {error && (
                <button onClick={() => setError(null)} className="px-6 py-2 text-red-500/50 hover:text-red-400 font-mono text-[10px] uppercase tracking-widest border border-red-500/20 hover:border-red-500/50 transition-all">
                  Dismiss
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
              <div className="w-20 h-20 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_30px_rgba(6,182,212,0.2)]" />
              <p className="font-mono text-xs uppercase tracking-[0.8em] text-cyan-500 animate-pulse ml-3">Syncing_Grid...</p>
            </div>
          ) : !isLoggedIn ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl p-16 bg-[#0a0f16]/60 border border-white/10 backdrop-blur-2xl relative text-center"
              >
                <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-cyan-500/20" />
                <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-cyan-500/20" />

                <FaLock className="mx-auto text-6xl text-cyan-500/30 mb-8" />
                <h2 className="font-orbitron text-3xl tracking-[0.5em] uppercase mb-6">Connection Required</h2>
                <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/30 mb-12 leading-relaxed">
                  Anonymous Browsing Restricted.<br />Initialize Secure Identity Handshake to Proceed.
                </p>

                <Link
                  href="/login"
                  className="inline-block px-16 py-6 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all font-orbitron text-[11px] uppercase tracking-[0.6em] text-cyan-400 relative overflow-hidden group"
                >
                  <span className="relative z-10">Access Portal</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Link>
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-8 md:gap-10 w-full max-w-[1600px] mx-auto">
              {packs.map((pack, idx) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15, duration: 0.8 }}
                  onClick={() => handlePackSelect(pack)}
                  className={`relative group p-10 border transition-all duration-700 cursor-pointer flex flex-col items-center backdrop-blur-md w-full max-w-[360px] ${selectedPack?.id === pack.id
                    ? "bg-cyan-500/5 shadow-[0_0_60px_rgba(6,182,212,0.15)] z-20"
                    : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                    }`}
                  style={{ 
                    borderColor: (selectedPack?.id === pack.id && pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) 
                      ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color 
                      : undefined 
                  }}
                >
                  {/* Tactical Brackets (Appear on Hover/Select) */}
                  <div className="absolute top-4 left-4 w-10 h-10 border-t border-l border-white/0 group-hover:border-cyan-500/40 transition-all duration-700" />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-b border-r border-white/0 group-hover:border-cyan-500/40 transition-all duration-700" />
                  
                  {/* Internal Scanning Line */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none overflow-hidden">
                     <div className="w-full h-1/2 bg-gradient-to-b from-cyan-500/40 to-transparent animate-[scan_4s_linear_infinite]" />
                  </div>

                  {/* Rarity Indicator */}
                  <div className="absolute top-8 left-10 flex flex-col items-start gap-1">
                    <span className="font-mono text-[8px] opacity-30 tracking-[0.4em] uppercase leading-none">Security_Protocol</span>
                    <span className="font-orbitron text-[9px] tracking-[0.2em] uppercase font-bold" style={{ color: (pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : "hsl(185 100% 50%)" }}>Tier_{pack.rarity}</span>
                  </div>
                  <div className="absolute top-6 right-8 text-xl">
                    {pack.rarity === "legendary" ? <FaCrown className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" /> :
                      pack.rarity === "epic" ? <FaBolt className="text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" /> :
                        pack.rarity === "rare" ? <FaGem className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" /> :
                          <FaDatabase className="text-cyan-400/30" />}
                  </div>

                  {/* Bonus Badge */}
                  {pack.bonus && (
                    <div className="absolute top-12 left-0 px-5 py-1.5 bg-white text-[#020408] font-orbitron text-[9px] font-black tracking-widest uppercase -rotate-3 shadow-[0_5px_15px_rgba(0,0,0,0.5)] z-20"
                      style={{ background: (pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : "hsl(185 100% 50%)" }}
                    >
                      {pack.bonus}
                    </div>
                  )}

                  {/* Asset Rendering */}
                  <div className="relative w-40 h-40 mb-10 mt-12 flex items-center justify-center">
                    {/* Holographic Pedestal */}
                    <div className="absolute bottom-4 w-24 h-4 bg-cyan-500/20 blur-xl rounded-[50%] animate-pulse" />
                    <div className="absolute bottom-6 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                    
                    <div className="absolute inset-0 blur-[60px] rounded-full transition-all duration-1000 scale-90"
                      style={{ 
                        background: (pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : "hsl(185 100% 50%)",
                        opacity: selectedPack?.id === pack.id ? 0.5 : 0.15
                      }} 
                    />
                    <img
                      src={creditCoreImg}
                      alt="Core"
                      className={`w-28 h-28 object-contain relative z-10 transition-all duration-1000 ${selectedPack?.id === pack.id ? "scale-110 -translate-y-4" : "opacity-60 group-hover:opacity-100 group-hover:-translate-y-2"
                        }`}
                      style={{ 
                        filter: selectedPack?.id === pack.id 
                          ? `drop-shadow(0 0 30px ${(pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : "hsl(185 100% 50%)"})`
                          : `grayscale(0.6) brightness(0.8)`
                      }}
                    />
                  </div>

                  <div className="flex flex-col items-center gap-2 mb-10">
                    <h3 className="font-orbitron text-base md:text-lg tracking-[0.4em] uppercase text-white/90 group-hover:text-white transition-colors text-center font-bold">
                      {pack.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="font-orbitron text-3xl font-black text-white tracking-tighter">
                        {pack.amount.toLocaleString()}
                      </span>
                      <span className="font-orbitron text-[11px] opacity-60 tracking-[0.3em] mt-2" style={{ color: (pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : "hsl(185 100% 50%)" }}>CC</span>
                    </div>
                  </div>

                  <div className="mt-auto w-full pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                    <div className="flex items-center justify-center bg-white/[0.03] px-6 py-2 rounded-full border border-white/5">
                      <span className="font-mono text-sm opacity-30 mt-1 mr-2">$</span>
                      <span className="font-orbitron text-3xl font-black tracking-tight">{pack.price}</span>
                    </div>

                    <div className="w-full">
                      {selectedPack?.id === pack.id ? (
                        <div className="min-h-[120px] flex items-center justify-center">
                          {isSyncing ? (
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-cyan-400/60 animate-pulse">Neural_Handshake...</span>
                            </div>
                          ) : (
                            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                              {import.meta.env.VITE_PAYPAL_CLIENT_ID ? (
                                <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
                                  <PayPalButtons
                                    style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                    createOrder={handleCreateOrder}
                                    onApprove={handleApprove}
                                  />
                                </PayPalScriptProvider>
                              ) : (
                                <div className="p-6 border border-red-500/20 bg-red-500/5 rounded text-[10px] text-red-400 text-center font-mono uppercase tracking-[0.3em] leading-relaxed">
                                  Secure Gateway<br />Offline
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button 
                          className="w-full py-6 relative overflow-hidden group/btn shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                          style={{ color: (pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : "hsl(185 100% 50%)" }}
                        >
                          {/* Button Background & Brackets */}
                          <div className="absolute inset-0 bg-white/[0.04] border border-white/20 group-hover/btn:bg-white/[0.08] group-hover/btn:border-white/40 transition-all duration-500" />
                          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-60 group-hover/btn:opacity-100 transition-all" style={{ borderColor: (pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : "hsl(185 100% 50%)" }} />
                          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-60 group-hover/btn:opacity-100 transition-all" style={{ borderColor: (pack.rarity && RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG]) ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : "hsl(185 100% 50%)" }} />
                          
                          <div className="relative z-10 flex items-center justify-center gap-4">
                            <FaBolt className="text-[10px] animate-pulse" />
                            <span className="font-orbitron text-[11px] uppercase tracking-[0.6em] font-black">Initialize Link</span>
                          </div>

                          {/* Hover Scanner Line */}
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/40 -translate-y-full group-hover/btn:animate-[scan_2s_linear_infinite] shadow-[0_0_10px_#fff]" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Credit Injection Animation */}
      <AnimatePresence>
        {isInjecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] pointer-events-none flex items-center justify-center"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: (Math.random() - 0.5) * 400, 
                  y: (Math.random() - 0.5) * 400,
                  scale: 0,
                  rotate: 0,
                  opacity: 1 
                }}
                animate={{ 
                  x: 0, 
                  y: -500, // Move towards the balance HUD
                  scale: [1, 0.5, 0],
                  rotate: 360,
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: 2.5, 
                  delay: Math.random() * 0.5,
                  ease: "circIn"
                }}
                className="absolute w-4 h-4 bg-cyan-400 shadow-[0_0_20px_#00f3ff]"
                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warp Jump Overlay */}
      <AnimatePresence>
        {isWarping && <WarpJump />}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
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
