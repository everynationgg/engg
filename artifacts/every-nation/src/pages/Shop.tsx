import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaGem, FaShieldAlt, FaLock, FaBolt, FaCrown, FaDatabase } from "react-icons/fa";
import { useLocation } from "wouter";
import TacticalSlate from "@/components/common/TacticalSlate";
import { useParallax } from "@/hooks/useParallax";
import PackVisual3D from "@/features/shop/components/PackVisual3D";
import { SciFiButton } from "@/components/common/SciFiButton";
import { HUDOverlay } from "@/components/common/HUDOverlay";

interface Pack {
  id: string;
  name: string;
  amount: number;
  price: string;
  currency: string;
  bonus?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  hasBonus?: boolean;
}

const FALLBACK_PACKS: Pack[] = [
  { id: "pack_250", name: "Standard Core", amount: 250, price: "4.99", currency: "USD", rarity: "common" },
  { id: "pack_500", name: "Tactical Core", amount: 500, price: "8.99", currency: "USD", bonus: "+50 Bonus", rarity: "rare" },
  { id: "pack_1000", name: "Elite Core", amount: 1000, price: "15.99", currency: "USD", bonus: "+150 Bonus", rarity: "epic" },
  { id: "pack_2500", name: "Sovereign Core", amount: 2500, price: "34.99", currency: "USD", bonus: "+500 Bonus", rarity: "legendary" },
];

const RARITY_CONFIG = {
  common: { color: "hsl(185 100% 50%)", label: "Standard" },
  rare: { color: "hsl(270 80% 60%)", label: "Tactical" },
  epic: { color: "hsl(45 90% 55%)", label: "Elite" },
  legendary: { color: "hsl(0 100% 60%)", label: "Sovereign" }
};

