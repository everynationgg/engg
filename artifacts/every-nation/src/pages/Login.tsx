import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaExclamationCircle,
  FaSpinner,
} from "react-icons/fa";
import StudioLayout from "@/components/StudioLayout";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, devLogin, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoggedIn) {
    setLocation("/profile");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(identifier, password);
      // Check for redirect query param
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTarget = searchParams.get("redirect") || "/profile";
      setLocation(redirectTarget);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudioLayout>
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 sm:py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Card Container */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xl p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
                  ENGG Account
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-sm text-neutral-500 mt-2">
                Sign in to your Every Nation GG profile & gaming access.
              </p>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-2xl p-4 flex items-start gap-3"
                >
                  <FaExclamationCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Operator Identifier (Email or Username) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1">
                  Email or Username
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-neutral-400 pointer-events-none">
                    <FaEnvelope className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or username"
                    required
                    autoComplete="username"
                    className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-neutral-400 pointer-events-none">
                    <FaLock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 text-neutral-400 hover:text-neutral-700 focus:outline-none p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-4 h-4" />
                    ) : (
                      <FaEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-3.5 px-6 font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FaArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Local Dev Instant Login Button (Visible on Localhost Only) */}
              {typeof window !== "undefined" && (
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1" ||
                window.location.hostname.startsWith("192.168.")
              ) && (
                <div className="pt-2">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-neutral-200"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-neutral-400">
                      Localhost Fast-Pass
                    </span>
                    <div className="flex-grow border-t border-neutral-200"></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      devLogin("meowionly", "meowionly@everynation.gg");
                      const searchParams = new URLSearchParams(window.location.search);
                      const redirectTarget = searchParams.get("redirect") || "/profile";
                      setLocation(redirectTarget);
                    }}
                    className="w-full bg-purple-50 hover:bg-purple-100 text-[#7c3aed] border border-purple-200 hover:border-purple-300 rounded-2xl py-3 px-4 font-bold text-xs tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>⚡ Instant Dev Login (meowionly)</span>
                  </button>
                </div>
              )}
            </form>

            {/* Register Footer */}
            <div className="mt-8 pt-6 border-t border-neutral-200/80 text-center text-sm text-neutral-600">
              Don't have an account yet?{" "}
              <Link
                href="/register"
                className="font-bold text-[#7c3aed] hover:text-[#6d28d9] underline underline-offset-4 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </StudioLayout>
  );
}
