import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaGem, FaArrowLeft, FaBolt, FaCrown, FaDatabase, FaHdd } from "react-icons/fa";
import { Link } from "wouter";
import WarpJump from "@/components/WarpJump";
import AntiGravity3D from "@/components/AntiGravity3D";

interface Pack {
  id: string;
  name: string;
  amount: number;
  price: string;
  currency: string;
  bonus?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

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
  const { isLoggedIn, credits, token, refreshUser } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successCredits, setSuccessCredits] = useState<number | null>(null);
  const [isInjecting, setIsInjecting] = useState(false);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWarping, setIsWarping] = useState(false);

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
      setError("Authentication Required to connect.");
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
    <div className="min-h-screen bg-[#050510] text-white relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <AnimatePresence>
        {isWarping && <WarpJump />}
      </AnimatePresence>

      <AntiGravity3D />
      <div className="fixed inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050510]/80 to-[#050510]" />

      <main className="relative z-20 w-full max-w-[1600px] px-6 py-24 md:py-32 flex flex-col items-center">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 mb-20 text-center"
        >
          <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
             <span className="font-orbitron text-[10px] uppercase tracking-[0.3em] text-cyan-400">Financial Core Uplink</span>
          </div>
          <h1 className="font-inter text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
            Credit <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Exchange</span>
          </h1>
          <p className="font-inter text-sm md:text-base text-white/50 max-w-lg leading-relaxed">
            Acquire high-density CC assets to unlock premium operational roles and advanced tactical protocols.
          </p>
        </motion.div>

        {/* Global Balance Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl mb-24"
        >
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-4">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                  <FaHdd className="text-cyan-400 text-2xl animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="font-inter font-medium text-xs uppercase tracking-widest text-white/40">Available Assets</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-inter text-4xl font-black text-white">{displayCredits.toLocaleString()}</span>
                    <span className="font-orbitron text-xs text-cyan-400 font-bold tracking-widest">CC</span>
                  </div>
                </div>
              </div>
              <div className="h-12 w-px bg-white/10 hidden md:block" />
              <button 
                onClick={handleReturn}
                className="flex items-center gap-3 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
              >
                <FaArrowLeft className="text-xs text-white/60" />
                <span className="font-inter text-sm font-medium tracking-wide">Return Home</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence>
          {(successCredits || error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-2xl mb-16 p-6 rounded-2xl border flex items-center justify-center gap-4 backdrop-blur-xl shadow-2xl ${error ? "border-red-500/30 bg-red-500/10" : "border-cyan-500/30 bg-cyan-500/10"
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${error ? "bg-red-400 shadow-[0_0_10px_red]" : "bg-cyan-400 shadow-[0_0_10px_cyan]"}`} />
              <p className={`font-inter text-sm font-medium tracking-wide ${error ? "text-red-300" : "text-cyan-300"}`}>
                {error ? error : `Transfer Complete: +${successCredits?.toLocaleString()} Units Allocated`}
              </p>
              {error && (
                <button onClick={() => setError(null)} className="ml-auto px-4 py-2 rounded-lg text-red-300 hover:text-white bg-red-500/20 hover:bg-red-500/40 transition-colors text-xs font-medium">
                  Dismiss
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Packs Grid */}
        {loading ? (
          <div className="flex flex-col items-center gap-6 mt-12">
            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <span className="font-inter text-sm text-cyan-400/60 animate-pulse font-medium">Establishing Link...</span>
          </div>
        ) : !isLoggedIn ? (
            <div className="flex items-center justify-center min-h-[300px] w-full">
               <div className="w-full max-w-xl p-16 text-center bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,243,255,0.1)]">
                     <FaHdd className="text-3xl text-cyan-400/60" />
                  </div>
                  <h2 className="font-inter font-bold text-2xl tracking-tight mb-4">Connection Required</h2>
                  <p className="font-inter text-sm text-white/50 mb-10 leading-relaxed">
                    A secure handshake is required to process asset exchanges. Please authenticate your identity.
                  </p>
                  <Link href="/login" className="px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 transition-all font-inter font-semibold tracking-wide shadow-[0_10px_20px_rgba(0,243,255,0.2)]">
                    Authorize Identity
                  </Link>
               </div>
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
                <div 
                  className={`h-full transition-all duration-500 rounded-3xl backdrop-blur-xl border flex flex-col p-8 min-h-[500px] cursor-pointer 
                    ${selectedPack?.id === pack.id ? "bg-white/10 scale-[1.02] shadow-[0_30px_60px_rgba(0,0,0,0.5)]" : "bg-white/5 hover:bg-white/[0.07] hover:scale-[1.01] shadow-[0_20px_40px_rgba(0,0,0,0.3)]"}
                  `}
                  style={{
                    borderColor: selectedPack?.id === pack.id ? (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color : "rgba(255,255,255,0.1)"
                  }}
                >
                    {/* Rarity & Header */}
                    <div className="w-full flex justify-between items-start mb-10">
                      <div className="flex flex-col">
                        <span className="font-inter text-[10px] font-medium text-white/30 uppercase tracking-widest">Protocol ID</span>
                        <span className="font-orbitron text-xs uppercase font-bold tracking-widest mt-1" style={{ color: (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color }}>
                          {(RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).label}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                        {pack.rarity === "legendary" ? <FaCrown className="text-red-400" /> :
                          pack.rarity === "epic" ? <FaBolt className="text-yellow-400" /> :
                          pack.rarity === "rare" ? <FaGem className="text-purple-400" /> :
                          <FaDatabase className="text-cyan-400" />}
                      </div>
                    </div>

                    {/* Pack Visual */}
                    <div className="relative w-32 h-32 mx-auto mb-10 flex items-center justify-center">
                       <div className="absolute inset-0 blur-[50px] opacity-20 scale-150 transition-all duration-1000"
                            style={{ backgroundColor: (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color, opacity: selectedPack?.id === pack.id ? 0.3 : 0.1 }} />
                       <img 
                         src={creditCoreImg} 
                         alt="Core"
                         className={`w-28 h-28 object-contain relative z-10 transition-all duration-700 ${selectedPack?.id === pack.id ? "scale-110 -translate-y-2" : "opacity-80 group-hover:opacity-100"}`}
                         style={{ 
                            filter: selectedPack?.id === pack.id 
                              ? `drop-shadow(0 10px 20px ${(RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color})`
                              : `grayscale(0.3) brightness(0.9)`
                         }}
                       />
                    </div>

                    {/* Value Data */}
                    <div className="text-center mb-10 flex-1">
                      <h3 className="font-inter font-semibold text-lg text-white/80 mb-4">{pack.name}</h3>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="font-inter text-5xl font-black tracking-tight text-white">{pack.amount.toLocaleString()}</span>
                        <span className="font-orbitron text-xs text-cyan-400 font-bold">CC</span>
                      </div>
                      {pack.bonus && (
                        <div className="mt-4 px-4 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 rounded-full inline-block shadow-[0_0_15px_rgba(0,243,255,0.1)]">
                          <span className="font-inter text-xs font-semibold tracking-wide text-cyan-300">{pack.bonus}</span>
                        </div>
                      )}
                    </div>

                    {/* Purchase Interface */}
                    <div className="w-full mt-auto">
                      {selectedPack?.id === pack.id ? (
                        <div className="min-h-[140px] flex items-center justify-center bg-black/20 rounded-2xl p-4 border border-white/5">
                          {isSyncing ? (
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                              <span className="font-inter text-xs tracking-wide text-cyan-400/60 font-medium">Synchronizing...</span>
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
                        <button className="w-full py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 shadow-sm">
                          <span className="font-inter text-sm opacity-50 font-medium">$</span>
                          <span className="font-inter text-xl font-bold">{pack.price}</span>
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
            className="fixed inset-0 z-[1100] pointer-events-none flex items-center justify-center bg-cyan-900/10 backdrop-blur-[2px]"
          >
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: (Math.random() - 0.5) * 600, 
                  y: (Math.random() - 0.5) * 600,
                  scale: 0,
                  rotate: 0,
                  opacity: 1 
                }}
                animate={{ 
                  x: 0, 
                  y: -800, 
                  scale: [1, 0.8, 0],
                  rotate: 720,
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: 2.5 + Math.random(), 
                  delay: Math.random() * 0.5,
                  ease: "circIn"
                }}
                className="absolute w-5 h-5 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full shadow-[0_0_30px_#00f3ff]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
