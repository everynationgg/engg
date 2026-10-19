import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Trophy,
  Activity as ActivityIcon,
  HelpCircle,
  Clock,
  Terminal,
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

  // Fetch profile details
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
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
  }, [token]);

  const stats = profileData?.stats || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 };
  const activities = profileData?.activities || [];
  const winRate =
    (stats.gamesPlayed || 0) > 0
      ? Math.round(((stats.gamesWon || 0) / (stats.gamesPlayed || 1)) * 100)
      : 0;

  // Sideload guide toggle
  const handleDownloadApk = (app: MarketplaceApp) => {
    if (app.currentRelease?.downloadUrl) {
      systemToast(`Starting download for ${app.name} (${app.currentRelease.version})...`, "info");
      window.open(app.currentRelease.downloadUrl, "_blank");
    } else {
      systemToast("Direct download link is currently being updated.", "warning");
    }
  };

  // Password change handler
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
          Authorization: `Bearer ${token}`,
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

  // Resend verification email
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

  // Sign out
  const handleSignOut = () => {
    logout();
    systemToast("Signed out successfully.", "info");
    setLocation("/login");
  };

  // If not logged in and initialization complete
  if (isInitialized && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0b0e17] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#131926] border border-[#1f293d] rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-900/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            ENGG Member Center
          </h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Sign in to access your apps, download APK releases, launch web games, and manage your account credentials.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setLocation("/login")}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-600/25 cursor-pointer"
            >
              Sign In to Dashboard
            </button>
            <button
              onClick={() => setLocation("/register")}
              className="w-full py-3 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-medium rounded-xl border border-slate-700/60 transition-all cursor-pointer"
            >
              Create Member Account
            </button>
            <button
              onClick={() => setLocation("/")}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
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
    <div className="min-h-screen bg-[#0b0e17] text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* ---------------- MOBILE TOP BAR ---------------- */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-[#0e1320] border-b border-[#1f293d] sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg bg-[#141b2c] border border-[#232e44] cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold tracking-tight text-white text-base">ENGG</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Dashboard
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#141b2c] border border-[#232e44] text-xs font-medium text-amber-400">
            <Coins className="w-3.5 h-3.5" />
            <span>{(user?.credits ?? 0).toLocaleString()}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase border border-purple-400/40">
            {user?.username ? user.username.charAt(0) : "U"}
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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Sidebar Sheet */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              className="relative w-72 max-w-[85vw] bg-[#0e1320] border-r border-[#1f293d] flex flex-col h-full z-10 shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#1f293d] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-lg tracking-wider text-white">ENGG</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                    Member
                  </span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 cursor-pointer"
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
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-[#141b2c]"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{item.num}</span>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#1f293d] space-y-2">
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    setLocation("/");
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#141b2c] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Home</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
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
      <aside className="hidden lg:flex w-72 flex-col bg-[#0e1320] border-r border-[#1f293d] shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1f293d]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-purple-900/30">
                EG
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight text-white leading-none">
                  EVERY NATION
                </div>
                <div className="text-[10px] tracking-widest text-slate-400 uppercase font-mono mt-1">
                  Member Center
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live
            </span>
          </div>

          {/* Quick link back */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-purple-400 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to engg.online</span>
          </button>
        </div>

        {/* Member Profile Summary Card */}
        <div className="p-4 mx-4 my-4 rounded-xl bg-[#141b2c] border border-[#232e44]">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-[#0e1320] flex items-center justify-center text-sm font-bold text-white uppercase">
                {user?.username ? user.username.charAt(0) : "U"}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-white truncate">
                {user?.username || "Operative"}
              </div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>

          {/* Status & Credits Row */}
          <div className="pt-2 border-t border-[#1f293d] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5">
              {user?.isVerified ? (
                <span className="inline-flex items-center text-emerald-400 text-[11px] font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center text-amber-400 text-[11px] font-medium">
                  <AlertCircle className="w-3 h-3 mr-1" /> Unverified
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 font-mono font-medium text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{(user?.credits ?? 0).toLocaleString()} CR</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Sidebar Toggles) */}
        <div className="px-3 py-2 flex-1 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Dashboard Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600/25 to-purple-500/10 text-white border-l-4 border-purple-500 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-[#141b2c] border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-purple-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isActive ? "text-purple-400 font-semibold" : "text-slate-500 group-hover:text-slate-400"
                  }`}
                >
                  {item.num}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Utilities / Community Footer */}
        <div className="p-4 border-t border-[#1f293d] space-y-2 mt-auto">
          <a
            href="https://discord.gg/engg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#141b2c] hover:bg-[#192238] border border-[#232e44] text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>ENGG Discord</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
          </a>

          <button
            onClick={() => setLocation("/marketplace")}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#141b2c] hover:bg-[#192238] border border-[#232e44] text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer group"
          >
            <span className="flex items-center space-x-2">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
              <span>Marketplace Store</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CANVAS AREA ---------------- */}
      <main className="flex-1 min-w-0 bg-[#0b0e17] overflow-y-auto">
        {/* Top Header Breadcrumb Bar (Desktop) */}
        <div className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-[#1f293d]/80 bg-[#0b0e17]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-mono">DASHBOARD</span>
            <span className="text-slate-600">/</span>
            <span className="text-purple-400 font-semibold uppercase tracking-wider">
              {activeTab}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => refreshUser()}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
              title="Refresh User Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#141b2c] border border-[#232e44] text-xs font-semibold text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{(user?.credits ?? 0).toLocaleString()} Credits</span>
            </div>
            <button
              onClick={() => setLocation("/marketplace")}
              className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm shadow-purple-900/30 cursor-pointer"
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
              <div className="relative rounded-2xl bg-gradient-to-r from-[#17132e] via-[#131926] to-[#0f1422] border border-[#28254b] p-6 sm:p-8 overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono font-medium mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>STUDIO MEMBER PORTAL</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Welcome back, {user?.username || "Operative"} 👋
                    </h1>
                    <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
                      All your Every Nation studio releases, downloadable Android APKs, and browser games ready at your fingertips.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      onClick={() => setActiveTab("apps")}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-purple-900/30 cursor-pointer"
                    >
                      Browse APKs
                    </button>
                    <button
                      onClick={() => setActiveTab("games")}
                      className="px-4 py-2.5 rounded-xl bg-[#1e273d] hover:bg-[#25324e] text-slate-200 text-xs font-semibold tracking-wide border border-[#2e3e60] transition-all cursor-pointer"
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
                  className="rounded-xl bg-[#131926] border border-[#1f293d] p-5 hover:border-purple-500/40 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Apps in Catalog
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Smartphone className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white mb-1">
                    {MARKETPLACE_APPS.length} Released
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <span>Android APKs & Web tools</span>
                    <ChevronRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("games")}
                  className="rounded-xl bg-[#131926] border border-[#1f293d] p-5 hover:border-purple-500/40 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Playable Games
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white mb-1">
                    {gameCatalog.length} Live
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <span>Instant browser play</span>
                    <ChevronRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div
                  onClick={() => setLocation("/shop")}
                  className="rounded-xl bg-[#131926] border border-[#1f293d] p-5 hover:border-purple-500/40 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      ENGG Credits
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-400 mb-1">
                    {(user?.credits ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <span>Level {user?.level ?? 1} • {user?.xp ?? 0} XP</span>
                    <ChevronRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Spotlight Row: Game & Mobile App */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spotlight: Errant Night Game */}
                <div className="rounded-2xl bg-[#131926] border border-[#1f293d] p-6 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                        Continue Playing
                      </span>
                      <span className="text-xs text-slate-400">Web Build • Live</span>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-800 border border-cyan-500/30 overflow-hidden shrink-0">
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
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          Errant Night
                        </h3>
                        <p className="text-xs text-slate-400">
                          Neural Defense Protocol & Network Simulator
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-6">
                      Engage tactical real-time defense against neural incursions. Trace anomalies and defend the network with your operative squad.
                    </p>
                  </div>

                  <a
                    href="https://errant-night-yogs-projects-cee6471c.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-950 cursor-pointer"
                  >
                    <span>Launch in Browser</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Spotlight: Errant Night Mobile APK */}
                <div className="rounded-2xl bg-[#131926] border border-[#1f293d] p-6 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-purple-300 font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                        Mobile Release
                      </span>
                      <span className="text-xs text-slate-400">Android APK • v1.3.4</span>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                          Errant Night Mobile APK
                        </h3>
                        <p className="text-xs text-slate-400">
                          48.2 MB • Low latency WebGL renderer
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-6">
                      Touch-optimized radar sweep, haptic feedback triggers, and zero-dropout WebSocket lobby synchronization.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownloadApk(MARKETPLACE_APPS[0])}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all shadow-md shadow-purple-950 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Android APK (48.2 MB)</span>
                    </button>

                    <button
                      onClick={() => setShowSideloadGuide(!showSideloadGuide)}
                      className="w-full py-1.5 text-[11px] text-slate-400 hover:text-slate-200 text-center transition-colors cursor-pointer"
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
                  className="rounded-2xl bg-[#0e1320] border border-purple-500/30 p-6 space-y-4"
                >
                  <div className="flex items-center space-x-2 text-purple-300 font-semibold text-sm">
                    <Info className="w-4 h-4" />
                    <span>Android APK Installation (Sideloading) Guide</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                    <div className="p-3 rounded-xl bg-[#141b2c] border border-[#232e44]">
                      <div className="font-bold text-white mb-1">1. Download APK</div>
                      <p className="text-slate-400">
                        Tap Download APK above. Save the file to your Android Downloads folder.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#141b2c] border border-[#232e44]">
                      <div className="font-bold text-white mb-1">2. Allow Unknown Apps</div>
                      <p className="text-slate-400">
                        If prompted by Android, go to Settings → Security → toggle "Allow from this source" for Chrome or Files.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#141b2c] border border-[#232e44]">
                      <div className="font-bold text-white mb-1">3. Install & Launch</div>
                      <p className="text-slate-400">
                        Open the downloaded APK and tap "Install". The game icon will appear on your home screen.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Recent Activity Mini Ledger */}
              <div className="rounded-2xl bg-[#131926] border border-[#1f293d] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ActivityIcon className="w-4 h-4 text-purple-400" />
                    <h3 className="text-base font-bold text-white">Recent Activity</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("purchases")}
                    className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {activities.length > 0 ? (
                  <div className="divide-y divide-[#1f293d]">
                    {activities.slice(0, 5).map((act) => (
                      <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-medium text-slate-200">{act.description}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(act.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        {act.amount !== undefined && (
                          <div
                            className={`font-mono font-semibold ${
                              act.amount >= 0 ? "text-emerald-400" : "text-slate-400"
                            }`}
                          >
                            {act.amount >= 0 ? `+${act.amount}` : act.amount} CR
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
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
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Apps & APK Library
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Official Every Nation mobile releases, Android sideload packages, and web companion tools.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#131926] border border-[#1f293d] self-start sm:self-auto">
                  {(["all", "android", "web"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAppFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                        appFilter === filter
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {filter === "all" ? "All Apps" : filter === "android" ? "Android APKs" : "Web Apps"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sideload Banner */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start space-x-3 text-xs text-purple-200">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Direct Android Sideloading:</span>{" "}
                  Download the official APK file directly to your Android device. Enable "Install Unknown Apps" in your device settings if prompted.
                </div>
              </div>

              {/* Apps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-2xl bg-[#131926] border border-[#1f293d] p-6 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-sm"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full border ${app.badgeColor}`}>
                          {app.badge}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {app.currentRelease.version}
                        </span>
                      </div>

                      {/* App Identity */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#182133] border border-[#25324e] overflow-hidden shrink-0 flex items-center justify-center">
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
                            <Smartphone className="w-8 h-8 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{app.name}</h3>
                          <p className="text-xs text-purple-300 font-medium">{app.tagline}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            {app.platforms.map((p) => (
                              <span
                                key={p}
                                className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {p}
                              </span>
                            ))}
                            <span className="text-[11px] text-slate-500 font-mono">
                              {app.currentRelease.apkSize}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        {app.description}
                      </p>

                      {/* Highlights */}
                      <div className="space-y-1.5 mb-6">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          What's New in {app.currentRelease.version}:
                        </div>
                        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                          {app.currentRelease.whatsNew.slice(0, 3).map((feat, i) => (
                            <li key={i} className="truncate">{feat}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-[#1f293d] flex items-center space-x-3">
                      {app.currentRelease.downloadUrl && (
                        <button
                          onClick={() => handleDownloadApk(app)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-purple-950 cursor-pointer"
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
                          className="py-2.5 px-4 rounded-xl bg-[#1e273d] hover:bg-[#25324e] text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 border border-[#2e3e60] transition-all cursor-pointer"
                        >
                          <span>Web App</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
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
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Game Library
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  High-stakes tactical, network defense, and sci-fi titles playable instantly in your browser.
                </p>
              </div>

              {/* Game Stats Ribbon */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[#131926] border border-[#1f293d] text-center">
                <div>
                  <div className="text-[11px] font-mono uppercase text-slate-400">Games Played</div>
                  <div className="text-xl font-black text-white mt-0.5">{stats.gamesPlayed || 0}</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase text-slate-400">Victories</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">{stats.gamesWon || 0}</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase text-slate-400">Win Rate</div>
                  <div className="text-xl font-black text-purple-400 mt-0.5">{winRate}%</div>
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {gameCatalog.map((game) => (
                  <div
                    key={game.slug}
                    className="rounded-2xl bg-[#131926] border border-[#1f293d] overflow-hidden flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-sm group"
                  >
                    <div>
                      {/* Game Banner Image */}
                      <div className="relative h-44 bg-slate-900 overflow-hidden">
                        <img
                          src={game.image}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#131926] via-transparent to-black/40" />
                        <span className="absolute top-3 right-3 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {game.status}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                          {game.title}
                        </h3>
                        <p className="text-xs text-purple-400 font-medium mb-3">
                          {game.subtitle}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
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
                          className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-purple-950 cursor-pointer"
                        >
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span>Launch Game</span>
                          <ExternalLink className="w-3 h-3 text-purple-300 ml-1" />
                        </a>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 text-slate-500 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700/40 cursor-not-allowed"
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
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Purchases & Orders
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Your complete ledger of marketplace acquisitions, credit transactions, and license keys.
                  </p>
                </div>
                <button
                  onClick={() => setLocation("/marketplace")}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Visit Store
                </button>
              </div>

              {activities.length > 0 ? (
                <div className="rounded-2xl bg-[#131926] border border-[#1f293d] overflow-hidden">
                  <div className="divide-y divide-[#1f293d]">
                    {activities.map((act) => (
                      <div key={act.id} className="p-4 sm:p-5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">{act.description}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-2 mt-0.5">
                              <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="uppercase text-purple-400">{act.type}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {act.amount !== undefined && (
                            <div
                              className={`font-mono font-bold ${
                                act.amount >= 0 ? "text-emerald-400" : "text-slate-300"
                              }`}
                            >
                              {act.amount >= 0 ? `+${act.amount}` : act.amount} CR
                            </div>
                          )}
                          <span className="text-[10px] text-emerald-400/80">Completed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#131926] border border-[#1f293d] p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No Transactions Yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      You haven't made any purchases or credit expenditures yet. Check out available items in our store!
                    </p>
                  </div>
                  <button
                    onClick={() => setLocation("/marketplace")}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-purple-950"
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
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Account & Security
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your credentials, update your login password, and configure studio security.
                </p>
              </div>

              {/* Profile Details Card */}
              <div className="rounded-2xl bg-[#131926] border border-[#1f293d] p-6 space-y-6">
                <div className="flex items-center space-x-2 text-white font-bold text-base">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <span>Member Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#0e1320] border border-[#1f293d]">
                    <div className="text-[11px] font-mono uppercase text-slate-500">Username</div>
                    <div className="text-sm font-bold text-white mt-1">{user?.username || "—"}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0e1320] border border-[#1f293d]">
                    <div className="text-[11px] font-mono uppercase text-slate-500">Email Address</div>
                    <div className="text-sm font-bold text-white mt-1 truncate">{user?.email || "—"}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0e1320] border border-[#1f293d]">
                    <div className="text-[11px] font-mono uppercase text-slate-500">Account Tier</div>
                    <div className="text-sm font-bold text-purple-300 mt-1">
                      Studio Member (Level {user?.level ?? 1})
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0e1320] border border-[#1f293d] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-slate-500">Email Verification</div>
                      <div className="text-sm font-bold mt-1">
                        {user?.isVerified ? (
                          <span className="text-emerald-400 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Unverified
                          </span>
                        )}
                      </div>
                    </div>
                    {!user?.isVerified && (
                      <button
                        onClick={handleResendVerification}
                        disabled={isResendingVerify}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isResendingVerify ? "Sending..." : "Resend Link"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="rounded-2xl bg-[#131926] border border-[#1f293d] p-6 space-y-6">
                <div>
                  <div className="flex items-center space-x-2 text-white font-bold text-base">
                    <Lock className="w-5 h-5 text-purple-400" />
                    <span>Change Password</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Your password must be at least 6 characters and contain letters and numbers.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1320] border border-[#1f293d] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1320] border border-[#1f293d] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1320] border border-[#1f293d] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-purple-950 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </div>

              {/* Connected Services / Discord */}
              <div className="rounded-2xl bg-[#131926] border border-[#1f293d] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-white text-sm">ENGG Operatives Discord</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect with fellow players, share feedback on new APK builds, and participate in tournaments.
                  </p>
                </div>
                <a
                  href="https://discord.gg/engg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer"
                >
                  <span>Join Discord Community</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl bg-red-950/10 border border-red-500/20 p-6 space-y-4">
                <div>
                  <div className="font-bold text-red-400 text-sm">Danger Zone</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Actions that affect your current active session across all devices.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs font-semibold text-white">Sign Out All Sessions</div>
                    <div className="text-[11px] text-slate-500">Terminates your current access tokens.</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors cursor-pointer"
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
