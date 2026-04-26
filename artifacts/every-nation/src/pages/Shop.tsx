import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaGem, FaArrowLeft, FaShieldAlt, FaLock, FaCheckCircle, FaBolt, FaCrown, FaDatabase, FaExchangeAlt, FaHdd } from "react-icons/fa";
import { Link } from "wouter";
import WarpJump from "@/components/WarpJump";
import TacticalSlate from "@/components/TacticalSlate";
import { useParallax } from "@/hooks/useParallax";
import PackVisual3D from "@/components/PackVisual3D";
import { SciFiButton } from "@/components/SciFiButton";

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
  const { x, y } = useParallax(25);
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
    const countUp = () => {
      const diff = credits - displayCredits;
      if (diff > 0) {
        const step = Math.max(1, Math.ceil(diff / 15));
        setDisplayCredits(prev => Math.min(prev + step, credits));
      } else if (diff < 0) {
        setDisplayCredits(credits);
      }
    };
    const interval = setInterval(countUp, 16);
    return () => clearInterval(interval);
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
      const order = await response.json();
      if (!response.ok) {
        setError(order.error || `Server Response: ${response.status}`);
        return "";
      }
      return order.id;
    } catch (err) {
      setError("Network Handshake Failed.");
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
        setError(captureData.error || "Transfer failed.");
      }
    } catch (err) {
      setError("Verification failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <AnimatePresence>
        {isWarping && <WarpJump />}
      </AnimatePresence>

      {/* Cinematic Parallax Background */}
      <motion.div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{ x, y }}
      >
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020408]/60 to-[#020408]" />
      </motion.div>

      {/* Global HUD Scanning Line Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <main className="relative z-20 w-full max-w-[1600px] px-6 py-24 md:py-32 flex flex-col items-center">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 mb-20 text-center"
        >
          <div className="flex items-center gap-4 text-cyan-500/60 font-mono text-[10px] tracking-[0.6em] uppercase">
             <div className="w-12 h-px bg-cyan-500/20" />
             <span>Financial_Core_Uplink</span>
             <div className="w-12 h-px bg-cyan-500/20" />
          </div>
          <h1 className="font-orbitron text-4xl md:text-6xl font-black tracking-tighter uppercase text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            Credit <span className="text-cyan-500">Exchange</span>
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40 max-w-md leading-relaxed">
            Acquire high-density CC assets to unlock premium operational roles and advanced tactical protocols.
          </p>
        </motion.div>

        {/* Global Balance Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl mb-24"
        >
          <TacticalSlate className="p-6" showScanner={false}>
            <div className={`flex flex-col md:flex-row items-center gap-8 px-4 ${isLoggedIn ? "justify-between" : "justify-center"}`}>
              {isLoggedIn && (
                <>
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <FaHdd className="text-cyan-400 text-xl animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">Available_Assets</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-orbitron text-3xl font-black text-white">{displayCredits.toLocaleString()}</span>
                        <span className="font-orbitron text-[10px] text-cyan-500 font-bold tracking-widest">CC</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/5 hidden md:block" />
                </>
              )}
              <SciFiButton variant="outline" onClick={handleReturn}>
                <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />
                Return_Home
              </SciFiButton>
            </div>
          </TacticalSlate>
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence>
          {(successCredits || error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-2xl mb-16 p-6 border-2 flex items-center justify-center gap-6 backdrop-blur-xl ${error ? "border-red-500/50 bg-red-500/10" : "border-cyan-500/50 bg-cyan-500/10"
                }`}
            >
              <div className={`w-3 h-3 animate-pulse rounded-full ${error ? "bg-red-500" : "bg-cyan-500"}`} />
              <p className={`font-orbitron text-[11px] tracking-[0.2em] uppercase text-center ${error ? "text-red-400" : "text-cyan-400"}`}>
                {error ? error : `Transfer Complete: +${successCredits?.toLocaleString()} Units Allocated`}
              </p>
              {error && (
                <button onClick={() => setError(null)} className="px-4 py-1 text-red-500/50 hover:text-red-400 font-mono text-[9px] uppercase tracking-widest border border-red-500/20 transition-all">
                  Dismiss
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Packs Grid */}
        {loading ? (
          <div className="flex flex-col items-center gap-6 mt-12">
            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/30 animate-pulse">Establishing_Link...</span>
          </div>
        ) : !isLoggedIn ? (
            <div className="flex items-center justify-center min-h-[400px] w-full">
               <TacticalSlate className="w-full max-w-xl p-16 text-center">
                  <FaLock className="mx-auto text-5xl text-cyan-500/30 mb-8" />
                  <h2 className="font-orbitron text-2xl tracking-[0.5em] uppercase mb-6">Connection Required</h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/30 mb-12 leading-relaxed">
                    Secure Handshake Required for Asset Exchange.
                  </p>
                  <SciFiButton onClick={() => window.location.href = "/login"} variant="ghost" size="lg" className="border border-cyan-500/40">
                     Authorize Identity
                  </SciFiButton>
               </TacticalSlate>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {packs.map((pack, idx) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                onClick={() => handlePackSelect(pack)}
                className="relative"
              >
                <TacticalSlate 
                  color={selectedPack?.id === pack.id ? (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color : "#ffffff10"}
                  className={`h-full transition-transform duration-500 ${selectedPack?.id === pack.id ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
                >
                  <div className="p-8 flex flex-col items-center h-full min-h-[500px]">
                    {/* Rarity & Header */}
                    <div className="w-full flex justify-between items-start mb-10">
                      <div className="flex flex-col">
                        <span className="font-mono text-[7px] text-white/20 uppercase tracking-[0.4em]">Protocol_ID</span>
                        <span className="font-orbitron text-[9px] uppercase font-black tracking-widest" style={{ color: (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color }}>
                          {(RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).label}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                        {pack.rarity === "legendary" ? <FaCrown className="text-red-500" /> :
                          pack.rarity === "epic" ? <FaBolt className="text-yellow-400" /> :
                          pack.rarity === "rare" ? <FaGem className="text-purple-400" /> :
                          <FaDatabase className="text-cyan-400/40" />}
                      </div>
                    </div>

                    {/* Pack Visual (Real 3D) */}
                    <div className="relative w-32 h-32 mb-8 mt-4 flex items-center justify-center">
                       <div className="absolute inset-0 blur-[40px] opacity-20 scale-125 transition-all duration-1000"
                            style={{ backgroundColor: (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color, opacity: selectedPack?.id === pack.id ? 0.4 : 0.1 }} />
                       
                       <PackVisual3D 
                          rarity={pack.rarity} 
                          color={(RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color}
                          isSelected={selectedPack?.id === pack.id}
                       />

                       {/* Holographic Base */}
                       <div className="absolute -bottom-2 w-20 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                    </div>

                    {/* Value Data */}
                    <div className="text-center mb-10 flex-1">
                      <h3 className="font-orbitron text-sm tracking-[0.4em] uppercase text-white/60 mb-2">{pack.name}</h3>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="font-orbitron text-4xl font-black text-white">{pack.amount.toLocaleString()}</span>
                        <span className="font-orbitron text-[10px] text-cyan-500 font-bold">CC</span>
                      </div>
                      {pack.bonus && (
                        <div className="mt-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full inline-block">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-cyan-400">{pack.bonus}</span>
                        </div>
                      )}
                    </div>

                    {/* Purchase Interface */}
                    <div className="w-full mt-auto">
                      {selectedPack?.id === pack.id ? (
                        <div className="min-h-[140px] flex items-center justify-center">
                          {isSyncing ? (
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-5 h-5 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                              <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-cyan-400/60 animate-pulse">Neural_Sync...</span>
                            </div>
                          ) : (
                            <div className="w-full animate-in fade-in slide-in-from-bottom-4">
                               <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb" }}>
                                  <PayPalButtons
                                    style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 45 }}
                                    createOrder={handleCreateOrder}
                                    onApprove={handleApprove}
                                  />
                                </PayPalScriptProvider>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button className="w-full py-4 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center justify-center gap-3">
                          <span className="font-mono text-xs opacity-30">$</span>
                          <span className="font-orbitron text-2xl font-black">{pack.price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </TacticalSlate>
              </motion.div>
            ))}
          </div>
        )}
      </main>

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
                  y: -500, 
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
    </div>
  );
}
