import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaShieldAlt, FaLock, FaBolt, FaCoins, FaCheckCircle } from "react-icons/fa";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";

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
    name: "Starter Pack",
    amount: 250,
    price: "4.99",
    currency: "USD",
    rarity: "common",
  },
  {
    id: "pack_500",
    name: "Standard Pack",
    amount: 500,
    price: "8.99",
    currency: "USD",
    bonus: "+50 Bonus",
    rarity: "rare",
  },
  {
    id: "pack_1000",
    name: "Pro Pack",
    amount: 1000,
    price: "15.99",
    currency: "USD",
    bonus: "+150 Bonus",
    rarity: "epic",
  },
  {
    id: "pack_2500",
    name: "Founder Pack",
    amount: 2500,
    price: "34.99",
    currency: "USD",
    bonus: "+500 Bonus",
    rarity: "legendary",
  },
];

const RARITY_CONFIG = {
  common: { accent: "text-sky-600 bg-sky-50 border-sky-200", ring: "border-sky-500", label: "Starter" },
  rare: { accent: "text-[#7c3aed] bg-purple-50 border-purple-200", ring: "border-[#7c3aed]", label: "Popular" },
  epic: { accent: "text-amber-600 bg-amber-50 border-amber-200", ring: "border-amber-500", label: "Best Value" },
  legendary: { accent: "text-rose-600 bg-rose-50 border-rose-200", ring: "border-rose-500", label: "Founder" },
};

export default function Shop() {
  const { isLoggedIn, token, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successCredits, setSuccessCredits] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const [packs, setPacks] = useState<Pack[]>(FALLBACK_PACKS);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(FALLBACK_PACKS[2]);
  const [checkoutMode, setCheckoutMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = new URL(
      `${import.meta.env.VITE_API_URL || ""}/api/shop/config`,
      window.location.origin
    );

    fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.packs && data.packs.length > 0) {
          setPacks(data.packs);
          const defaultPackId = data.isFirstPurchase ? "pack_1000" : "pack_2500";
          const defaultPack =
            data.packs.find((p: Pack) => p.id === defaultPackId) || data.packs[1];
          setSelectedPack(defaultPack);
        } else {
          setPacks(FALLBACK_PACKS);
          setSelectedPack(FALLBACK_PACKS[2]);
        }
      })
      .catch(() => {
        setPacks(FALLBACK_PACKS);
        setSelectedPack(FALLBACK_PACKS[2]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handlePackSelect = (pack: Pack) => {
    setSelectedPack(pack);
    setCheckoutMode(false);
    setError(null);
  };

  const handleCreateOrder = async () => {
    if (!selectedPack) return "";
    if (!isLoggedIn) {
      setError("Please sign in to purchase credits.");
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
        }
      );
      const order = await response.json();
      if (!response.ok) {
        setError(order.error || "Unable to create order. Please try again.");
        return "";
      }
      return order.id;
    } catch {
      setError("Network error while connecting to checkout.");
      return "";
    }
  };

  const handleApprove = async (data: { orderID: string }) => {
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
        }
      );
      const captureData = await response.json();
      if (captureData.success) {
        setSuccessCredits(captureData.credits);
        refreshUser();
        setCheckoutMode(false);
      } else {
        setError(captureData.error || "Payment could not be completed.");
      }
    } catch {
      setError("Payment verification failed. Please contact support if you were charged.");
    }
  };

  return (
    <StudioLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-xs font-bold uppercase tracking-wider mb-3">
            <FaCoins className="text-amber-500" />
            <span>Every Nation Credit Store</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-3">
            Studio &amp; Game Credits
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Top up your Every Nation account credits for cosmetics, custom lobby perks, and supporter badges across our games.
          </p>
        </div>

        {/* First-Time Bonus Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center shrink-0">
              <FaBolt className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-neutral-900">
                First-Purchase 2X Credit Bonus
              </div>
              <div className="text-xs text-neutral-600">
                Receive double credits automatically on your first credit pack purchase.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500 font-semibold">
            <span className="inline-flex items-center gap-1">
              <FaShieldAlt className="text-emerald-600" /> Secure Checkout
            </span>
            <span className="inline-flex items-center gap-1">
              <FaLock className="text-neutral-400" /> Instant Delivery
            </span>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {successCredits && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <FaCheckCircle className="text-emerald-600 shrink-0" />
            <span>
              Purchase complete! Your balance has been updated ({successCredits.toLocaleString()} Credits).
            </span>
          </div>
        )}

        {/* Pack Cards */}
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-500">
            Loading credit packs...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {packs.map((pack) => {
              const isSelected = selectedPack?.id === pack.id;
              const config = RARITY_CONFIG[pack.rarity] || RARITY_CONFIG.common;
              const totalCredits = pack.hasBonus ? pack.amount * 2 : pack.amount;

              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handlePackSelect(pack)}
                  className={`text-left rounded-3xl p-6 transition-all flex flex-col justify-between cursor-pointer bg-white border-2 ${
                    isSelected
                      ? `${config.ring} shadow-xl -translate-y-1`
                      : "border-neutral-200/90 hover:border-neutral-300 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.accent}`}
                      >
                        {config.label}
                      </span>
                      {pack.hasBonus && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          2X Bonus
                        </span>
                      )}
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] border border-neutral-200 flex items-center justify-center mb-5 mx-auto">
                      <FaCoins className="w-8 h-8 text-amber-500" />
                    </div>

                    <h3 className="text-lg font-extrabold text-neutral-900 text-center mb-1">
                      {pack.name}
                    </h3>
                    <div className="text-center mb-6">
                      <span className="text-2xl font-black text-[#7c3aed]">
                        {totalCredits.toLocaleString()}
                      </span>{" "}
                      <span className="text-xs font-bold text-neutral-500 uppercase">
                        Credits
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500">Price</span>
                    <span className="text-lg font-black text-neutral-900">${pack.price}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Pack Checkout Summary */}
        {selectedPack && (
          <div className="bg-[#f5f5f7] rounded-3xl p-6 sm:p-8 border border-neutral-200/90 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed]">
                  Selected Pack
                </span>
                <h2 className="text-2xl font-extrabold text-neutral-900">
                  {selectedPack.name}
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl font-black text-neutral-900">
                  ${selectedPack.price} <span className="text-xs font-normal text-neutral-500">USD</span>
                </div>
                <div className="text-xs font-bold text-[#7c3aed]">
                  {(selectedPack.hasBonus
                    ? selectedPack.amount * 2
                    : selectedPack.amount
                  ).toLocaleString()}{" "}
                  Credits Total
                </div>
              </div>
            </div>

            {checkoutMode ? (
              <div className="pt-6 space-y-4">
                <div className="max-w-sm mx-auto">
                  <PayPalScriptProvider
                    options={{
                      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb",
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "rect",
                        label: "pay",
                        height: 42,
                      }}
                      createOrder={handleCreateOrder}
                      onApprove={handleApprove}
                    />
                  </PayPalScriptProvider>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setCheckoutMode(false)}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 cursor-pointer"
                  >
                    Cancel Checkout
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-neutral-600">
                  {isLoggedIn
                    ? "Credits are added to your account immediately after payment confirmation."
                    : "Please sign in to your Every Nation account before purchasing credits."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (isLoggedIn) {
                      setCheckoutMode(true);
                    } else {
                      setLocation("/login");
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                  {isLoggedIn ? `Continue to Checkout ($${selectedPack.price})` : "Sign In to Purchase"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </StudioLayout>
  );
}
