import { useState } from "react";
import { FaEnvelope } from "react-icons/fa";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ready" | "loading" | "success" | "error">("ready");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage("Please enter your email");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("If the email exists, a password reset link has been sent");
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        const data = await response.json();
        setStatus("error");
        setMessage(data.error || "Failed to request password reset");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred");
      console.error("Forgot password error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-orbitron text-xs tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(210 30% 60%)" }}>
          Email Address
        </label>
        <div className="relative group">
          <div className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <FaEnvelope className="text-cyan-400 opacity-30 group-focus-within:opacity-70 transition-opacity text-[13px] md:text-[14px]" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus("ready");
            }}
            placeholder="your@email.com"
            className="w-full pl-10 md:pl-12 pr-4 py-3 bg-white/5 border border-white/10 font-mono text-xs focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all placeholder:opacity-20 text-white autofill:bg-transparent"
            disabled={status === "loading"}
          />
        </div>
      </div>

      {message && (
        <p
          className="font-orbitron text-xs text-center p-3 rounded"
          style={{
            background: status === "success" ? "hsl(120 70% 15%)" : "hsl(0 75% 15%)",
            color: status === "success" ? "hsl(120 100% 50%)" : "hsl(0 75% 60%)",
          }}
        >
          {message}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={status === "loading" || status === "success"}
          className="flex-1 py-2 font-orbitron font-bold text-xs tracking-[0.1em] uppercase rounded border-2 transition-all disabled:opacity-50"
          style={{
            borderColor: "hsl(185 100% 50%)",
            color: "hsl(185 100% 50%)",
            background: "hsl(220 28% 12%)",
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.borderColor = "hsl(185 100% 70%)";
              e.currentTarget.style.color = "hsl(185 100% 70%)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(185 100% 50%)";
            e.currentTarget.style.color = "hsl(185 100% 50%)";
          }}
        >
          {status === "loading" ? "SENDING..." : status === "success" ? "SENT!" : "SEND RESET LINK"}
        </button>

        <button
          onClick={onClose}
          disabled={status === "loading"}
          className="flex-1 py-2 font-orbitron font-bold text-xs tracking-[0.1em] uppercase rounded border-2 transition-all"
          style={{
            borderColor: "hsl(210 30% 35%)",
            color: "hsl(210 30% 60%)",
            background: "hsl(220 28% 12%)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "hsl(210 30% 50%)";
            e.currentTarget.style.color = "hsl(210 30% 80%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(210 30% 35%)";
            e.currentTarget.style.color = "hsl(210 30% 60%)";
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
