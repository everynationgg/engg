import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaShieldAlt, FaLock, FaBolt } from "react-icons/fa";
import { useLocation } from "wouter";
import PackVisual3D from "@/features/shop/components/PackVisual3D";
import { SciFiButton } from "@/components/common/SciFiButton";
import {
  CinematicPageShell,
  HudPanel,
} from "@/components/common/PremiumVisuals";
import { cn } from "@/lib/utils";

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
  {
    id: "pack_250",
    name: "Standard Core",
    amount: 250,
    price: "4.99",
    currency: "USD",
    rarity: "common",
  },
  {
    id: "pack_500",
    name: "Tactical Core",
    amount: 500,
    price: "8.99",
    currency: "USD",
    bonus: "+50 Bonus",
    rarity: "rare",
  },
  {
    id: "pack_1000",
    name: "Elite Core",
    amount: 1000,
    price: "15.99",
    currency: "USD",
    bonus: "+150 Bonus",
    rarity: "epic",
  },
  {
    id: "pack_2500",
    name: "Sovereign Core",
    amount: 2500,
    price: "34.99",
    currency: "USD",
    bonus: "+500 Bonus",
    rarity: "legendary",
  },
];

const RARITY_CONFIG = {
  common: { color: "hsl(185 100% 50%)", label: "Standard" },
  rare: { color: "hsl(270 80% 60%)", label: "Tactical" },
  epic: { color: "hsl(45 90% 55%)", label: "Elite" },
  legendary: { color: "hsl(0 100% 60%)", label: "Sovereign" },
};

