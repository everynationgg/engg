import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaArrowRight,
  FaExclamationCircle,
  FaCheckCircle,
  FaSpinner,
  FaArrowLeft,
} from "react-icons/fa";
import StudioLayout from "@/components/StudioLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/auth/request-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData.error || "Unable to send reset link. Please check the email address."
        );
      }
    } catch {
      setError("Network timeout. Please check your connection and try again.");
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
                  Password Recovery
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Reset Password
              </h1>
              <p className="text-sm text-neutral-500 mt-2">
                Enter your registered email and we&apos;ll send you instructions to reset your password.
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

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 ml-1">
                    Registered Email Address
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
                      className="w-full bg-[#f5f5f7] border border-neutral-300 focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/15 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-3.5 px-6 font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
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
                <h3 className="text-lg font-bold text-neutral-900">Check Your Email</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  We&apos;ve sent password reset instructions to{" "}
                  <strong className="text-neutral-900">{email}</strong>. Please check your inbox and spam folder.
                </p>
                <div className="pt-2 flex flex-col items-center gap-2">
                  <Link
                    href={`/reset-password?email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-[#7c3aed]"
                  >
                    <span>Have a reset token? Enter it here</span>
                    <FaArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#7c3aed] hover:text-[#6d28d9]"
                  >
                    <FaArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            )}

            {!submitted && (
              <div className="mt-8 pt-6 border-t border-neutral-200/80 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <FaArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </StudioLayout>
  );
}
