import { useState, useEffect } from "react";
import { FaGift } from "react-icons/fa";
import { useLocation } from "wouter";
import TacticalSlate from "@/components/common/TacticalSlate";
import { SciFiButton } from "@/components/common/SciFiButton";
import { systemToast } from "@/components/common/SystemToast";
import { useAuth } from "@/hooks/useAuth";
import PortalDeck from "@/components/hub/PortalDeck";
import { gameCatalog } from "@/lib/gameCatalog";

const STORAGE_KEY_LAST_DAILY = "lp_last_daily_claim";

export default function Hub() {
  const { token, refreshUser, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(STORAGE_KEY_LAST_DAILY);
    if (!saved) return false;
    const hoursSince = (Date.now() - new Date(saved).getTime()) / (1000 * 60 * 60);
    return hoursSince < 24;
  });
  const [motionProfile, setMotionProfile] = useState<"reduced" | "mobile" | "desktop" | null>(() => {
    if (typeof window === "undefined") return null;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return "reduced";
    const isMobileDevice =
      window.innerWidth < 1024 || "ontouchstart" in window || navigator.maxTouchPoints > 0;
    return isMobileDevice ? "mobile" : "desktop";
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastWidth = window.innerWidth;

    const handleUpdate = (force = false) => {
      const currentWidth = window.innerWidth;
      if (!force && currentWidth === lastWidth) return;
      lastWidth = currentWidth;

      if (mediaQuery.matches) {
        setMotionProfile("reduced");
      } else {
        const isMobileDevice =
          currentWidth < 1024 || "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setMotionProfile(isMobileDevice ? "mobile" : "desktop");
      }
    };

    handleUpdate(true);

    const mediaChangeListener = () => {
      if (mediaQuery.matches) {
        setMotionProfile("reduced");
      } else {
        const isMobileDevice =
          window.innerWidth < 1024 || "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setMotionProfile(isMobileDevice ? "mobile" : "desktop");
      }
    };

    const handleResize = () => {
      handleUpdate(false);
    };

    mediaQuery.addEventListener("change", mediaChangeListener);
    window.addEventListener("resize", handleResize);
    return () => {
      mediaQuery.removeEventListener("change", mediaChangeListener);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (token && !token.startsWith("dev_")) {
      fetch(`${import.meta.env.VITE_API_URL || ""}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const claimTimestamp =
            data.user?.lastDailyClaim ||
            data.user?.lastClaimedAt ||
            data.lastDailyClaim ||
            data.lastClaimedAt;
          if (claimTimestamp) {
            const hoursSince =
              (Date.now() - new Date(claimTimestamp).getTime()) / (1000 * 60 * 60);
            if (hoursSince < 24) {
              localStorage.setItem(STORAGE_KEY_LAST_DAILY, claimTimestamp);
              setClaimed(true);
            }
          } else if (Array.isArray(data.activities)) {
            const lastDaily = data.activities.find(
              (a: { description?: string }) =>
                a.description?.includes("Daily Login Reward") ||
                a.description?.includes("Daily_Tactical_Sync") ||
                a.description?.includes("Daily_Sync_Success")
            );
            if (lastDaily?.timestamp) {
              const hoursSince =
                (Date.now() - new Date(lastDaily.timestamp).getTime()) / (1000 * 60 * 60);
              if (hoursSince < 24) {
                localStorage.setItem(STORAGE_KEY_LAST_DAILY, lastDaily.timestamp);
                setClaimed(true);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleClaim = async () => {
    if (claimed || claiming) return;
    if (!token || !isLoggedIn) {
      systemToast("Please sign in to claim your daily reward.", "warning");
      setLocation("/login");
      return;
    }

    if (token.startsWith("dev_")) {
      const nowIso = new Date().toISOString();
      const prevCredits = parseInt(localStorage.getItem("lp_credits") || "0", 10);
      const prevXp = parseInt(localStorage.getItem("lp_xp") || "0", 10);
      const nextCredits = prevCredits + 50;
      const nextXp = prevXp + 25;
      const nextLevel = Math.floor(nextXp / 500) + 1;
      localStorage.setItem("lp_credits", String(nextCredits));
      localStorage.setItem("lp_xp", String(nextXp));
      localStorage.setItem("lp_level", String(nextLevel));
      localStorage.setItem(STORAGE_KEY_LAST_DAILY, nowIso);
      setClaimed(true);
      await refreshUser();
      systemToast("Daily reward claimed! +50 Credits & +25 XP", "success");
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/user/claim-daily`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const claimedAt = data.lastDailyClaim || new Date().toISOString();
        localStorage.setItem(STORAGE_KEY_LAST_DAILY, claimedAt);
        if (typeof data.credits === "number") {
          localStorage.setItem("lp_credits", String(data.credits));
        }
        if (typeof data.xp === "number") {
          localStorage.setItem("lp_xp", String(data.xp));
        }
        if (typeof data.level === "number") {
          localStorage.setItem("lp_level", String(data.level));
        }
        setClaimed(true);
        await refreshUser();
        systemToast("Daily reward claimed! +50 Credits & +25 XP", "success");
      } else if (res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        setClaimed(true);
        systemToast(errData.error || "Daily reward already claimed today.", "info");
      } else if (res.status === 401) {
        systemToast("Your session expired. Please sign in again.", "warning");
        setLocation("/login");
      } else {
        const errData = await res.json().catch(() => ({}));
        systemToast(
          errData.error || "Unable to claim daily reward right now. Please try again shortly.",
          "error"
        );
      }
    } catch {
      systemToast("Network error while claiming daily reward. Please check your connection.", "error");
    } finally {
      setClaiming(false);
    }
  };

  const games = gameCatalog;

  return (
    <div className="h-[100dvh] pt-[64px] sm:pt-[76px] lg:pt-[88px] relative flex flex-col items-center overflow-hidden bg-[#020408] selection:bg-cyan-500/30 w-full select-none">
      {/* Main Content Area */}
      <main className="relative z-20 w-full max-w-[1400px] px-3 sm:px-6 md:px-12 xl:px-16 flex-1 flex flex-col items-center min-h-0 overflow-hidden pb-3 sm:pb-4">
        <div className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
          {/* Daily Login Reward */}
          {isLoggedIn && !claimed && (
            <div className="relative z-30 shrink-0 mb-2 sm:mb-4 w-full max-w-2xl mx-auto">
              <TacticalSlate>
                <div className="p-2.5 sm:p-4 flex flex-row items-center justify-between gap-3 sm:gap-6">
                  <div className="flex items-center gap-2.5 sm:gap-4 text-left min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border border-cyan-500/20 flex items-center justify-center relative shrink-0 rounded-lg">
                      <div className="absolute inset-0 bg-cyan-400/5" />
                      <FaGift className="text-cyan-400 text-sm sm:text-lg" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h3 className="font-orbitron text-[11px] sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white truncate">
                        Daily Login Reward
                      </h3>
                      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.2em] text-white/55 truncate">
                        +50 Credits &amp; +25 XP
                      </span>
                    </div>
                  </div>

                  <SciFiButton
                    variant={claimed ? "ghost" : "primary"}
                    disabled={claimed || claiming}
                    onClick={handleClaim}
                    className="shrink-0 px-3 sm:px-5 h-8 sm:h-10 text-[10px] sm:text-xs"
                  >
                    {claiming ? "Claiming..." : "Claim +50"}
                  </SciFiButton>
                </div>
              </TacticalSlate>
            </div>
          )}

          {/* Main Game Deck */}
          <div className="relative z-10 w-full flex-1 min-h-0 flex flex-col">
            <PortalDeck games={games} motionProfile={motionProfile} />
          </div>
        </div>
      </main>
    </div>
  );
}