export default function Shop() {
  const { isLoggedIn, token, refreshUser, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successCredits, setSuccessCredits] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const [packs, setPacks] = useState<Pack[]>(FALLBACK_PACKS);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isSyncing] = useState(false); // Controlled from capture logic
  const [hoveredPackId, setHoveredPackId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(reducedMotion);

  useEffect(() => {
    setLoading(true);
    const url = new URL(
      `${import.meta.env.VITE_API_URL || ""}/api/shop/config`,
      window.location.origin,
    );
    if (user?.id) url.searchParams.append("userId", user.id);

    fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.packs && data.packs.length > 0) {
          setPacks(data.packs);
          const defaultPackId = data.isFirstPurchase
            ? "pack_1000"
            : "pack_2500";
          const defaultPack =
            data.packs.find((p: Pack) => p.id === defaultPackId) ||
            data.packs[1];
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
    setCheckoutMode(false); // Reset checkout when selecting another pack
  };

  const handleCreateOrder = async () => {
    if (!selectedPack) return "";
    if (!isLoggedIn) {
      setError("Auth_Required: Session_Closed");
      return "";
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/shop/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packId: selectedPack.id }),
        },
      );
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/shop/capture-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderID: data.orderID,
            packId: selectedPack?.id,
          }),
        },
      );
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

  const activeAccentColor = selectedPack
    ? RARITY_CONFIG[selectedPack.rarity]?.color || "#00f3ff"
    : "rgba(245, 158, 11, 0.12)";

  return (
    <CinematicPageShell
      pageLabel="ASSET_MARKET"
      accentColor={
        selectedPack ? `${activeAccentColor}22` : "rgba(245, 158, 11, 0.12)"
      }
    >
      <main className="relative z-20 w-full max-w-[1400px] px-4 md:px-8 xl:px-12 pb-40 flex flex-col items-center">
        {/* Header Section */}
        <header className="w-full flex flex-col items-center gap-4 mb-12 text-center px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1px] bg-cyan-500/40" />
            <span className="font-mono text-[11px] uppercase tracking-[0.6em] text-cyan-400/60">
              Asset_Uplink
            </span>
          </div>
          <h1 className="font-orbitron font-black text-2xl sm:text-3xl lg:text-4xl tracking-[0.4em] uppercase text-white leading-tight">
            Credit <span className="text-cyan-400">Market</span>
          </h1>
          <div className="flex items-center gap-6 mt-2 opacity-20">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-[9px]" />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                Auth: Secure
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaLock className="text-[9px]" />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                Region: Alpha_01
              </span>
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
                error
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-cyan-500/20 bg-cyan-500/5"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${error ? "bg-red-500" : "bg-cyan-500 animate-pulse"}`}
              />
              <p
                className={`font-orbitron text-[12px] tracking-[0.2em] uppercase text-center ${error ? "text-red-400" : "text-cyan-400"}`}
              >
                {error
                  ? error
                  : `Transfer_Complete: +${successCredits?.toLocaleString()} Units`}
              </p>
              {error && (
                <button
                  onClick={() => setError(null)}
                  className="px-3 py-0.5 text-red-500/40 hover:text-red-400 font-mono text-[10px] uppercase tracking-widest border border-red-500/10 transition-all cursor-pointer"
                >
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
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/20 animate-pulse">
              Syncing_Nodes...
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-8 w-full">
            {/* 2X BONUS PROMINENT BANNER */}
            <div className="w-full bg-cyan-500/5 border border-cyan-500/20 p-4 backdrop-blur-lg shadow-[0_0_20px_rgba(6,182,212,0.08)] rounded-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaBolt className="text-cyan-400 text-xs animate-pulse" />
                  <div className="flex flex-col">
                    <span className="font-orbitron text-[11px] font-black text-white tracking-[0.2em] uppercase">
                      2X_Bonus_Signal
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400/60 uppercase tracking-widest mt-0.5">
                      Verified for First Time Purchase
                    </span>
                  </div>
                </div>
                <div className="px-2 py-1 border border-cyan-500/20 bg-cyan-500/5">
                  <span className="font-mono text-[10px] font-bold text-cyan-400">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/25">
                Select_Node
              </span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            {/* ═══ 4-COLUMN PRODUCT CARD GRID ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full items-start">
              {packs.map((pack) => {
                const isSelected = selectedPack?.id === pack.id;
                const config =
                  RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common;
                const isBestValue = pack.id === "pack_1000";
                const isHovered = hoveredPackId === pack.id;

                return (
                  <motion.div
                    key={pack.id}
                    onClick={() => handlePackSelect(pack)}
                    onMouseEnter={() => setHoveredPackId(pack.id)}
                    onMouseLeave={() => setHoveredPackId(null)}
                    whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative cursor-pointer transition-all duration-500 ${
                      isBestValue ? "lg:scale-[1.04] lg:-my-2 z-10" : ""
                    } ${isSelected ? "scale-[1.01]" : ""}`}
                  >
                    {/* Best Value Badge */}
                    {isBestValue && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 px-5 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 border border-yellow-400/40 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                        <span className="font-orbitron text-[10px] font-black text-black uppercase tracking-[0.25em] whitespace-nowrap">
                          Best_Value
                        </span>
                      </div>
                    )}

                    <HudPanel
                      color={
                        isSelected || isHovered
                          ? config.color
                          : "rgba(255,255,255,0.06)"
                      }
                      className={cn(
                        "h-full",
                        isSelected && "shadow-[0_0_40px_rgba(0,243,255,0.15)]",
                      )}
                    >
                      <div className="p-5 flex flex-col items-center relative min-h-[350px]">
                        {/* Top Badges Row */}
                        <div className="w-full flex items-center justify-between mb-2 min-h-[22px]">
                          <div
                            className={`px-2 py-0.5 border transition-all duration-300 ${
                              isSelected
                                ? "border-current bg-white/10"
                                : "border-white/5 bg-white/5"
                            }`}
                          >
                            <span
                              className="font-orbitron text-[10px] uppercase tracking-[0.2em]"
                              style={{ color: config.color }}
                            >
                              {config.label}
                            </span>
                          </div>
                          {pack.hasBonus && (
                            <div
                              className={`px-2 py-0.5 border border-cyan-500/30 transition-all duration-300 ${
                                isSelected || isHovered
                                  ? "bg-cyan-500/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]"
                                  : "bg-cyan-500/10"
                              }`}
                            >
                              <span className="font-orbitron text-[8px] font-bold text-cyan-400 tracking-wider animate-pulse">
                                2X
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 3D Core Visual */}
                        <div className="relative my-4 flex items-center justify-center w-full min-h-[140px]">
                          <div
                            className={`absolute inset-0 rounded-full transition-opacity duration-500 pointer-events-none ${
                              isSelected
                                ? "opacity-100"
                                : isHovered
                                  ? "opacity-60"
                                  : "opacity-30"
                            }`}
                            style={{
                              background: `radial-gradient(circle at center, ${config.color}11 0%, transparent 65%)`,
                            }}
                          />
                          <div
                            className={`${isBestValue ? "w-36 h-36" : "w-28 h-28"} transition-all duration-500`}
                          >
                            <PackVisual3D
                              rarity={pack.rarity}
                              color={config.color}
                              isSelected={isSelected}
                              isHovered={isHovered}
                            />
                          </div>
                          {/* Ambient glow behind 3D */}
                          <div
                            className={`absolute inset-0 rounded-full blur-[35px] transition-all duration-700 pointer-events-none ${
                              isSelected
                                ? "opacity-20 scale-100"
                                : isHovered
                                  ? "opacity-8 scale-95"
                                  : "opacity-[0.02] scale-90"
                            }`}
                            style={{ backgroundColor: config.color }}
                          />
                        </div>

                        {/* Pack Info */}
                        <div className="w-full flex flex-col items-center gap-1 mt-auto">
                          <h3
                            className={`font-orbitron text-[12px] lg:text-[13px] font-black uppercase tracking-widest text-center leading-tight transition-colors duration-300 ${
                              isSelected ? "text-white" : "text-white/70"
                            }`}
                          >
                            {pack.name}
                          </h3>
                          <span
                            className={`font-mono font-bold transition-all duration-300 ${
                              isSelected
                                ? "text-cyan-300 text-[11px]"
                                : "text-cyan-400/50 text-[10px]"
                            }`}
                          >
                            {pack.hasBonus
                              ? (pack.amount * 2).toLocaleString()
                              : pack.amount.toLocaleString()}{" "}
                            CC
                          </span>
                        </div>

                        {/* Divider */}
                        <div
                          className={`w-full h-[1px] my-3 transition-all duration-500 ${
                            isSelected
                              ? "bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                              : "bg-white/5"
                          }`}
                        />

                        {/* Price */}
                        <div className="w-full flex flex-col items-center gap-2">
                          <span
                            className={`font-orbitron font-black transition-all duration-300 ${
                              isSelected
                                ? "text-xl text-white"
                                : "text-lg text-white/50"
                            }`}
                          >
                            ${pack.price}
                          </span>
                          <div
                            className={`w-full h-[2px] transition-all duration-500 ${
                              isSelected
                                ? "bg-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.6)]"
                                : isHovered
                                  ? "bg-white/15"
                                  : "bg-white/5"
                            }`}
                          />
                        </div>
                      </div>
                    </HudPanel>
                  </motion.div>
                );
              })}
            </div>

            {/* DETAIL PANEL (below grid) */}
            <AnimatePresence mode="wait">
              {selectedPack && (
                <motion.div
                  key={checkoutMode ? "checkout" : selectedPack.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.25,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="w-full mt-4"
                >
                  <HudPanel
                    color={
                      RARITY_CONFIG[selectedPack.rarity]?.color || "#00f3ff"
                    }
                  >
                    {checkoutMode ? (
                      /* CHECKOUT MODE */
                      <div className="p-8 md:p-12 flex flex-col">
                        <div className="flex flex-col gap-1 mb-8">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse" />
                            <h3 className="font-orbitron text-[13px] uppercase font-black text-white tracking-[0.4em]">
                              Secure_Checkout_Terminal
                            </h3>
                          </div>
                          <span className="font-mono text-[10px] text-cyan-400/40 tracking-[0.4em] uppercase">
                            Protocol: ASSET_TRANSFER_FINALIZATION
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1 flex flex-col gap-6 pb-6 border-b md:border-b-0 md:border-r border-white/5 md:pr-8">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                                Charge_Amount
                              </span>
                              <span className="font-orbitron text-lg font-black text-white">
                                ${selectedPack.price}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                                Yield_Expectation
                              </span>
                              <div className="flex flex-col items-end">
                                <span className="font-orbitron text-lg font-bold text-cyan-400">
                                  +
                                  {selectedPack.hasBonus
                                    ? selectedPack.amount * 2
                                    : selectedPack.amount}{" "}
                                  CC
                                </span>
                                {selectedPack.hasBonus && (
                                  <span className="font-mono text-[8.5px] text-cyan-400/40 uppercase tracking-widest mt-0.5">
                                    X2_Sync_Applied
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center">
                            {isSyncing ? (
                              <div className="flex flex-col items-center gap-3 py-10">
                                <div className="w-4 h-4 border border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-400/40 animate-pulse">
                                  Neural_Sync...
                                </span>
                              </div>
                            ) : (
                              <div className="max-w-sm w-full">
                                <PayPalScriptProvider
                                  options={{
                                    clientId:
                                      import.meta.env.VITE_PAYPAL_CLIENT_ID ||
                                      "sb",
                                  }}
                                >
                                  <PayPalButtons
                                    style={{
                                      layout: "vertical",
                                      color: "blue",
                                      shape: "rect",
                                      label: "pay",
                                      height: 40,
                                    }}
                                    createOrder={handleCreateOrder}
                                    onApprove={handleApprove}
                                  />
                                </PayPalScriptProvider>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setCheckoutMode(false)}
                          className="mt-8 flex justify-center cursor-pointer"
                        >
                          <span className="font-mono text-[10px] uppercase tracking-[0.6em] text-white/20 hover:text-white/60 transition-colors">
                            Abort_Transfer
                          </span>
                        </button>
                      </div>
                    ) : (
                      /* DETAIL MODE */
                      <div className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row gap-10">
                          <div className="flex-1 flex flex-col">
                            <div className="flex flex-col gap-1 mb-6">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-400/40">
                                  Path: ROOT &gt; SHOP &gt; DETAIL
                                </span>
                                {(selectedPack.id === "pack_1000" ||
                                  selectedPack.id === "pack_2500") && (
                                  <span className="font-mono text-[8.5px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 uppercase tracking-widest border border-cyan-500/20">
                                    {selectedPack.id === "pack_1000"
                                      ? "Optimize: NEW_IDENTITY"
                                      : "Optimize: MAX_VALUE"}
                                  </span>
                                )}
                              </div>
                              <h2 className="font-orbitron text-2xl font-black uppercase text-white tracking-widest">
                                {selectedPack.name}
                              </h2>
                            </div>

                            <div className="flex flex-col gap-4 mb-8 pb-6 border-b border-white/5">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                                  Base_Yield
                                </span>
                                <span className="font-orbitron text-sm font-bold text-white">
                                  {selectedPack.amount.toLocaleString()} CC
                                </span>
                              </div>
                              {selectedPack.hasBonus && (
                                <div className="flex justify-between items-center text-cyan-400">
                                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                                    Bonus_Protocol
                                  </span>
                                  <span className="font-orbitron text-sm font-bold">
                                    +{selectedPack.amount.toLocaleString()} CC
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
                                  Total_Transferred
                                </span>
                                <div className="flex items-baseline gap-1">
                                  <span className="font-orbitron text-2xl font-black text-white">
                                    {selectedPack.hasBonus
                                      ? (
                                          selectedPack.amount * 2
                                        ).toLocaleString()
                                      : selectedPack.amount.toLocaleString()}
                                  </span>
                                  <span className="font-orbitron text-[11px] text-cyan-500 font-bold">
                                    CC
                                  </span>
                                </div>
                              </div>
                            </div>

                            <SciFiButton
                              variant={isLoggedIn ? "primary" : "outline"}
                              className="w-full md:w-auto py-6 cursor-pointer"
                              onClick={() => {
                                if (isLoggedIn) {
                                  setCheckoutMode(true);
                                } else {
                                  setLocation("/login");
                                }
                              }}
                            >
                              <span className="text-[14px]">
                                {isLoggedIn
                                  ? `Deploy $${selectedPack.price}`
                                  : "Authorize to Deploy"}
                              </span>
                            </SciFiButton>
                            <div className="flex justify-center md:justify-start mt-4">
                              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/25">
                                {isLoggedIn
                                  ? "Authorized_Transaction_Ready"
                                  : "Identity_Required_for_Transfer"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </HudPanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

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
                initial={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{ x: 0, y: -400, scale: [1, 0], opacity: [1, 0] }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.3,
                  ease: "circIn",
                }}
                className="absolute w-2 h-2 bg-cyan-400"
                style={{
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </CinematicPageShell>
  );
}
