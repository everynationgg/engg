import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeft,
  LayoutDashboard,
  Smartphone,
  Gamepad2,
  Receipt,
  ShieldCheck,
  Download,
  ExternalLink,
  Coins,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Info,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Clock,
  Activity as ActivityIcon,
} from "lucide-react";
import { systemToast } from "@/components/common/SystemToast";
import { MARKETPLACE_APPS, type MarketplaceApp } from "@/lib/marketplaceCatalog";
import { gameCatalog } from "@/lib/gameCatalog";

type DashboardTab = "overview" | "apps" | "games" | "purchases" | "security";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  amount?: number;
  xp?: number;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const {
    user,
    token,
    logout,
    isLoggedIn,
    isInitialized,
    resendVerification,
    refreshUser,
  } = useAuth();

  // Instant auth hydration from localStorage to prevent reload race condition
  const storedToken = typeof window !== "undefined" ? localStorage.getItem("lp_auth_token") : null;
  const storedUserId = typeof window !== "undefined" ? localStorage.getItem("lp_user_id") : null;
  const storedUsername = typeof window !== "undefined" ? localStorage.getItem("lp_username") : null;
  const storedEmail = typeof window !== "undefined" ? localStorage.getItem("lp_email") : null;
  const storedIsVerified = typeof window !== "undefined" ? localStorage.getItem("lp_is_verified") === "true" : false;
  const storedCredits = typeof window !== "undefined" ? parseInt(localStorage.getItem("lp_credits") || "0", 10) : 0;
  const storedXp = typeof window !== "undefined" ? parseInt(localStorage.getItem("lp_xp") || "0", 10) : 0;
  const storedLevel = typeof window !== "undefined" ? parseInt(localStorage.getItem("lp_level") || "1", 10) : 1;

  const hasLocalAuth = Boolean(storedToken) && !Boolean(storedUserId?.startsWith("guest_"));
  const effectiveIsLoggedIn = isLoggedIn || hasLocalAuth;
  const effectiveToken = token || storedToken;
  const effectiveUsername = user?.username || storedUsername || "Operative";
  const effectiveEmail = user?.email || storedEmail || "";
  const effectiveIsVerified = user?.isVerified ?? storedIsVerified;
  const effectiveCredits = user?.credits ?? storedCredits;
  const effectiveLevel = user?.level ?? storedLevel;
  const effectiveXp = user?.xp ?? storedXp;

  // Sidebar collapsed state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("engg_dashboard_collapsed") === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("engg_dashboard_collapsed", String(next));
      }
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    stats?: { gamesPlayed?: number; gamesWon?: number; gamesLost?: number };
    activities?: Activity[];
    missions?: any[];
  } | null>(null);

  // App filter state
  const [appFilter, setAppFilter] = useState<"all" | "android" | "web">("all");
  const [showSideloadGuide, setShowSideloadGuide] = useState(false);

  // Password update form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isResendingVerify, setIsResendingVerify] = useState(false);

  // Fetch profile details with effectiveToken
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!effectiveToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setProfileData(json);
        }
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [effectiveToken]);

  const stats = profileData?.stats || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 };
  const activities = profileData?.activities || [];
  const winRate =
    (stats.gamesPlayed || 0) > 0
      ? Math.round(((stats.gamesWon || 0) / (stats.gamesPlayed || 1)) * 100)
      : 0;

  const handleDownloadApk = (app: MarketplaceApp) => {
    if (app.currentRelease?.downloadUrl) {
      systemToast(`Starting download for ${app.name} (${app.currentRelease.version})...`, "info");
      window.open(app.currentRelease.downloadUrl, "_blank");
    } else {
      systemToast("Direct download link is currently being updated.", "warning");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      systemToast("Please enter both current and new passwords.", "error");
      return;
    }
    if (newPassword.length < 6) {
      systemToast("New password must be at least 6 characters.", "error");
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      systemToast("Password must contain both letters and numbers.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      systemToast("New passwords do not match.", "error");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        systemToast("Password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        systemToast(data.error || "Failed to update password", "error");
      }
    } catch (err) {
      systemToast("An error occurred while updating password.", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerify(true);
    try {
      await resendVerification();
      systemToast("Verification email sent! Check your inbox.", "success");
    } catch (err: any) {
      systemToast(err?.message || "Failed to resend verification email.", "error");
    } finally {
      setIsResendingVerify(false);
    }
  };

  const handleSignOut = () => {
    logout();
    systemToast("Signed out successfully.", "info");
    setLocation("/login");
  };

  // If not logged in and initialization complete
  if (isInitialized && !effectiveIsLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-10 text-center shadow-xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 mb-2">
            ENGG Member Center
          </h2>
          <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
            Sign in to access your apps, download APK releases, launch web games, and manage your account credentials.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setLocation("/login")}
              className="w-full py-3 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.99] text-white font-semibold rounded-xl transition-all shadow-sm shadow-purple-600/25 cursor-pointer"
            >
              Sign In to Dashboard
            </button>
            <button
              onClick={() => setLocation("/register")}
              className="w-full py-3 px-4 bg-white hover:bg-neutral-50 text-neutral-800 font-semibold rounded-xl border border-neutral-300 transition-all cursor-pointer"
            >
              Create Member Account
            </button>
            <button
              onClick={() => setLocation("/")}
              className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              ← Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "overview", num: "01", label: "Overview", icon: LayoutDashboard },
    { id: "apps", num: "02", label: "My Apps", icon: Smartphone },
    { id: "games", num: "03", label: "My Games", icon: Gamepad2 },
    { id: "purchases", num: "04", label: "Purchases & Orders", icon: Receipt },
    { id: "security", num: "05", label: "Account & Security", icon: ShieldCheck },
  ] as const;

  const filteredApps = MARKETPLACE_APPS.filter((app) => {
    if (appFilter === "all") return true;
    if (appFilter === "android") return app.platforms.includes("android");
    if (appFilter === "web") return app.platforms.includes("web");
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col lg:flex-row antialiased font-sans">
      {/* ---------------- MOBILE TOP BAR ---------------- */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200/90 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -ml-1 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <PanelLeft className="w-5 h-5 text-neutral-700" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold tracking-tight text-neutral-900 text-base">ENGG</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-[#7c3aed] border border-purple-200/70">
              Dashboard
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-xs font-semibold text-amber-700">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>{effectiveCredits.toLocaleString()}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-xs font-bold text-white uppercase shadow-xs">
            {effectiveUsername ? effectiveUsername.charAt(0) : "U"}
          </div>
        </div>
      </div>

      {/* ---------------- MOBILE DRAWER OVERLAY ---------------- */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
            />

            {/* Sidebar Sheet */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              className="relative w-72 max-w-[85vw] bg-white border-r border-neutral-200 flex flex-col h-full z-10 shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-lg tracking-wider text-neutral-900">ENGG</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-[#7c3aed] font-bold border border-purple-200">
                    Member
                  </span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-50 text-[#7c3aed] border border-purple-200 shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? "text-[#7c3aed]" : "text-neutral-500"}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">{item.num}</span>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-neutral-200 space-y-2">
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    setLocation("/");
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Home</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- DESKTOP LEFT SIDEBAR ---------------- */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-neutral-200/90 shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out shadow-xs ${
          isSidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Brand Header */}
        <div className={`border-b border-neutral-200/80 ${isSidebarCollapsed ? "p-4" : "p-5"}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2.5 ${isSidebarCollapsed ? "hidden" : "flex"}`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c3aed] to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-xs">
                EG
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-tight text-neutral-900 leading-none">
                  EVERY NATION
                </div>
                <div className="text-[10px] tracking-wider text-neutral-500 uppercase font-mono mt-1">
                  Member Center
                </div>
              </div>
            </div>

            {/* In collapsed mode: mini logo icon */}
            {isSidebarCollapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c3aed] to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-xs mx-auto">
                EG
              </div>
            )}

            {/* The PanelLeft Toggle Button */}
            <button
              onClick={toggleSidebar}
              className={`p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer ${
                isSidebarCollapsed ? "mt-3 mx-auto block" : ""
              }`}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <PanelLeft className="w-5 h-5 text-neutral-600 hover:text-[#7c3aed] transition-colors" />
            </button>
          </div>

          {/* Quick link back (only when expanded) */}
          {!isSidebarCollapsed && (
            <button
              onClick={() => setLocation("/")}
              className="mt-3 flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-[#7c3aed] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to engg.online</span>
            </button>
          )}
        </div>

        {/* Member Profile Summary Card */}
        {!isSidebarCollapsed ? (
          <div className="p-4 mx-4 my-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7c3aed] to-indigo-600 p-0.5 shadow-xs">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#7c3aed] uppercase">
                  {effectiveUsername ? effectiveUsername.charAt(0) : "U"}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-neutral-900 truncate">
                  {effectiveUsername}
                </div>
                <div className="text-xs text-neutral-500 truncate">{effectiveEmail}</div>
              </div>
            </div>

            {/* Status & Credits Row */}
            <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5">
                {effectiveIsVerified ? (
                  <span className="inline-flex items-center text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center text-amber-700 text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertCircle className="w-3 h-3 mr-1 text-amber-600" /> Unverified
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                <Coins className="w-3 h-3 text-amber-600" />
                <span>{effectiveCredits.toLocaleString()} CR</span>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed mini avatar */
          <div className="py-4 flex flex-col items-center border-b border-neutral-200/60">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7c3aed] to-indigo-600 p-0.5 shadow-xs cursor-pointer"
              title={`${effectiveUsername} • ${effectiveCredits.toLocaleString()} Credits`}
            >
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#7c3aed] uppercase">
                {effectiveUsername ? effectiveUsername.charAt(0) : "U"}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Sidebar Toggles) */}
        <div className={`px-2 py-2 flex-1 space-y-1 ${isSidebarCollapsed ? "px-2" : "px-3"}`}>
          {!isSidebarCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center rounded-xl font-semibold transition-all group cursor-pointer relative ${
                  isSidebarCollapsed
                    ? "justify-center p-3"
                    : "justify-between px-3.5 py-2.5 text-sm"
                } ${
                  isActive
                    ? "bg-purple-50 text-[#7c3aed] border border-purple-200/80 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70 border border-transparent"
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#7c3aed]" : "text-neutral-500 group-hover:text-neutral-800"
                    }`}
                  />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </div>

                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] font-mono transition-colors ${
                      isActive ? "text-[#7c3aed] font-bold" : "text-neutral-400 group-hover:text-neutral-600"
                    }`}
                  >
                    {item.num}
                  </span>
                )}

                {/* Collapsed active indicator bar */}
                {isSidebarCollapsed && isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#7c3aed] rounded-l" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Utilities / Community Footer */}
        <div className={`border-t border-neutral-200/80 mt-auto ${isSidebarCollapsed ? "p-2 space-y-2" : "p-4 space-y-2"}`}>
          {!isSidebarCollapsed ? (
            <>
              <a
                href="https://discord.gg/engg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-all cursor-pointer group"
              >
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>ENGG Discord</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600" />
              </a>

              <button
                onClick={() => setLocation("/marketplace")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-all cursor-pointer group"
              >
                <span className="flex items-center space-x-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span>Marketplace Store</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <a
                href="https://discord.gg/engg"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                title="ENGG Discord"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setLocation("/marketplace")}
                className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-[#7c3aed] transition-colors cursor-pointer"
                title="Marketplace Store"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ---------------- MAIN CANVAS AREA ---------------- */}
      <main className="flex-1 min-w-0 bg-[#f8fafc] overflow-y-auto">
        {/* Top Header Breadcrumb Bar (Desktop) */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            {/* The PanelLeft toggle button on desktop top bar */}
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-neutral-500 hover:text-[#7c3aed] rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-neutral-400 font-mono">DASHBOARD</span>
              <span className="text-neutral-300">/</span>
              <span className="text-[#7c3aed] font-bold uppercase tracking-wider">
                {activeTab}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => refreshUser()}
              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Refresh User Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>{effectiveCredits.toLocaleString()} Credits</span>
            </div>
            <button
              onClick={() => setLocation("/marketplace")}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white transition-all shadow-xs cursor-pointer"
            >
              Explore Store →
            </button>
          </div>
        </div>

        {/* Content Stages */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Greeting & Status Banner */}
              <div className="relative rounded-3xl bg-gradient-to-r from-purple-50/80 via-white to-neutral-50 border border-purple-100 p-6 sm:p-8 shadow-xs overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100/60 border border-purple-200 text-[#7c3aed] text-xs font-mono font-bold mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>STUDIO MEMBER PORTAL</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                      Welcome back, {effectiveUsername} 👋
                    </h1>
                    <p className="text-sm text-neutral-600 mt-2 max-w-xl leading-relaxed">
                      All your Every Nation studio releases, downloadable Android APKs, and browser games ready at your fingertips.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      onClick={() => setActiveTab("apps")}
                      className="px-4 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer"
                    >
                      Browse APKs
                    </button>
                    <button
                      onClick={() => setActiveTab("games")}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold tracking-wide border border-neutral-300 transition-all cursor-pointer"
                    >
                      Play Games
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveTab("apps")}
                  className="rounded-2xl bg-white border border-neutral-200/80 p-5 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                      Apps in Catalog
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Smartphone className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-neutral-900 mb-1">
                    {MARKETPLACE_APPS.length} Released
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center space-x-1">
                    <span>Android APKs & Web tools</span>
                    <ChevronRight className="w-3 h-3 text-[#7c3aed] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("games")}
                  className="rounded-2xl bg-white border border-neutral-200/80 p-5 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                      Playable Games
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-neutral-900 mb-1">
                    {gameCatalog.length} Live
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center space-x-1">
                    <span>Instant browser play</span>
                    <ChevronRight className="w-3 h-3 text-[#7c3aed] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div
                  onClick={() => setLocation("/shop")}
                  className="rounded-2xl bg-white border border-neutral-200/80 p-5 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                      ENGG Credits
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-600 mb-1">
                    {effectiveCredits.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center space-x-1">
                    <span>Level {effectiveLevel} • {effectiveXp} XP</span>
                    <ChevronRight className="w-3 h-3 text-[#7c3aed] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Spotlight Row: Game & Mobile App */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spotlight: Errant Night Game */}
                <div className="rounded-2xl bg-white border border-neutral-200/80 p-6 flex flex-col justify-between hover:border-purple-300 hover:shadow-sm transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-700 font-bold px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200">
                        Continue Playing
                      </span>
                      <span className="text-xs text-neutral-500">Web Build • Live</span>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                        <img
                          src="/ERRANT.png"
                          alt="Errant Night"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#7c3aed] transition-colors">
                          Errant Night
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Neural Defense Protocol & Network Simulator
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed mb-6">
                      Engage tactical real-time defense against neural incursions. Trace anomalies and defend the network with your operative squad.
                    </p>
                  </div>

                  <a
                    href="https://errant-night-yogs-projects-cee6471c.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Launch in Browser</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Spotlight: Errant Night Mobile APK */}
                <div className="rounded-2xl bg-white border border-neutral-200/80 p-6 flex flex-col justify-between hover:border-purple-300 hover:shadow-sm transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-purple-700 font-bold px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
                        Mobile Release
                      </span>
                      <span className="text-xs text-neutral-500">Android APK • v1.3.4</span>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7c3aed] shrink-0">
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#7c3aed] transition-colors">
                          Errant Night Mobile APK
                        </h3>
                        <p className="text-xs text-neutral-500">
                          48.2 MB • Low latency WebGL renderer
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed mb-6">
                      Touch-optimized radar sweep, haptic feedback triggers, and zero-dropout WebSocket lobby synchronization.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownloadApk(MARKETPLACE_APPS[0])}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.99] text-white text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Android APK (48.2 MB)</span>
                    </button>

                    <button
                      onClick={() => setShowSideloadGuide(!showSideloadGuide)}
                      className="w-full py-1.5 text-[11px] text-neutral-500 hover:text-neutral-900 text-center transition-colors cursor-pointer"
                    >
                      {showSideloadGuide ? "Hide Sideloading Guide ▲" : "How to install APK on Android ▼"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sideload Guide Accordion */}
              {showSideloadGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl bg-purple-50/50 border border-purple-200/80 p-6 space-y-4"
                >
                  <div className="flex items-center space-x-2 text-purple-900 font-bold text-sm">
                    <Info className="w-4 h-4 text-[#7c3aed]" />
                    <span>Android APK Installation (Sideloading) Guide</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-700">
                    <div className="p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs">
                      <div className="font-bold text-neutral-900 mb-1">1. Download APK</div>
                      <p className="text-neutral-500">
                        Tap Download APK above. Save the file to your Android Downloads folder.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs">
                      <div className="font-bold text-neutral-900 mb-1">2. Allow Unknown Apps</div>
                      <p className="text-neutral-500">
                        If prompted by Android, go to Settings → Security → toggle "Allow from this source".
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-neutral-200/80 shadow-xs">
                      <div className="font-bold text-neutral-900 mb-1">3. Install & Launch</div>
                      <p className="text-neutral-500">
                        Open the downloaded APK and tap "Install". The icon will appear on your home screen.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Recent Activity Mini Ledger */}
              <div className="rounded-2xl bg-white border border-neutral-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ActivityIcon className="w-4 h-4 text-[#7c3aed]" />
                    <h3 className="text-base font-bold text-neutral-900">Recent Activity</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("purchases")}
                    className="text-xs font-semibold text-[#7c3aed] hover:text-[#6d28d9] cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {activities.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {activities.slice(0, 5).map((act) => (
                      <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-neutral-800">{act.description}</div>
                          <div className="text-[11px] text-neutral-400">
                            {new Date(act.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        {act.amount !== undefined && (
                          <div
                            className={`font-mono font-bold ${
                              act.amount >= 0 ? "text-emerald-600" : "text-neutral-600"
                            }`}
                          >
                            {act.amount >= 0 ? `+${act.amount}` : act.amount} CR
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No recent activity recorded yet. Explore games and marketplace apps to get started!
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: MY APPS */}
          {activeTab === "apps" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                    Apps & APK Library
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Official Every Nation mobile releases, Android sideload packages, and web companion tools.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-white border border-neutral-200 self-start sm:self-auto shadow-xs">
                  {(["all", "android", "web"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAppFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        appFilter === filter
                          ? "bg-[#7c3aed] text-white shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      {filter === "all" ? "All Apps" : filter === "android" ? "Android APKs" : "Web Apps"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sideload Banner */}
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-start space-x-3 text-xs text-purple-900">
                <Info className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Direct Android Sideloading:</span>{" "}
                  Download the official APK file directly to your Android device. Enable "Install Unknown Apps" in your device settings if prompted.
                </div>
              </div>

              {/* Apps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-2xl bg-white border border-neutral-200/80 p-6 flex flex-col justify-between hover:border-purple-300 hover:shadow-sm transition-all shadow-xs"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7c3aed] border border-purple-200">
                          {app.badge}
                        </span>
                        <span className="text-xs font-mono text-neutral-400">
                          {app.currentRelease.version}
                        </span>
                      </div>

                      {/* App Identity */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {app.icon ? (
                            <img
                              src={app.icon}
                              alt={app.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Smartphone className="w-8 h-8 text-[#7c3aed]" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900">{app.name}</h3>
                          <p className="text-xs text-[#7c3aed] font-medium">{app.tagline}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            {app.platforms.map((p) => (
                              <span
                                key={p}
                                className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200"
                              >
                                {p}
                              </span>
                            ))}
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {app.currentRelease.apkSize}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                        {app.description}
                      </p>

                      {/* Highlights */}
                      <div className="space-y-1.5 mb-6">
                        <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                          What's New in {app.currentRelease.version}:
                        </div>
                        <ul className="text-xs text-neutral-500 space-y-1 list-disc list-inside">
                          {app.currentRelease.whatsNew.slice(0, 3).map((feat, i) => (
                            <li key={i} className="truncate">{feat}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-neutral-100 flex items-center space-x-3">
                      {app.currentRelease.downloadUrl && (
                        <button
                          onClick={() => handleDownloadApk(app)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download APK</span>
                        </button>
                      )}

                      {app.currentRelease.demoUrl && (
                        <a
                          href={app.currentRelease.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-neutral-300 transition-all cursor-pointer"
                        >
                          <span>Web App</span>
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: MY GAMES */}
          {activeTab === "games" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                  Game Library
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  High-stakes tactical, network defense, and sci-fi titles playable instantly in your browser.
                </p>
              </div>

              {/* Game Stats Ribbon */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-white border border-neutral-200/80 text-center shadow-xs">
                <div>
                  <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">Games Played</div>
                  <div className="text-xl font-black text-neutral-900 mt-0.5">{stats.gamesPlayed || 0}</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">Victories</div>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">{stats.gamesWon || 0}</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">Win Rate</div>
                  <div className="text-xl font-black text-[#7c3aed] mt-0.5">{winRate}%</div>
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {gameCatalog.map((game) => (
                  <div
                    key={game.slug}
                    className="rounded-2xl bg-white border border-neutral-200/80 overflow-hidden flex flex-col justify-between hover:border-purple-300 hover:shadow-sm transition-all shadow-xs group"
                  >
                    <div>
                      {/* Game Banner Image */}
                      <div className="relative h-44 bg-neutral-900 overflow-hidden">
                        <img
                          src={game.image}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <span className="absolute top-3 right-3 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/90 text-emerald-700 font-bold border border-emerald-200 shadow-xs">
                          {game.status}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#7c3aed] transition-colors">
                          {game.title}
                        </h3>
                        <p className="text-xs text-[#7c3aed] font-semibold mb-3">
                          {game.subtitle}
                        </p>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      {game.status === "online" && game.href ? (
                        <a
                          href={game.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                        >
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span>Launch Game</span>
                          <ExternalLink className="w-3 h-3 text-purple-200 ml-1" />
                        </a>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 text-neutral-400 text-xs font-semibold flex items-center justify-center space-x-2 border border-neutral-200 cursor-not-allowed"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Coming Soon</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: PURCHASES & ORDERS */}
          {activeTab === "purchases" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                    Purchases & Orders
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Your complete ledger of marketplace acquisitions, credit transactions, and license keys.
                  </p>
                </div>
                <button
                  onClick={() => setLocation("/marketplace")}
                  className="px-4 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  Visit Store
                </button>
              </div>

              {activities.length > 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200/80 overflow-hidden shadow-xs">
                  <div className="divide-y divide-neutral-100">
                    {activities.map((act) => (
                      <div key={act.id} className="p-4 sm:p-5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900">{act.description}</div>
                            <div className="text-[11px] text-neutral-400 font-mono flex items-center space-x-2 mt-0.5">
                              <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="uppercase text-[#7c3aed] font-bold">{act.type}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {act.amount !== undefined && (
                            <div
                              className={`font-mono font-bold ${
                                act.amount >= 0 ? "text-emerald-600" : "text-neutral-700"
                              }`}
                            >
                              {act.amount >= 0 ? `+${act.amount}` : act.amount} CR
                            </div>
                          )}
                          <span className="text-[10px] text-emerald-600 font-semibold">Completed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white border border-neutral-200/80 p-12 text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">No Transactions Yet</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                      You haven't made any purchases or credit expenditures yet. Check out available items in our store!
                    </p>
                  </div>
                  <button
                    onClick={() => setLocation("/marketplace")}
                    className="px-4 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    Explore Marketplace
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: ACCOUNT & SECURITY */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                  Account & Security
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Manage your credentials, update your login password, and configure studio security.
                </p>
              </div>

              {/* Profile Details Card */}
              <div className="rounded-2xl bg-white border border-neutral-200/80 p-6 space-y-6 shadow-xs">
                <div className="flex items-center space-x-2 text-neutral-900 font-bold text-base">
                  <ShieldCheck className="w-5 h-5 text-[#7c3aed]" />
                  <span>Member Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70">
                    <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">Username</div>
                    <div className="text-sm font-bold text-neutral-900 mt-1">{effectiveUsername}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70">
                    <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">Email Address</div>
                    <div className="text-sm font-bold text-neutral-900 mt-1 truncate">{effectiveEmail || "—"}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70">
                    <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">Account Tier</div>
                    <div className="text-sm font-bold text-[#7c3aed] mt-1">
                      Studio Member (Level {effectiveLevel})
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">Email Verification</div>
                      <div className="text-sm font-bold mt-1">
                        {effectiveIsVerified ? (
                          <span className="text-emerald-600 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Unverified
                          </span>
                        )}
                      </div>
                    </div>
                    {!effectiveIsVerified && (
                      <button
                        onClick={handleResendVerification}
                        disabled={isResendingVerify}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isResendingVerify ? "Sending..." : "Resend Link"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="rounded-2xl bg-white border border-neutral-200/80 p-6 space-y-6 shadow-xs">
                <div>
                  <div className="flex items-center space-x-2 text-neutral-900 font-bold text-base">
                    <Lock className="w-5 h-5 text-[#7c3aed]" />
                    <span>Change Password</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Your password must be at least 6 characters and contain letters and numbers.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7c3aed] transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7c3aed] transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#7c3aed] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="py-2.5 px-6 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.99] text-white text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </div>

              {/* Connected Services / Discord */}
              <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-neutral-900 text-sm">ENGG Operatives Discord</div>
                  <p className="text-xs text-neutral-600 mt-1">
                    Connect with fellow players, share feedback on new APK builds, and participate in tournaments.
                  </p>
                </div>
                <a
                  href="https://discord.gg/engg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Join Discord Community</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl bg-red-50/40 border border-red-200/70 p-6 space-y-4">
                <div>
                  <div className="font-bold text-red-600 text-sm">Danger Zone</div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Actions that affect your current active session across all devices.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs font-semibold text-neutral-800">Sign Out All Sessions</div>
                    <div className="text-[11px] text-neutral-500">Terminates your current access tokens.</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 text-xs font-semibold border border-red-200 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
