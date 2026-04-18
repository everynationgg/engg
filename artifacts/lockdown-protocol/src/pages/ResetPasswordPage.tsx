import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"ready" | "loading" | "success" | "error">("ready");
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");

    if (!tokenParam) {
      setStatus("error");
      setMessage("No reset token found");
      return;
    }

    setToken(tokenParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setStatus("error");
      setMessage("No reset token found");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setStatus("error");
      setMessage("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("✓ Password reset successfully!");
        setTimeout(() => {
          setLocation("/");
        }, 2000);
      } else {
        const data = await response.json();
        setStatus("error");
        setMessage(data.error || "Failed to reset password");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred during password reset");
      console.error("Reset error:", error);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 flex items-center justify-center" style={{ background: "hsl(220 28% 4%)" }}>
      <div className="max-w-md w-full rounded-lg p-8" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
        <h1 className="font-orbitron font-bold text-2xl tracking-[0.2em] uppercase mb-8 text-center" style={{ color: "hsl(185 100% 50%)" }}>
          Reset Password
        </h1>

        {status === "success" ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✓</div>
            <p className="font-orbitron text-lg tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(185 100% 50%)" }}>
              Success!
            </p>
            <p className="font-orbitron text-sm" style={{ color: "hsl(210 30% 60%)" }}>
              {message}
            </p>
            <p className="font-orbitron text-xs mt-4" style={{ color: "hsl(210 30% 50%)" }}>
              Redirecting...
            </p>
          </div>
        ) : status === "error" && !token ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✗</div>
            <p className="font-orbitron text-lg tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(0 75% 60%)" }}>
              Error
            </p>
            <p className="font-orbitron text-sm" style={{ color: "hsl(210 30% 60%)" }}>
              {message}
            </p>
            <button
              onClick={() => setLocation("/")}
              className="mt-6 px-6 py-2 font-orbitron text-xs tracking-[0.1em] uppercase rounded border transition-all"
              style={{
                borderColor: "hsl(185 100% 50%)",
                color: "hsl(185 100% 50%)",
                background: "hsl(220 28% 12%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(185 100% 70%)";
                e.currentTarget.style.color = "hsl(185 100% 70%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(185 100% 50%)";
                e.currentTarget.style.color = "hsl(185 100% 50%)";
              }}
            >
              BACK HOME
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-orbitron text-xs tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(210 30% 60%)" }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setStatus("ready");
                }}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded font-orbitron text-sm bg-opacity-50"
                style={{
                  background: "hsl(220 28% 15%)",
                  border: "1px solid hsl(210 30% 25%)",
                  color: "hsl(210 30% 80%)",
                }}
                disabled={status === "loading"}
              />
            </div>

            <div>
              <label className="block font-orbitron text-xs tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(210 30% 60%)" }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setStatus("ready");
                }}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded font-orbitron text-sm bg-opacity-50"
                style={{
                  background: "hsl(220 28% 15%)",
                  border: "1px solid hsl(210 30% 25%)",
                  color: "hsl(210 30% 80%)",
                }}
                disabled={status === "loading"}
              />
            </div>

            {message && (
              <p className="font-orbitron text-xs text-center" style={{ color: status === "error" ? "hsl(0 75% 60%)" : "hsl(185 100% 50%)" }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !token}
              className="w-full py-2 font-orbitron font-bold text-xs tracking-[0.1em] uppercase rounded border-2 transition-all disabled:opacity-50"
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
              {status === "loading" ? "RESETTING..." : "RESET PASSWORD"}
            </button>

            <button
              type="button"
              onClick={() => setLocation("/")}
              className="w-full py-2 font-orbitron font-bold text-xs tracking-[0.1em] uppercase rounded border-2 transition-all"
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
              BACK HOME
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
