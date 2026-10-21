import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLock,
  FaKey,
  FaArrowRight,
  FaExclamationCircle,
  FaCheckCircle,
  FaSpinner,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import StudioLayout from "@/components/StudioLayout";

export default function ResetPassword() {
  const queryParams = new URLSearchParams(window.location.search);
  const urlToken = queryParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(urlToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveToken = tokenInput.trim();
    if (!effectiveToken) {
      setError("Reset token is required. Please use the link from your email or paste your reset token.");
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
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: effectiveToken, newPassword: password }),
        }
      );

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setLocation("/login"), 2500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "The reset token is invalid or has expired.");
      }
    } catch {
      setError("Failed to reset password. Please check your network and try again.");
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
                  Account Security
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Create New Password
              </h1>
              <p className="text-sm text-neutral-500 mt-2">
                Set a secure new password for your Every Nation account.
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

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!urlToken && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1">
                      Reset Token
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-neutral-400 pointer-events-none">
                        <FaKey className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="Paste reset token from your email"
                        required
                        className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-neutral-400 pointer-events-none">
                      <FaLock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                    />
                    <button
                      type="button"
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
                    Confirm New Password
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
                      className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading || !tokenInput.trim()}
                  className="w-full mt-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-3.5 px-6 font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Saving new password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <FaArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                  <FaCheckCircle />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Password Updated!</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Your password has been changed successfully. Redirecting you to sign in...
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#7c3aed] hover:text-[#6d28d9]"
                  >
                    <span>Go to Sign In immediately</span>
                    <FaArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-neutral-200/80 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </StudioLayout>
  );
}
