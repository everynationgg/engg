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
  const [hoveredPackId, setHoveredPackId] = useState<string | null>(null);

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

        <main className="relative z-20 w-full max-w-[1400px] px-4 md:px-8 xl:px-12 pb-40 flex flex-col items-center">
          {/* Header Clearance Spacer */}
          <div className="h-[104px] w-full shrink-0 pointer-events-none" />

          {/* Header Section */}
          <header className="w-full flex flex-col items-center gap-4 mb-16 text-center px-4 md:px-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[1px] bg-cyan-500/40" />
              <span className="font-mono text-[9px] uppercase tracking-[0.6em] text-cyan-400/60">Asset_Uplink</span>
            </div>
            <h1 className="font-orbitron font-black text-2xl sm:text-3xl lg:text-4xl tracking-[0.4em] uppercase text-white leading-tight">
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
            <div className="flex flex-col gap-8 w-full">
              {/* 2X BONUS PROMINENT BANNER */}
              <div className="w-full bg-cyan-500/10 border border-cyan-500/40 p-4 backdrop-blur-lg shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <FaBolt className="text-cyan-400 text-xs animate-pulse" />
                       <div className="flex flex-col">
                          <span className="font-orbitron text-[11px] font-black text-white tracking-[0.2em] uppercase">2X_Bonus_Signal</span>
                          <span className="font-mono text-[7px] text-cyan-400/60 uppercase tracking-widest mt-0.5">Verified for First Time Purchase</span>
                       </div>
                    </div>
                    <div className="px-2 py-1 border border-cyan-500/20 bg-cyan-500/5">
                       <span className="font-mono text-[9px] font-bold text-cyan-400">ACTIVE</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3 px-2">
                 <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20">Select_Node</span>
                 <div className="flex-1 h-[1px] bg-white/5" />
              </div>

              {/* ═══ 4-COLUMN PRODUCT CARD GRID ═══ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 w-full items-start">
                {packs.map((pack) => {
                  const isSelected = selectedPack?.id === pack.id;
                  const config = RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common;
                  const isBestValue = pack.id === "pack_1000";
                  const isHovered = hoveredPackId === pack.id;

                  return (
                    <motion.div
                      key={pack.id}
                      onClick={() => handlePackSelect(pack)}
                      onMouseEnter={() => setHoveredPackId(pack.id)}
                      onMouseLeave={() => setHoveredPackId(null)}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative cursor-pointer transition-all duration-500 ${
                        isBestValue ? "lg:scale-[1.06] lg:-my-3 z-10" : ""
                      } ${isSelected ? "scale-[1.02]" : ""}`}
                    >
                      {/* Best Value Badge */}
                      {isBestValue && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 border border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                          <span className="font-orbitron text-[7px] font-black text-black uppercase tracking-[0.3em] whitespace-nowrap">Best_Value</span>
                        </div>
                      )}

                      <TacticalSlate
                        color={isSelected || isHovered ? config.color : "#00f3ff"}
                        className={`h-full transition-all duration-500 ${
                          isSelected 
                            ? "shadow-[0_0_50px_rgba(0,243,255,0.25)]" 
                            : isHovered 
                              ? "shadow-[0_0_30px_rgba(0,243,255,0.1)]" 
                              : ""
                        } ${isBestValue && !isSelected ? "shadow-[0_0_35px_rgba(234,179,8,0.12)]" : ""}`}
                        showScanner={isSelected}
                      >
                        <div className="p-4 lg:p-5 flex flex-col items-center relative min-h-[340px]">
                          {/* Top Badges Row */}
                          <div className="w-full flex items-center justify-between mb-2 min-h-[22px]">
                            <div className={`px-2 py-0.5 border transition-all duration-300 ${
                              isSelected ? "border-current bg-white/10" : "border-white/10 bg-white/5"
                            }`}>
                              <span className="font-orbitron text-[7px] uppercase tracking-[0.2em]" style={{ color: config.color }}>
                                {config.label}
                              </span>
                            </div>
                            {pack.hasBonus && (
                              <div className={`px-2 py-0.5 border border-cyan-500/30 transition-all duration-300 ${
                                isSelected || isHovered ? "bg-cyan-500/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]" : "bg-cyan-500/10"
                              }`}>
                                <span className="font-orbitron text-[6px] font-bold text-cyan-400 tracking-wider animate-pulse">2X</span>
                              </div>
                            )}
                          </div>

                          {/* 3D Core Visual — with depth containment */}
                          <div className="relative my-3 flex items-center justify-center w-full">
                            {/* Radial vignette — makes 3D feel embedded, not floating */}
                            <div 
                              className={`absolute inset-0 rounded-full transition-opacity duration-500 pointer-events-none ${
                                isSelected ? "opacity-100" : isHovered ? "opacity-60" : "opacity-30"
                              }`}
                              style={{ background: `radial-gradient(circle at center, ${config.color}11 0%, transparent 65%)` }}
                            />
                            <div className={`${isBestValue ? "w-36 h-36 lg:w-40 lg:h-40" : "w-28 h-28 lg:w-32 lg:h-32"} transition-all duration-500`}>
                              <PackVisual3D
                                rarity={pack.rarity}
                                color={config.color}
                                isSelected={isSelected}
                                isHovered={isHovered}
                              />
                            </div>
                            {/* Ambient glow behind 3D — tight, not spilling */}
                            <div
                              className={`absolute inset-0 rounded-full blur-[35px] transition-all duration-700 pointer-events-none ${
                                isSelected ? "opacity-25 scale-100" : isHovered ? "opacity-10 scale-95" : "opacity-[0.03] scale-90"
                              }`}
                              style={{ backgroundColor: config.color }}
                            />
                          </div>

                          {/* Pack Info */}
                          <div className="w-full flex flex-col items-center gap-1 mt-auto">
                            <h3 className={`font-orbitron text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-center leading-tight transition-colors duration-300 ${
                              isSelected ? "text-white" : "text-white/80"
                            }`}>
                              {pack.name}
                            </h3>
                            <span className={`font-mono font-bold transition-all duration-300 ${
                              isSelected ? "text-cyan-300 text-[9px]" : "text-cyan-400/50 text-[8px]"
                            }`}>
                              {pack.hasBonus ? (pack.amount * 2).toLocaleString() : pack.amount.toLocaleString()} CC
                            </span>
                          </div>

                          {/* Divider — glows on selection */}
                          <div className={`w-full h-[1px] my-3 transition-all duration-500 ${
                            isSelected 
                              ? "bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_6px_rgba(0,243,255,0.4)]" 
                              : "bg-white/5"
                          }`} />

                          {/* Price */}
                          <div className="w-full flex flex-col items-center gap-2">
                            <span className={`font-orbitron font-black transition-all duration-300 ${
                              isSelected ? "text-xl text-white" : "text-lg text-white/60"
                            }`}>${pack.price}</span>
                            {/* Selection indicator bar */}
                            <div className={`w-full h-[2px] transition-all duration-500 ${
                              isSelected 
                                ? "bg-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.6)]" 
                                : isHovered 
                                  ? "bg-white/15" 
                                  : "bg-white/5"
                            }`} />
                          </div>
                        </div>
                      </TacticalSlate>

                      {/* Outer selection glow — contained */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 0.15, scale: 0.98 }}
                          className="absolute inset-0 -z-10 blur-[30px] pointer-events-none"
                          style={{ backgroundColor: config.color }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Connecting glow strip — ties card grid to detail panel */}
              {selectedPack && (
                <div className="w-full flex justify-center -my-3 relative z-0">
                  <div 
                    className="w-24 h-6 blur-[16px] opacity-15"
                    style={{ backgroundColor: RARITY_CONFIG[selectedPack.rarity]?.color || "#00f3ff" }}
                  />
                </div>
              )}

              {/* ═══ DETAIL PANEL (below grid) ═══ */}
              <AnimatePresence mode="wait">
                {selectedPack && (
                  <motion.div
                    key={checkoutMode ? 'checkout' : selectedPack.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                  >
                    <TacticalSlate color={RARITY_CONFIG[selectedPack.rarity]?.color || "#00f3ff"}>
                      {checkoutMode ? (
                        /* CHECKOUT MODE */
                        <div className="p-8 md:p-12 flex flex-col">
                          <div className="flex flex-col gap-1 mb-10">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse" />
                                <h3 className="font-orbitron text-[12px] uppercase font-black text-white tracking-[0.4em]">Secure_Checkout_Terminal</h3>
                             </div>
                             <span className="font-mono text-[7px] text-cyan-400/40 tracking-[0.4em] uppercase">Protocol: ASSET_TRANSFER_FINALIZATION</span>
                          </div>

                          <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 flex flex-col gap-6 pb-6 border-b md:border-b-0 md:border-r border-white/5 md:pr-8">
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
                            <div className="flex-1 flex flex-col items-center justify-center">
                              {isSyncing ? (
                                <div className="flex flex-col items-center gap-3 py-10">
                                  <div className="w-4 h-4 border border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                  <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-cyan-400/40 animate-pulse">Neural_Sync...</span>
                                </div>
                              ) : (
                                <div className="max-w-sm w-full">
                                  <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb" }}>
                                     <PayPalButtons
                                       style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 40 }}
                                       createOrder={handleCreateOrder}
                                       onApprove={handleApprove}
                                     />
                                  </PayPalScriptProvider>
                                </div>
                              )}
                            </div>
                          </div>
                          <button onClick={() => setCheckoutMode(false)} className="mt-8 flex justify-center">
                             <span className="font-mono text-[7px] uppercase tracking-[0.6em] text-white/10 hover:text-white/40 transition-colors">Abort_Transfer</span>
                          </button>
                        </div>
                      ) : (
                        /* DETAIL MODE */
                        <div className="p-8 md:p-12">
                          <div className="flex flex-col md:flex-row gap-10">
                            <div className="flex-1 flex flex-col">
                              <div className="flex flex-col gap-1 mb-6">
                                 <div className="flex items-center gap-3 flex-wrap">
                                   <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-cyan-400/40">Path: ROOT &gt; SHOP &gt; DETAIL</span>
                                   {(selectedPack.id === "pack_1000" || selectedPack.id === "pack_2500") && (
                                     <span className="font-mono text-[6px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 uppercase tracking-widest border border-cyan-500/20">
                                        {selectedPack.id === "pack_1000" ? "Optimize: NEW_IDENTITY" : "Optimize: MAX_VALUE"}
                                     </span>
                                   )}
                                 </div>
                                 <h2 className="font-orbitron text-2xl font-black uppercase text-white tracking-widest">{selectedPack.name}</h2>
                              </div>

                              <div className="flex flex-col gap-4 mb-8 pb-6 border-b border-white/5">
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

                              <SciFiButton variant="primary" className="w-full md:w-auto py-6" onClick={() => setCheckoutMode(true)}>
                                 <span className="text-[12px]">Deploy ${selectedPack.price}</span>
                              </SciFiButton>
                              <div className="flex justify-center md:justify-start mt-4">
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
