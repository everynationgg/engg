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
          // DYNAMIC HERO LOGIC:
          // If first purchase, highlight Elite Core ($15.99).
          // If returning, highlight Sovereign Core ($34.99) for better value.
          const defaultPackId = data.isFirstPurchase ? "pack_1000" : "pack_2500";
          const defaultPack = data.packs.find((p: Pack) => p.id === defaultPackId) || data.packs[1];
          setSelectedPack(defaultPack);
        } else {
          setPacks(FALLBACK_PACKS);
          setSelectedPack(FALLBACK_PACKS[1]);
        }
      })
      .catch(() => {
        setPacks(FALLBACK_PACKS);
        setSelectedPack(FALLBACK_PACKS[1]);
      })
      .finally(() => setLoading(false));
  }, [token, user?.id]);

  const handlePackSelect = (pack: Pack) => {
    if (selectedPack?.id === pack.id) return;
    setSelectedPack(pack);
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

          {/* Packs Deck */}
          {loading ? (
            <div className="flex flex-col items-center gap-4 mt-20">
              <div className="w-6 h-6 border-2 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin" />
              <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing_Nodes...</span>
            </div>
          ) : !isLoggedIn ? (
            <div className="flex items-center justify-center min-h-[400px] w-full">
               <TacticalSlate className="w-full max-w-md">
                  <div className="p-10 flex flex-col items-center text-center">
                    <FaLock className="text-2xl text-cyan-500/10 mb-6" />
                    <h2 className="font-orbitron text-[12px] font-black tracking-[0.4em] uppercase mb-3 text-white">Identity_Required</h2>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20 mb-8 leading-relaxed max-w-[240px]">
                      Secure connection required for asset acquisition.
                    </p>
                    <SciFiButton onClick={() => setLocation("/login")} variant="outline" size="sm" className="px-10">
                       Authorize_Now
                    </SciFiButton>
                  </div>
               </TacticalSlate>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
              {/* LEFT: Selection Deck (35%) */}
              <div className="w-full lg:w-[35%] flex flex-col gap-3">
                <div className="flex items-center gap-3 mb-2 px-2">
                   <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20">Select_Node</span>
                   <div className="flex-1 h-[1px] bg-white/5" />
                </div>
                {packs.map((pack) => {
                  const isSelected = selectedPack?.id === pack.id;
                  const config = RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common;
                  return (
                    <motion.div
                      key={pack.id}
                      onClick={() => handlePackSelect(pack)}
                      className={`relative cursor-pointer transition-all duration-200 border border-white/5 ${
                        isSelected ? "bg-cyan-500/10 border-cyan-500/40" : "bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-1 h-10 ${isSelected ? "bg-cyan-400" : "bg-white/5"}`} />
                          <div className="flex flex-col">
                            <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">
                              {pack.name}
                            </span>
                            <div className="flex items-center gap-2">
                               <span className="font-mono text-[8px] font-bold text-cyan-400">
                                 {pack.hasBonus ? pack.amount * 2 : pack.amount} CC
                               </span>
                               <span className="font-mono text-[6px] uppercase tracking-widest opacity-20">| {config.label}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-orbitron text-[11px] font-black text-white/80">${pack.price}</span>
                        </div>
                      </div>
                      {pack.hasBonus && !isSelected && (
                         <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-500/20">
                            <span className="font-orbitron text-[6px] font-bold text-cyan-400">2X_BONUS</span>
                         </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* RIGHT: Tactical Detail Panel (65%) */}
              <div className="w-full lg:w-[65%] sticky top-32">
                <AnimatePresence mode="wait">
                  {selectedPack && (
                    <motion.div
                      key={checkoutMode ? 'checkout' : selectedPack.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TacticalSlate color={RARITY_CONFIG[selectedPack.rarity]?.color || "#00f3ff"} className="min-h-[520px]">
                        {checkoutMode ? (
                          /* CHECKOUT MODE */
                          <div className="p-8 md:p-12 flex flex-col h-full">
                            <div className="flex flex-col gap-1 mb-10">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse" />
                                  <h3 className="font-orbitron text-[12px] uppercase font-black text-white tracking-[0.4em]">Secure_Checkout_Terminal</h3>
                               </div>
                               <span className="font-mono text-[7px] text-cyan-400/40 tracking-[0.4em] uppercase">Protocol: ASSET_TRANSFER_FINALIZATION</span>
                            </div>
                            
                            <div className="flex flex-col gap-6 mb-12 pb-8 border-b border-white/5">
                               <div className="flex justify-between items-center">
                                 <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">Charge_Amount</span>
                                 <span className="font-orbitron text-lg font-black text-white">${selectedPack.price}</span>
                               </div>
                               <div className="flex justify-between items-center">
                                 <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">Yield_Expectation</span>
                                 <div className="flex flex-col items-end">
                                   <span className="font-orbitron text-lg font-bold text-cyan-400">
                                     +{selectedPack.hasBonus ? selectedPack.amount * 2 : selectedPack.amount} CC
                                   </span>
                                   {selectedPack.hasBonus && <span className="font-mono text-[6px] text-cyan-400/40 uppercase tracking-widest mt-0.5">X2_Sync_Applied</span>}
                                 </div>
                               </div>
                            </div>

                            <div className="max-w-sm mx-auto w-full">
                              {isSyncing ? (
                                <div className="flex flex-col items-center gap-3 py-10">
                                  <div className="w-4 h-4 border border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                  <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-cyan-400/40 animate-pulse">Neural_Sync...</span>
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
                            </div>

                            <button 
                              onClick={() => setCheckoutMode(false)}
                              className="mt-auto pt-8 flex justify-center"
                            >
                               <span className="font-mono text-[7px] uppercase tracking-[0.6em] text-white/10 hover:text-white/40 transition-colors">Abort_Transfer</span>
                            </button>
                          </div>
                        ) : (
                          /* DETAIL MODE */
                          <div className="p-8 md:p-12 flex flex-col md:flex-row gap-10">
                            {/* Visual Column */}
                            <div className="flex-1 flex flex-col items-center justify-center relative">
                              <div className="absolute inset-0 blur-[60px] opacity-[0.03] pointer-events-none" 
                                   style={{ backgroundColor: RARITY_CONFIG[selectedPack.rarity]?.color || "#00f3ff" }} />
                              <div className="w-40 h-40 opacity-80">
                                <PackVisual3D 
                                  rarity={selectedPack.rarity} 
                                  color={RARITY_CONFIG[selectedPack.rarity]?.color || "#00f3ff"}
                                  isSelected={true}
                                />
                              </div>
                              <div className="mt-8 flex flex-col items-center gap-2">
                                 <div className="px-3 py-1 bg-white/5 border border-white/10">
                                    <span className="font-orbitron text-[8px] uppercase tracking-[0.3em] text-white/40">
                                       Rarity: {selectedPack.rarity.toUpperCase()}
                                    </span>
                                 </div>
                              </div>
                            </div>

                            {/* Data Column */}
                            <div className="flex-1 flex flex-col">
                              <div className="flex flex-col gap-1 mb-8">
                                 <div className="flex items-center gap-3">
                                   <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-cyan-400/40">Path: ROOT &gt; SHOP &gt; DETAIL</span>
                                   {/* HERO Recommendation Hint */}
                                   {(selectedPack.id === "pack_1000" || selectedPack.id === "pack_2500") && (
                                     <span className="font-mono text-[6px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 uppercase tracking-widest border border-cyan-500/20">
                                        {selectedPack.id === "pack_1000" ? "Optimize: NEW_IDENTITY" : "Optimize: MAX_VALUE"}
                                     </span>
                                   )}
                                 </div>
                                 <h2 className="font-orbitron text-2xl font-black uppercase text-white tracking-widest">{selectedPack.name}</h2>
                              </div>

                              <div className="flex flex-col gap-4 mb-10 pb-6 border-b border-white/5">
                                 <div className="flex justify-between items-center">
                                   <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">Base_Yield</span>
                                   <span className="font-orbitron text-sm font-bold text-white">{selectedPack.amount.toLocaleString()} CC</span>
                                 </div>
                                 
                                 {selectedPack.hasBonus && (
                                   <div className="flex justify-between items-center text-cyan-400">
                                     <span className="font-mono text-[8px] uppercase tracking-widest opacity-60">Bonus_Protocol</span>
                                     <span className="font-orbitron text-sm font-bold">+{selectedPack.amount.toLocaleString()} CC</span>
                                   </div>
                                 )}

                                 <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                   <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">Total_Transferred</span>
                                   <div className="flex items-baseline gap-1">
                                     <span className="font-orbitron text-2xl font-black text-white">
                                       {selectedPack.hasBonus ? (selectedPack.amount * 2).toLocaleString() : selectedPack.amount.toLocaleString()}
                                     </span>
                                     <span className="font-orbitron text-[9px] text-cyan-500 font-bold">CC</span>
                                   </div>
                                 </div>
                              </div>

                              <div className="mt-auto">
                                 <SciFiButton 
                                   variant="primary" 
                                   className="w-full py-6"
                                   onClick={() => setCheckoutMode(true)}
                                 >
                                    <span className="text-[12px]">Deploy ${selectedPack.price}</span>
                                 </SciFiButton>
                                 <div className="flex justify-center mt-4">
                                    <span className="font-mono text-[6px] uppercase tracking-[0.4em] text-white/10">Authorized_Transaction_Ready</span>
                                 </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </TacticalSlate>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>

        {/* Injection Animation */}

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
