import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaExclamationCircle,
  FaSpinner,
} from "react-icons/fa";
import StudioLayout from "@/components/StudioLayout";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, isLoggedIn, isVerified } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoggedIn) {
      setLocation(isVerified ? "/profile" : "/verify");
    }
  }, [isLoggedIn, isVerified, setLocation]);

  if (isLoggedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3 || username.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      await register(email, username, password);
      setLocation("/verify");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Please check your information."
      );
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
                  Join Every Nation
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Create Account
              </h1>
              <p className="text-sm text-neutral-500 mt-2">
                Save your game progress, connect with friends, and join live multiplayer lobbies.
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1">
                  Username
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-neutral-400 pointer-events-none">
                    <FaUser className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                    autoComplete="username"
                    className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-neutral-400 pointer-events-none">
                    <FaEnvelope className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-neutral-400 pointer-events-none">
                    <FaLock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters (1 letter + 1 number)"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-12 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 text-neutral-400 hover:text-neutral-700 focus:outline-none p-1 cursor-pointer"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-neutral-400 pointer-events-none">
                    <FaLock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-3.5 px-6 font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <FaArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link Footer */}
            <div className="mt-8 pt-6 border-t border-neutral-200/80 text-center text-sm text-neutral-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-[#7c3aed] hover:text-[#6d28d9] underline underline-offset-4 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </StudioLayout>
  );
}
