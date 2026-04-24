import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaGem, FaArrowLeft, FaShieldAlt, FaLock, FaCheckCircle, FaBolt, FaCrown, FaDatabase } from "react-icons/fa";
import { Link } from "wouter";

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
    <div className="shop-root min-h-screen bg-[#020408] text-white relative overflow-y-auto selection:bg-cyan-500/30 font-inter">
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

      <div className="relative z-10 w-full px-6 md:px-16 py-12 md:pt-40 pb-24 min-h-screen flex flex-col">

        {/* Header HUD */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-12 border-b border-white/5 pb-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-cyan-500 shadow-[0_0_15px_#00f3ff]" />
                <span className="font-mono text-[9px] tracking-[0.5em] uppercase text-cyan-500/60">Operational_Hub</span>
              </div>
              <h1 className="font-orbitron font-black text-3xl md:text-4xl tracking-[0.2em] uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                Credit <span className="text-cyan-400">Exchange</span>
              </h1>
            </div>
            <div className="flex items-center gap-4 ml-4 opacity-30">
              <span className="font-mono text-[8px] tracking-[0.3em] uppercase">Auth_Session: Stable</span>
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[8px] tracking-[0.3em] uppercase">Node: US-WEST-2</span>
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
              onClick={handleReturn}
              className="group flex items-center gap-3 px-6 py-3 border border-white/10 bg-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all backdrop-blur-md"
            >
              <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />
              <span className="font-orbitron text-[10px] uppercase tracking-[0.4em]">Return to Base</span>
            </button>
          </motion.div>
        </header>

        {/* Status Messages */}
        <AnimatePresence>
          {(successCredits || error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mb-12 p-6 border-2 flex items-center justify-center gap-4 backdrop-blur-xl ${error ? "border-red-500/50 bg-red-500/10" : "border-cyan-500/50 bg-cyan-500/10"
                }`}
            >
              {error ? (
                <div className="w-2 h-2 bg-red-500 animate-pulse" />
              ) : (
                <FaCheckCircle className="text-cyan-400 text-2xl animate-pulse" />
              )}
              <p className={`font-orbitron text-sm tracking-[0.2em] uppercase ${error ? "text-red-400" : "text-cyan-400"}`}>
                {error ? error : `Authorized Transfer Complete: +${successCredits} Units Allocated`}
              </p>
              {error && (
                <button onClick={() => setError(null)} className="ml-4 text-red-500/50 hover:text-red-400 font-mono text-[8px] uppercase tracking-widest border border-red-500/20 px-2 py-1">
                  Dismiss
                </button>
              )}
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
              className="w-full max-w-lg p-12 bg-[#0a0f16]/60 border border-white/10 backdrop-blur-2xl relative text-center"
            >
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/20" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/20" />

              <FaLock className="mx-auto text-5xl text-cyan-500/40 mb-6" />
              <h2 className="font-orbitron text-2xl tracking-[0.4em] uppercase mb-4">Connection Required</h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 mb-10 leading-relaxed">
                Anonymous Browsing Restricted.<br />Initialize Secure Identity Handshake to Proceed.
              </p>

              <Link
                href="/login"
                className="inline-block px-12 py-5 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all font-orbitron text-xs uppercase tracking-[0.5em] text-cyan-400 relative overflow-hidden group"
              >
                <span className="relative z-10">Access Portal</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {packs.map((pack, idx) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handlePackSelect(pack)}
                  className={`relative group p-8 border transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center backdrop-blur-md ${selectedPack?.id === pack.id
                    ? "bg-cyan-500/10 shadow-[0_0_40px_rgba(6,182,212,0.1)] scale-[1.05] z-20"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  style={{ 
                    borderColor: selectedPack?.id === pack.id ? RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color : undefined 
                  }}
                >
                  {/* Rarity Indicator */}
                  <div className="absolute top-4 left-4 font-mono text-[8px] opacity-20 tracking-tighter uppercase">
                    Tier_{pack.rarity}
                  </div>
                  <div className="absolute top-4 right-4">
                    {pack.rarity === "legendary" ? <FaCrown className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> :
                      pack.rarity === "epic" ? <FaBolt className="text-yellow-400" /> :
                        pack.rarity === "rare" ? <FaGem className="text-purple-400" /> :
                          <FaDatabase className="text-cyan-400/50" />}
                  </div>

                  {/* Bonus Badge */}
                  {pack.bonus && (
                    <div className="absolute top-10 left-0 px-3 py-1 bg-white text-[#020408] font-orbitron text-[8px] font-black tracking-widest uppercase -rotate-2 shadow-lg"
                      style={{ background: RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color }}
                    >
                      {pack.bonus}
                    </div>
                  )}

                  {/* Asset Rendering */}
                  <div className="relative w-40 h-40 mb-8 mt-4 flex items-center justify-center">
                    <div className="absolute inset-0 blur-[45px] rounded-full opacity-40 transition-opacity duration-1000"
                      style={{ 
                        background: RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color,
                        opacity: selectedPack?.id === pack.id ? 0.6 : 0.2
                      }} 
                    />
                    <img
                      src={creditCoreImg}
                      alt="Core"
                      className={`w-full h-full object-contain relative z-10 transition-all duration-700 ${selectedPack?.id === pack.id ? "scale-115" : "opacity-70 group-hover:opacity-100 group-hover:scale-105"
                        }`}
                      style={{ 
                        filter: selectedPack?.id === pack.id 
                          ? `drop-shadow(0 0 20px ${RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color})`
                          : `grayscale(0.4) brightness(0.8)`
                      }}
                    />
                  </div>

                  <h3 className="font-orbitron text-sm tracking-[0.3em] uppercase mb-1 text-white/90 group-hover:text-white transition-colors text-center">
                    {pack.name}
                  </h3>
                  <p className="font-mono text-[18px] font-bold text-white tracking-[0.1em] mb-8">
                    {pack.amount} <span className="text-[10px] opacity-50 tracking-widest" style={{ color: RARITY_CONFIG[pack.rarity as keyof typeof RARITY_CONFIG].color }}>CC</span>
                  </p>

                  <div className="mt-auto w-full pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center">
                      <span className="font-mono text-xs opacity-30 mt-1 mr-1">$</span>
                      <span className="font-orbitron text-2xl font-bold">{pack.price}</span>
                    </div>

                    <div className="w-full">
                      {selectedPack?.id === pack.id ? (
                        <div className="min-h-[50px] flex items-center justify-center">
                          {isSyncing ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-4 h-4 border border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-500/60">Securing_Handshake...</span>
                            </div>
                          ) : (
                            <div className="w-full animate-in fade-in zoom-in duration-300">
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
                                  Gateway Offline
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button className="w-full py-3 bg-white/5 border border-white/10 font-orbitron text-[9px] uppercase tracking-[0.4em] group-hover:border-white/40 group-hover:text-white transition-all">
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
        {isWarping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black flex items-center justify-center overflow-hidden pointer-events-none"
          >
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scaleX: 0, opacity: 0 }}
                animate={{ 
                  scaleX: [0, 80], 
                  opacity: [0, 1, 0],
                  x: (Math.random() - 0.5) * 3000,
                  y: (Math.random() - 0.5) * 3000
                }}
                transition={{ duration: 0.8, ease: "circIn", delay: Math.random() * 0.1 }}
                className="absolute h-0.5 bg-white rounded-full shadow-[0_0_10px_white]"
                style={{ width: '60px' }}
              />
            ))}
          </motion.div>
        )}
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
