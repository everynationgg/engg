import { useState, useEffect, useRef } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "@/hooks/useAuth";
import { playSciFiClick } from "@/lib/sound";
import { FaPaypal, FaGem, FaTimes, FaShieldAlt } from "react-icons/fa";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreditPack {
  id: string;
  name: string;
  amount: number;
  price: string;
  currency: string;
  hasBonus?: boolean;
}

export default function ShopModal({ isOpen, onClose }: ShopModalProps) {
  const { token, refreshUser, userId } = useAuth();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "paymongo">("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const payPalRef = useRef<HTMLDivElement>(null);

  const handlePayMongoCheckout = async () => {
    if (!selectedPack) return;
    setIsProcessing(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/shop/paymongo-create-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packId: selectedPack.id }),
      });
      const data = await response.json();
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Failed to initialize PayMongo checkout link");
      }
    } catch (err) {
      setError("Failed to connect to payment gateway");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPacks();
    }
  }, [isOpen]);

  const fetchPacks = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/shop/config?userId=${userId}`);
      const data = await response.json();
      setPacks(data.packs);
      if (data.packs.length > 0 && !selectedPack) {
        setSelectedPack(data.packs[0]);
      }
    } catch (err) {
      console.error("Failed to fetch shop config", err);
    }
  };

  const handleCreateOrder = async (data: any, actions: any) => {
    if (!selectedPack) return "";
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/shop/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packId: selectedPack.id }),
      });
      
      const order = await response.json();
      return order.id;
    } catch (err) {
      setError("Failed to initialize PayPal order");
      return "";
    }
  };

  const handleApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/shop/capture-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          orderID: data.orderID,
          packId: selectedPack?.id 
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setSelectedPack(null);
        }, 3000);
      } else {
        setError(result.error || "Payment capture failed");
      }
    } catch (err) {
      setError("Failed to verify payment");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-6 backdrop-blur-xl transition-all duration-300"
      style={{
        background: "hsl(220 30% 2% / 0.92)",
        paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
      }}
      onClick={() => { playSciFiClick(); !isProcessing && onClose(); }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92dvh] sm:max-h-[88dvh] bg-[#080a0f] border border-cyan-500/25 rounded-xl shadow-[0_0_80px_rgba(0,243,255,0.2)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-no-swipe="true"
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        
        {/* Header */}
        <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-white/10 shrink-0 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
             <div className="w-1.5 h-8 bg-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.8)] rounded-full shrink-0" />
             <div className="min-w-0">
               <h2 className="font-orbitron font-black text-lg sm:text-2xl tracking-[0.18em] uppercase text-white truncate">
                 Credit Store
               </h2>
               <p className="font-mono text-[10px] sm:text-xs tracking-[0.12em] uppercase text-white/60 truncate">
                 Get Credits to Unlock Premium Roles
               </p>
             </div>
          </div>
          {!isProcessing && (
            <button
              onClick={() => { playSciFiClick(); onClose(); }}
              style={{ touchAction: "manipulation" }}
              className="w-11 h-11 rounded-lg flex items-center justify-center border border-white/15 hover:border-red-500/50 hover:bg-red-500/10 transition-all text-white/60 hover:text-red-400 group shrink-0 cursor-pointer"
            >
              <FaTimes className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Content - Scrollable on mobile, split layout on desktop */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-y-auto sm:overflow-hidden custom-scrollbar">
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 space-y-6 animate-in fade-in zoom-in duration-500 bg-cyan-500/5">
               <div className="w-20 h-20 rounded-full border-4 border-cyan-400 flex items-center justify-center shadow-[0_0_40px_#00f3ff]">
                  <FaGem className="text-3xl text-cyan-300 animate-pulse" />
               </div>
               <div className="text-center space-y-2">
                  <h3 className="font-orbitron font-bold text-2xl tracking-[0.2em] uppercase text-cyan-300">Purchase Complete</h3>
                  <p className="font-mono text-xs tracking-wider text-white/75">Credits have been added to your account.</p>
               </div>
            </div>
          ) : (
            <>
              {/* Left Panel: Pack Selection */}
              <div className="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-white/10 sm:overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-black/20">
                <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                  <div className="w-2 h-2 bg-cyan-400 rotate-45" />
                  <span className="font-orbitron font-bold text-xs tracking-[0.18em] uppercase text-cyan-300">
                    Choose a Credit Pack
                  </span>
                </div>

                <div className="space-y-3">
                  {packs.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => { playSciFiClick(); setSelectedPack(pack); setError(null); }}
                      disabled={isProcessing}
                      style={{ touchAction: "manipulation" }}
                      className={`relative w-full p-4 sm:p-5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 group cursor-pointer ${
                        selectedPack?.id === pack.id 
                          ? "bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_25px_rgba(0,243,255,0.15)]" 
                          : "bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg transition-all ${selectedPack?.id === pack.id ? "bg-cyan-500/20" : "bg-white/5"}`}>
                          <FaGem className={`text-lg ${selectedPack?.id === pack.id ? "text-cyan-300" : "text-white/40 group-hover:text-white/60"}`} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className={`font-orbitron text-base sm:text-lg font-bold transition-colors ${selectedPack?.id === pack.id ? "text-white" : "text-white/80"}`}>
                            {pack.name}
                          </span>
                          <span className="font-mono text-xs text-white/55">
                            {pack.amount} Credits
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`font-orbitron text-lg sm:text-xl font-bold ${selectedPack?.id === pack.id ? "text-cyan-300" : "text-white/75"}`}>
                          ${pack.price}
                        </span>
                        {pack.hasBonus && (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded uppercase">
                            2× First-Time Bonus
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Panel: Details & Action */}
              <div className="w-full sm:w-1/2 p-4 sm:p-8 sm:overflow-y-auto custom-scrollbar flex flex-col bg-white/[0.01]">
                {selectedPack ? (
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-6">
                      {/* Selected Pack Title */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-orbitron text-xl sm:text-2xl font-black tracking-wider text-white uppercase truncate">
                            {selectedPack.name}
                          </h3>
                          {selectedPack.hasBonus && (
                            <div className="px-2.5 py-1 rounded bg-cyan-400 text-black font-orbitron text-[10px] font-black tracking-wider shrink-0">
                              2× BONUS
                            </div>
                          )}
                        </div>
                        <div className="h-0.5 w-full bg-gradient-to-r from-cyan-400 via-cyan-500/20 to-transparent" />
                      </div>

                      {/* Summary */}
                      <div className="space-y-3">
                        <span className="font-orbitron font-bold text-xs tracking-[0.18em] uppercase text-cyan-300">
                          Summary
                        </span>
                        
                        <div className="space-y-3 rounded-xl bg-white/[0.03] p-4 sm:p-5 border border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs text-white/60 uppercase">Base Credits</span>
                            <span className="font-orbitron text-base text-white/85">{selectedPack.amount} CC</span>
                          </div>
                          {selectedPack.hasBonus && (
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs text-cyan-300 uppercase">First-Time Bonus</span>
                              <span className="font-orbitron text-base text-cyan-300">+{selectedPack.amount} CC</span>
                            </div>
                          )}
                          <div className="h-px bg-white/10 my-2" />
                          <div className="flex justify-between items-end">
                            <span className="font-orbitron font-bold text-xs text-white/90 uppercase tracking-wider">Total Credits</span>
                            <span className="font-orbitron text-2xl sm:text-3xl font-black text-cyan-300">
                              {selectedPack.hasBonus ? selectedPack.amount * 2 : selectedPack.amount} <span className="text-sm text-white/60">CC</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Checkout */}
                      <div className="space-y-4">
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-left space-y-1">
                          <div className="flex items-center gap-2 text-amber-300 font-orbitron text-[10px] font-bold tracking-wider uppercase">
                            <FaShieldAlt className="text-xs shrink-0" /> Account Tip
                          </div>
                          <p className="text-xs leading-relaxed text-amber-100/80">
                            Playing as a guest? Save your billing email—you can restore purchased credits anytime from your Profile.
                          </p>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => { playSciFiClick(); setPaymentMethod("paypal"); setError(null); }}
                            style={{ touchAction: "manipulation" }}
                            className={`py-3 font-orbitron font-bold text-xs tracking-wider uppercase border rounded-lg transition-all cursor-pointer ${
                              paymentMethod === "paypal"
                                ? "bg-blue-600/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                                : "bg-white/[0.03] border-white/15 text-white/60 hover:text-white"
                            }`}
                          >
                            PayPal
                          </button>
                          <button
                            type="button"
                            onClick={() => { playSciFiClick(); setPaymentMethod("paymongo"); setError(null); }}
                            style={{ touchAction: "manipulation" }}
                            className={`py-3 font-orbitron font-bold text-xs tracking-wider uppercase border rounded-lg transition-all cursor-pointer ${
                              paymentMethod === "paymongo"
                                ? "bg-cyan-600/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                : "bg-white/[0.03] border-white/15 text-white/60 hover:text-white"
                            }`}
                          >
                            GCash / Maya / Card
                          </button>
                        </div>

                        <div className="flex items-end justify-between px-1">
                           <span className="font-mono text-xs text-white/60 uppercase tracking-wider">Price</span>
                           <span className="font-orbitron text-2xl sm:text-3xl text-white font-bold">${selectedPack.price} <span className="text-xs text-white/50">USD</span></span>
                        </div>

                        <div className="pt-1">
                          {isProcessing ? (
                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                              <p className="font-mono text-xs tracking-wider uppercase text-cyan-300 animate-pulse">
                                Processing payment...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {paymentMethod === "paypal" ? (
                                <div ref={payPalRef}>
                                  <PayPalButtons
                                    style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                    createOrder={handleCreateOrder}
                                    onApprove={handleApprove}
                                    onError={() => setError("PayPal checkout could not be completed. Please try again.")}
                                  />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handlePayMongoCheckout}
                                  style={{ touchAction: "manipulation" }}
                                  className="w-full py-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-all flex flex-col items-center gap-1 shadow-[0_0_20px_rgba(6,182,212,0.3)] font-orbitron font-black text-xs tracking-[0.15em] uppercase cursor-pointer"
                                >
                                  Continue to GCash / Maya / Card Checkout
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-4 text-white/40">
                    <FaGem className="text-4xl" />
                    <p className="font-orbitron text-xs tracking-[0.2em] uppercase">Select a credit pack</p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                    <p className="font-mono text-xs text-red-300 font-semibold">{error}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-4 sm:px-8 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3 text-white/60">
              <FaPaypal className="text-blue-400 text-base shrink-0" />
              <span className="font-mono text-[11px] tracking-wider">
                Secure Checkout via PayPal or PayMongo
              </span>
           </div>
           <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400/80">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Instant Credit Delivery</span>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,243,255,0.3); }
      `}} />
    </div>
  );
}
