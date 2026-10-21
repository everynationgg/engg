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
      className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-6 backdrop-blur-xl transition-all duration-300"
      style={{ background: "hsl(220 30% 2% / 0.92)" }}
      onClick={() => { playSciFiClick(); !isProcessing && onClose(); }}
    >
      <div
        className="relative w-full max-w-4xl h-full sm:h-auto sm:min-h-[500px] bg-[#080a0f] border-y sm:border border-cyan-500/20 shadow-[0_0_80px_rgba(0,243,255,0.2)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Elements */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        
        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-white/5 shrink-0 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-6">
             <div className="w-1.5 h-10 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
             <div>
               <h2 className="font-orbitron font-black text-xl sm:text-3xl tracking-[0.2em] sm:tracking-[0.3em] uppercase text-white truncate">
                 Credit_Exchange
               </h2>
               <p className="font-mono text-[10px] tracking-[0.4em] uppercase opacity-40">Authorized Currency Procurement Terminal</p>
             </div>
          </div>
          {!isProcessing && (
            <button
              onClick={() => { playSciFiClick(); onClose(); }}
              className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all text-white/40 hover:text-red-400 group"
            >
              <FaTimes className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Content - Main Split Layout */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-700 bg-cyan-500/5">
               <div className="w-24 h-24 rounded-full border-4 border-cyan-500 flex items-center justify-center shadow-[0_0_50px_#00f3ff]">
                  <FaGem className="text-4xl text-cyan-400 animate-pulse" />
               </div>
               <div className="text-center space-y-2">
                  <h3 className="font-orbitron text-3xl tracking-[0.4em] uppercase text-cyan-400">Sync_Successful</h3>
                  <p className="font-mono text-xs tracking-[0.2em] opacity-60 uppercase">Credits have been allocated to your account.</p>
               </div>
            </div>
          ) : (
            <>
              {/* Left Panel: Pack Selection */}
              <div className="w-full sm:w-1/2 border-r border-white/5 overflow-y-auto p-6 sm:p-10 custom-scrollbar bg-black/20">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 bg-cyan-500 rotate-45" />
                  <span className="font-orbitron text-[11px] tracking-[0.3em] uppercase text-cyan-400/80">Select_Configuration</span>
                </div>

                <div className="space-y-4">
                  {packs.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => { playSciFiClick(); setSelectedPack(pack); setError(null); }}
                      disabled={isProcessing}
                      className={`relative w-full p-5 sm:p-6 border transition-all duration-300 flex items-center justify-between gap-6 group ${
                        selectedPack?.id === pack.id 
                          ? "bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_30px_rgba(0,243,255,0.15)]" 
                          : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`p-3 rounded-lg transition-all ${selectedPack?.id === pack.id ? "bg-cyan-500/20" : "bg-white/5"}`}>
                          <FaGem className={`text-xl ${selectedPack?.id === pack.id ? "text-cyan-400" : "text-white/20 group-hover:text-white/40"}`} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className={`font-orbitron text-lg font-bold transition-colors ${selectedPack?.id === pack.id ? "text-white" : "text-white/60"}`}>
                            {pack.name}
                          </span>
                          <span className="font-mono text-[10px] tracking-widest opacity-40 uppercase">
                            {pack.amount} Base CC
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`font-orbitron text-xl font-bold ${selectedPack?.id === pack.id ? "text-cyan-400" : "text-white/40"}`}>
                          ${pack.price}
                        </span>
                        {pack.hasBonus && (
                          <span className="font-mono text-[9px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded uppercase tracking-tighter">
                            2X BONUS
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Panel: Details & Action */}
              <div className="w-full sm:w-1/2 p-6 sm:p-10 flex flex-col bg-white/[0.01]">
                {selectedPack ? (
                  <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500">
                    <div className="space-y-10">
                      {/* Dominant Title */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-orbitron text-2xl sm:text-3xl font-black tracking-widest text-white uppercase italic truncate">
                            {selectedPack.name}
                          </h3>
                          {selectedPack.hasBonus && (
                            <div className="px-3 py-1 bg-cyan-500 text-black font-orbitron text-[10px] font-black tracking-[0.2em] animate-pulse">
                              2X BONUS
                            </div>
                          )}
                        </div>
                        <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-cyan-500/20 to-transparent" />
                      </div>

                      {/* Explicit Breakdown */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-cyan-500" />
                          <span className="font-orbitron text-[11px] tracking-[0.3em] uppercase text-cyan-400/80">Allocation_Breakdown</span>
                        </div>
                        
                        <div className="space-y-4 bg-white/[0.03] p-6 border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs text-white/40 uppercase tracking-widest">Base_Yield</span>
                            <span className="font-orbitron text-lg text-white/60">{selectedPack.amount} CC</span>
                          </div>
                          {selectedPack.hasBonus && (
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">Sync_Bonus (First Time)</span>
                              <span className="font-orbitron text-lg text-cyan-400">+{selectedPack.amount} CC</span>
                            </div>
                          )}
                          <div className="h-px bg-white/10 my-4" />
                          <div className="flex justify-between items-end">
                            <span className="font-orbitron text-xs text-white/80 uppercase tracking-[0.2em]">Total_Yield</span>
                            <span className="font-orbitron text-4xl font-black text-white text-glow-cyan">
                              {selectedPack.hasBonus ? selectedPack.amount * 2 : selectedPack.amount} <span className="text-lg opacity-40 italic">CC</span>
                            </span>
                          </div>
                        </div>
                        
                        {selectedPack.hasBonus && (
                          <div className="flex items-center gap-3 px-4 py-3 bg-cyan-500/5 border border-cyan-500/20">
                            <FaShieldAlt className="text-cyan-400 text-xs" />
                            <span className="font-mono text-[9px] text-cyan-400/80 uppercase tracking-widest">One-time protocol boost applied</span>
                          </div>
                        )}
                      </div>

                      {/* Pricing & CTA */}
                      <div className="space-y-6 pt-6">
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded text-left space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-500 font-orbitron text-[9px] font-black tracking-widest uppercase">
                            <FaShieldAlt className="text-xs" /> WARNING: EPHEMERAL IDENTITY
                          </div>
                          <p className="font-mono text-[8px] leading-relaxed text-amber-500/80 uppercase">
                            Coins purchased are stored in this browser's local cache. Clearing cookies, browsing history, or switching devices/browsers will result in the loss of your coin balance. Coins cannot be recovered.
                          </p>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <button
                            type="button"
                            onClick={() => { playSciFiClick(); setPaymentMethod("paypal"); setError(null); }}
                            className={`py-3 font-orbitron font-bold text-xs tracking-wider uppercase border rounded-md transition-all ${
                              paymentMethod === "paypal"
                                ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.15)]"
                                : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white"
                            }`}
                          >
                            PayPal
                          </button>
                          <button
                            type="button"
                            onClick={() => { playSciFiClick(); setPaymentMethod("paymongo"); setError(null); }}
                            className={`py-3 font-orbitron font-bold text-xs tracking-wider uppercase border rounded-md transition-all ${
                              paymentMethod === "paymongo"
                                ? "bg-cyan-600/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white"
                            }`}
                          >
                            GCash / Maya / Card
                          </button>
                        </div>

                        <div className="flex items-end justify-between px-2">
                           <span className="font-mono text-xs text-white/20 uppercase tracking-[0.4em]">Exchange_Rate</span>
                           <span className="font-orbitron text-3xl text-white font-bold tracking-widest">${selectedPack.price} <span className="text-[10px] opacity-20">USD</span></span>
                        </div>

                        <div className="space-y-4">
                          <div className="min-h-[150px] flex flex-col justify-center">
                            {isProcessing ? (
                              <div className="flex flex-col items-center justify-center space-y-6 py-10">
                                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(0,243,255,0.2)]" />
                                <div className="text-center">
                                  <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-cyan-400 animate-pulse">Verifying_Transaction...</p>
                                  <p className="font-mono text-[8px] tracking-[0.2em] opacity-30 uppercase mt-2">Connecting to Secure Gateway</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {paymentMethod === "paypal" ? (
                                  <>
                                    <div ref={payPalRef} className="scale-110 origin-top transform translate-y-2">
                                      <PayPalButtons
                                        style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                        createOrder={handleCreateOrder}
                                        onApprove={handleApprove}
                                        onError={(err) => setError("PayPal synchronization failed. Please try again.")}
                                      />
                                    </div>
                                    <div className="flex items-center justify-center gap-3 text-white/20 mt-6 pt-4 border-t border-white/5">
                                      <FaShieldAlt className="text-[10px]" />
                                      <span className="font-mono text-[8px] uppercase tracking-widest">End-to-End Encrypted Secure Gateway</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={handlePayMongoCheckout}
                                      className="w-full py-4 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex flex-col items-center gap-1 shadow-[0_0_20px_rgba(6,182,212,0.3)] font-orbitron font-bold text-xs tracking-[0.2em] uppercase"
                                    >
                                      Proceed to Secure GCash / Card Checkout
                                    </button>
                                    <div className="flex items-center justify-center gap-3 text-white/20 mt-6 pt-4 border-t border-white/5">
                                      <FaShieldAlt className="text-[10px]" />
                                      <span className="font-mono text-[8px] uppercase tracking-widest">Powered by PayMongo Secure Gateway</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-20 group">
                    <FaGem className="text-6xl group-hover:scale-110 transition-transform duration-500" />
                    <p className="font-orbitron text-sm tracking-[0.4em] uppercase">Initialize_Configuration</p>
                  </div>
                )}

                {error && (
                  <div className="mt-6 p-5 bg-red-500/10 border border-red-500/30 text-center animate-in fade-in slide-in-from-top-2">
                    <p className="font-mono text-[10px] tracking-[0.2em] text-red-400 uppercase font-bold">{error}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 sm:px-10 py-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4">
              <FaPaypal className="text-blue-400/40 text-lg" />
              <div className="flex flex-col">
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase opacity-40">Security_Protocol_V2.4</span>
                <span className="font-mono text-[7px] tracking-[0.1em] uppercase opacity-20 italic underline decoration-cyan-500/20">Peer-Reviewed Cryptography Active</span>
              </div>
           </div>
           <div className="hidden sm:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="font-mono text-[8px] tracking-[0.2em] uppercase opacity-20">Transmission_Node</span>
                <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-cyan-500/60 font-bold">ALPHA_SECURE_GATEWAY</span>
              </div>
              <div className="w-10 h-10 rounded border border-white/5 flex items-center justify-center bg-white/[0.02]">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
              </div>
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
