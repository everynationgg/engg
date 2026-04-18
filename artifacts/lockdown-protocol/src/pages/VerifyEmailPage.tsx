import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token found");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus("success");
          setMessage("✓ Email verified successfully!");
          // Redirect to profile after 2 seconds
          setTimeout(() => {
            setLocation("/profile");
          }, 2000);
        } else {
          const data = await response.json();
          setStatus("error");
          setMessage(data.error || "Failed to verify email");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
        console.error("Verification error:", error);
      }
    };

    verifyEmail();
  }, [setLocation]);

  return (
    <div className="min-h-screen text-white p-6 flex items-center justify-center" style={{ background: "hsl(220 28% 4%)" }}>
      <div className="max-w-md w-full rounded-lg p-8" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
        <h1 className="font-orbitron font-bold text-2xl tracking-[0.2em] uppercase mb-6 text-center" style={{ color: "hsl(185 100% 50%)" }}>
          Email Verification
        </h1>

        <div className="text-center py-12">
          {status === "verifying" && (
            <>
              <div
                className="w-12 h-12 mx-auto mb-4 border-4 border-transparent rounded-full animate-spin"
                style={{
                  borderTopColor: "hsl(185 100% 50%)",
                  borderRightColor: "hsl(270 70% 60%)",
                }}
              />
              <p className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 70%)" }}>
                {message}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-5xl mb-4">✓</div>
              <p className="font-orbitron text-lg tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(185 100% 50%)" }}>
                Success!
              </p>
              <p className="font-orbitron text-sm" style={{ color: "hsl(210 30% 60%)" }}>
                {message}
              </p>
              <p className="font-orbitron text-xs mt-4" style={{ color: "hsl(210 30% 50%)" }}>
                Redirecting to profile...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-5xl mb-4">✗</div>
              <p className="font-orbitron text-lg tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(0 75% 60%)" }}>
                Verification Failed
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
