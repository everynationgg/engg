import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "@/hooks/useAuth";
import { playSciFiClick } from "@/lib/sound";
import { FaPaypal, FaGem, FaTimes } from "react-icons/fa";

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

  useEffect(() => {
    if (isOpen) {
      fetchPacks();
    }
  }, [isOpen]);

  const fetchPacks = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shop/config`);
      const data = await response.json();
      setPacks(data.packs);
    } catch (err) {
      console.error("Failed to fetch shop config", err);
    }
  };

  const handleCreateOrder = async (data: any, actions: any) => {
    if (!selectedPack) return "";
    
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
      return order.id;
    } catch (err) {
      setError("Failed to initialize PayPal order");
      return "";
    }
  };

  const handleApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shop/capture-order`, {
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
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300"
      style={{ background: "hsl(220 30% 2% / 0.9)" }}
      onClick={() => { playSciFiClick(); !isProcessing && onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0c1016] border border-cyan-500/20 shadow-[0_0_60px_rgba(0,243,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Elements */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/60" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-500/60" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-500/60" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-500/60" />
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-1">
               <div className="w-1.5 h-8 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
               <h2 className="font-orbitron font-black text-2xl tracking-[0.4em] uppercase text-white">
                 Credit_Exchange
               </h2>
            </div>
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase opacity-40">Authorized Currency Procurement Terminal</p>
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
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packs.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => { playSciFiClick(); setSelectedPack(pack); setError(null); }}
                    disabled={isProcessing}
                    className={`relative p-6 border transition-all duration-300 group flex flex-col items-center ${
                      selectedPack?.id === pack.id 
                        ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(0,243,255,0.2)]" 
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <FaGem className={`text-2xl mb-4 transition-colors ${selectedPack?.id === pack.id ? "text-cyan-400" : "text-white/20 group-hover:text-white/40"}`} />
                    <span className="font-orbitron text-lg font-bold mb-1">{pack.amount}</span>
                    <span className="font-mono text-[9px] tracking-widest opacity-40 uppercase mb-4">Credits</span>
                    <div className="h-px w-8 bg-white/10 mb-4" />
                    <span className="font-mono text-xs text-cyan-400">${pack.price}</span>
                    
                    {selectedPack?.id === pack.id && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 shadow-[0_0_10px_#00f3ff]" />
                    )}
                  </button>
                ))}
              </div>

              {selectedPack && !isProcessing && (
                <div className="mt-10 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="font-orbitron text-[10px] tracking-[0.3em] uppercase text-cyan-400/60">Secure_Payment_Gateway</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  
                  <div className="max-w-sm mx-auto">
                    <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
                      <PayPalButtons
                        style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                        createOrder={handleCreateOrder}
                        onApprove={handleApprove}
                        onError={(err) => setError("PayPal synchronization failed. Please try again.")}
                      />
                    </PayPalScriptProvider>
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
        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-center gap-3">
           <FaPaypal className="text-blue-400/40 text-sm" />
           <span className="font-mono text-[8px] tracking-[0.3em] uppercase opacity-20">End-to-End Encrypted Tunnel Active</span>
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
