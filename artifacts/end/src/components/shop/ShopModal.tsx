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
}

export default function ShopModal({ isOpen, onClose }: ShopModalProps) {
  const { token, refreshUser } = useAuth();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const payPalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPacks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPack && payPalRef.current) {
      // Auto-scroll to payment buttons on mobile for better UX
      if (window.innerWidth < 768) {
        payPalRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedPack]);

  const fetchPacks = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/shop/config`);
      const data = await response.json();
      setPacks(data.packs);
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md transition-all duration-300"
      style={{ background: "hsl(220 30% 2% / 0.9)" }}
      onClick={() => { playSciFiClick(); !isProcessing && onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-[#0c1016] border-y sm:border border-cyan-500/20 shadow-[0_0_60px_rgba(0,243,255,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Elements - Standardized with RoleConfig aesthetic */}
        <div className="absolute top-0 left-0 w-8 sm:w-12 h-8 sm:h-12 border-t-2 border-l-2 border-cyan-500/60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 sm:w-12 h-8 sm:h-12 border-t-2 border-r-2 border-cyan-500/60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 sm:w-12 h-8 sm:h-12 border-b-2 border-l-2 border-cyan-500/60 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 sm:w-12 h-8 sm:h-12 border-b-2 border-r-2 border-cyan-500/60 pointer-events-none" />
        
        {/* Header - Compact on mobile */}
        <div className="p-4 sm:p-8 border-b border-white/5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
             <div className="w-1 h-6 sm:w-1.5 sm:h-8 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
             <div>
               <h2 className="font-orbitron font-black text-lg sm:text-2xl tracking-[0.2em] sm:tracking-[0.4em] uppercase text-white">
                 Credit_Exchange
               </h2>
               <p className="hidden sm:block font-mono text-[10px] tracking-[0.5em] uppercase opacity-40">Authorized Currency Procurement Terminal</p>
               <p className="sm:hidden font-mono text-[8px] tracking-[0.2em] uppercase opacity-40">Procurement_Mode</p>
             </div>
          </div>
          {!isProcessing && (
            <button
              onClick={() => { playSciFiClick(); onClose(); }}
              className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all text-white/40 hover:text-red-400"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {success ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 rounded-full border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_30px_#00f3ff]">
                  <FaGem className="text-3xl text-cyan-400 animate-pulse" />
               </div>
               <div className="text-center">
                  <h3 className="font-orbitron text-xl tracking-[0.3em] uppercase text-cyan-400 mb-2">Sync_Successful</h3>
                  <p className="font-mono text-[10px] tracking-[0.2em] opacity-40 uppercase">Credits have been allocated to your account.</p>
               </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {packs.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => { playSciFiClick(); setSelectedPack(pack); setError(null); }}
                    disabled={isProcessing}
                    className={`relative p-4 sm:p-6 border transition-all duration-300 group flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 ${
                      selectedPack?.id === pack.id 
                        ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(0,243,255,0.2)]" 
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-4 sm:flex-col sm:gap-0">
                      <FaGem className={`text-xl sm:text-2xl sm:mb-4 transition-colors ${selectedPack?.id === pack.id ? "text-cyan-400" : "text-white/20 group-hover:text-white/40"}`} />
                      <div className="flex flex-col sm:items-center">
                        <span className="font-orbitron text-base sm:text-lg font-bold sm:mb-1">{pack.amount}</span>
                        <span className="font-mono text-[8px] sm:text-[9px] tracking-widest opacity-40 uppercase">Credits</span>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block h-px w-8 bg-white/10 mb-4" />
                    
                    <div className="flex flex-col items-end sm:items-center">
                      <span className="font-mono text-xs sm:text-sm text-cyan-400 font-bold">${pack.price}</span>
                      <span className="sm:hidden font-mono text-[7px] tracking-widest opacity-20 uppercase">Secure_Rate</span>
                    </div>
                    
                    {selectedPack?.id === pack.id && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 shadow-[0_0_10px_#00f3ff]" />
                    )}
                  </button>
                ))}
              </div>

              {selectedPack && !isProcessing && (
                <div ref={payPalRef} className="mt-8 sm:mt-10 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="font-orbitron text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-cyan-400/60">Secure_Payment_Gateway</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  
                  <div className="max-w-sm mx-auto">
                    <PayPalButtons
                      style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                      createOrder={handleCreateOrder}
                      onApprove={handleApprove}
                      onError={(err) => setError("PayPal synchronization failed. Please try again.")}
                    />
                    <div className="mt-4 flex items-center justify-center gap-2 text-white/20">
                      <FaShieldAlt className="text-[10px]" />
                      <span className="font-mono text-[8px] uppercase tracking-widest">Transaction handled in secure popup</span>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                  <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-cyan-400 animate-pulse">Verifying_Transaction...</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 text-center">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-red-400 uppercase">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 sm:p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between sm:justify-center gap-3">
           <div className="flex items-center gap-3">
              <FaPaypal className="text-blue-400/40 text-sm" />
              <span className="font-mono text-[8px] tracking-[0.3em] uppercase opacity-20">End-to-End Encrypted Tunnel Active</span>
           </div>
           <div className="sm:hidden font-mono text-[8px] tracking-[0.1em] uppercase text-cyan-500/40">v2.0_Secure</div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,243,255,0.2); }
      `}} />
    </div>
  );
}
