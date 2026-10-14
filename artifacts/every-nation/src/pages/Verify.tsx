import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaKey,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaRedo,
} from "react-icons/fa";
import StudioLayout from "@/components/StudioLayout";

export default function Verify() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { verify, resendVerification, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.isVerified) {
      setLocation("/profile");
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    if (token && !loading && !user?.isVerified) {
      setCode(token);
      (async () => {
        setLoading(true);
        setError(null);
        try {
          await verify(token);
          setLocation("/profile");
        } catch (err: any) {
          setError(err.message || "Auto-verification failed. Please enter the code manually.");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user, setLocation, verify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter your 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verify(code.trim());
      setLocation("/profile");
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setResendSuccess(false);
    try {
      await resendVerification();
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to resend code. Please try again in a few moments.");
    } finally {
      setResending(false);
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
                  Account Verification
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Verify Your Email
              </h1>
              <p className="text-sm text-neutral-500 mt-2">
                We've sent a 6-digit code to your email. Enter it below to activate your account.
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

            {/* Resend Success Notification */}
            <AnimatePresence>
              {resendSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl p-4 flex items-start gap-3"
                >
                  <FaCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    A fresh verification code has been dispatched to your email!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1 text-center">
                  6-Digit Verification Code
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-neutral-400 pointer-events-none">
                    <FaKey className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\s+/g, ""))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-4 py-3.5 text-center font-mono text-xl tracking-[0.4em] font-bold text-neutral-900 placeholder-neutral-300 outline-none transition-all uppercase"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full mt-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-3.5 px-6 font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Account</span>
                    <FaArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Resend Link */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs font-semibold text-[#7c3aed] hover:text-[#6d28d9] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FaRedo className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                  <span>{resending ? "Resending..." : "Didn't receive code? Resend"}</span>
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-200/80 text-center text-sm text-neutral-600">
              <Link
                href="/login"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </StudioLayout>
  );
}