export default function Shop() {
  const { x, y } = useParallax(15);
  const { isLoggedIn, token, refreshUser, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successCredits, setSuccessCredits] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const [packs, setPacks] = useState<Pack[]>(FALLBACK_PACKS);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = new URL(`${import.meta.env.VITE_API_URL}/api/shop/config`);
    if (user?.id) url.searchParams.append("userId", user.id);

    fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
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
  }, [token, user?.id]);

  const handlePackSelect = (pack: Pack) => {
    if (selectedPack?.id === pack.id) return;
    setSelectedPack(pack);
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleCreateOrder = async () => {
    if (!selectedPack) return "";
    if (!isLoggedIn) {
      setError("Auth_Required: Session_Closed");
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
        setError(order.error || `Protocol_Error: ${response.status}`);
        return "";
      }
      return order.id;
    } catch (err) {
      setError("Handshake_Timeout");
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
          setCheckoutMode(false);
        }, 6000);
      } else {
        setError(captureData.error || "Transfer_Abort");
      }
    } catch (err) {
      setError("Verification_Fail");
    }
  };

  return (
    <HUDOverlay pageLabel="ASSET_MARKET">
      <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
        
        {/* Cinematic Background Layer */}
        <motion.div 
          className="fixed inset-0 z-0 opacity-20 pointer-events-none grayscale"
          style={{ x, y }}
        >
          <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020408]/80 to-[#020408]" />
        </motion.div>

        <main className="relative z-20 w-full max-w-[1400px] px-6 pt-40 pb-40 flex flex-col items-center">

          {/* Header Section */}
          <header className="w-full flex flex-col gap-3 mb-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[1px] bg-cyan-500/40" />
              <span className="font-mono text-[9px] uppercase tracking-[0.6em] text-cyan-400/60">Asset_Uplink</span>
            </div>
            <h1 className="font-orbitron font-black text-2xl md:text-3xl tracking-[0.4em] uppercase text-white">
              Credit <span className="text-cyan-400">Market</span>
            </h1>
            <div className="flex items-center gap-6 mt-2 opacity-20">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-[9px]" />
                <span className="font-mono text-[8px] uppercase tracking-widest">Auth: Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <FaLock className="text-[9px]" />
                <span className="font-mono text-[8px] uppercase tracking-widest">Region: Alpha_01</span>
              </div>
            </div>
          </header>

          {/* Status Messages */}
          <AnimatePresence>
            {(successCredits || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`w-full max-w-2xl mb-12 p-4 border flex items-center justify-center gap-6 ${
                  error ? "border-red-500/20 bg-red-500/5" : "border-cyan-500/20 bg-cyan-500/5"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${error ? "bg-red-500" : "bg-cyan-500 animate-pulse"}`} />
                <p className={`font-orbitron text-[10px] tracking-[0.2em] uppercase text-center ${error ? "text-red-400" : "text-cyan-400"}`}>
                  {error ? error : `Transfer_Complete: +${successCredits?.toLocaleString()} Units`}
                </p>
                {error && (
                  <button onClick={() => setError(null)} className="px-3 py-0.5 text-red-500/40 hover:text-red-400 font-mono text-[8px] uppercase tracking-widest border border-red-500/10 transition-all">
                    Dismiss
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Packs Grid */}
          {loading ? (
            <div className="flex flex-col items-center gap-4 mt-20">
              <div className="w-6 h-6 border-2 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin" />
              <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing_Nodes...</span>
            </div>
          ) : !isLoggedIn ? (
            <div className="flex items-center justify-center min-h-[300px] w-full">
               <TacticalSlate className="w-full max-w-lg">
                  <div className="p-12 flex flex-col items-center text-center">
                    <FaLock className="text-3xl text-cyan-500/20 mb-6" />
                    <h2 className="font-orbitron text-lg tracking-[0.4em] uppercase mb-4 text-white">Identity_Required</h2>
                    <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 mb-10 leading-relaxed">
                      Secure connection required for asset acquisition.
                    </p>
                    <SciFiButton onClick={() => setLocation("/login")} variant="ghost" className="border border-cyan-500/20 px-8">
                       Authorize_Now
                    </SciFiButton>
                  </div>
               </TacticalSlate>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {packs.map((pack, idx) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
                  onClick={() => handlePackSelect(pack)}
                  className="relative group cursor-pointer"
                >
                  <TacticalSlate 
                    color={selectedPack?.id === pack.id ? (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color : "#ffffff05"}
                    className={`h-full transition-all duration-300 ${selectedPack?.id === pack.id ? "scale-[1.02]" : "hover:translate-y-[-4px]"}`}
                  >
                    <div className="p-6 flex flex-col items-center h-full relative z-10">
                      <div className="w-full flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-[7px] text-white/10 uppercase tracking-[0.4em]">Class_ID</span>
                          <span className="font-orbitron text-[10px] uppercase font-black tracking-widest" style={{ color: (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color }}>
                            {(RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).label}
                          </span>
                        </div>
                        <div className="w-6 h-6 border border-white/5 flex items-center justify-center">
                          {pack.rarity === "legendary" ? <FaCrown className="text-red-500 text-xs" /> :
                            pack.rarity === "epic" ? <FaBolt className="text-yellow-400 text-xs" /> :
                            pack.rarity === "rare" ? <FaGem className="text-purple-400 text-xs" /> :
                            <FaDatabase className="text-cyan-400/20 text-xs" />}
                        </div>
                      </div>

                      <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                         <div className="absolute inset-0 blur-[20px] opacity-10 transition-all duration-500"
                              style={{ backgroundColor: (RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color, opacity: selectedPack?.id === pack.id ? 0.3 : 0.05 }} />
                         
                         <PackVisual3D 
                            rarity={pack.rarity} 
                            color={(RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common).color}
                            isSelected={selectedPack?.id === pack.id}
                         />
                      </div>

                      <div className="text-center mb-6 flex-1">
                        <h3 className="font-orbitron text-[11px] tracking-[0.3em] uppercase text-white/40 mb-1">{pack.name}</h3>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="font-orbitron text-2xl font-black text-white">
                            {pack.hasBonus ? (pack.amount * 2).toLocaleString() : pack.amount.toLocaleString()}
                          </span>
                          <span className="font-orbitron text-[9px] text-cyan-500 font-bold">CC</span>
                        </div>
                      </div>

                      <div className="w-full mt-auto">
                        <button 
                          className={`w-full py-2.5 font-orbitron text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                            selectedPack?.id === pack.id 
                              ? "bg-cyan-400 text-[#010204] border-cyan-400" 
                              : "bg-white/[0.02] text-white/40 border-white/10 group-hover:border-white/20"
                          }`}
                          onClick={(e) => { e.stopPropagation(); if (selectedPack?.id === pack.id) setCheckoutMode(true); else setSelectedPack(pack); }}
                        >
                          {selectedPack?.id === pack.id ? `Deploy_${pack.price}` : `$${pack.price}`}
                        </button>
                      </div>
                    </div>
                  </TacticalSlate>
                </motion.div>
              ))}
            </div>
          )}
        </main>

        {/* Checkout Modal */}
        <AnimatePresence>
          {checkoutMode && selectedPack && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020408]/95 p-4"
              onClick={() => setCheckoutMode(false)}
            >
              <motion.div
                 initial={{ scale: 0.95, y: 10 }}
                 animate={{ scale: 1, y: 0 }}
                 exit={{ scale: 0.95, y: 10 }}
                 onClick={(e) => e.stopPropagation()}
                 className="w-full max-w-sm"
              >
                <TacticalSlate className="p-8">
                  <div className="flex flex-col gap-1 mb-8">
                    <h3 className="font-orbitron text-lg uppercase font-black text-white tracking-widest">Secure_Uplink</h3>
                    <p className="font-mono text-[8px] text-white/20 tracking-[0.4em] uppercase">Pack: {selectedPack.name}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                     <div className="flex flex-col">
                       <span className="font-mono text-[7px] uppercase tracking-widest text-white/20">Charge</span>
                       <span className="font-orbitron text-xl font-black">${selectedPack.price}</span>
                     </div>
                     <div className="flex flex-col text-right">
                       <span className="font-mono text-[7px] uppercase tracking-widest text-white/20">Yield</span>
                       <span className="font-orbitron text-lg font-bold text-cyan-400">
                         +{selectedPack.hasBonus ? selectedPack.amount * 2 : selectedPack.amount} CC
                       </span>
                     </div>
                  </div>
                  
                  {isSyncing ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="w-5 h-5 border border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                      <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-cyan-400/40 animate-pulse">Neural_Sync...</span>
                    </div>
                  ) : (
                    <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb" }}>
                       <PayPalButtons
                         style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 40 }}
                         createOrder={handleCreateOrder}
                         onApprove={handleApprove}
                       />
                    </PayPalScriptProvider>
                  )}
                </TacticalSlate>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Injection Animation */}
        <AnimatePresence>
          {isInjecting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1100] pointer-events-none flex items-center justify-center"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 300, scale: 0, opacity: 1 }}
                  animate={{ x: 0, y: -400, scale: [1, 0], opacity: [1, 0] }}
                  transition={{ duration: 2, delay: Math.random() * 0.3, ease: "circIn" }}
                  className="absolute w-2 h-2 bg-cyan-400"
                  style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HUDOverlay>
  );
}
