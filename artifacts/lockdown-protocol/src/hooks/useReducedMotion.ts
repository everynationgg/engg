import { useEffect, useState } from "react";

/**
 * React hook for detecting prefers-reduced-motion and user toggle.
 * Returns { reducedMotion, setReducedMotion }
 */
export function useReducedMotion() {
  // System preference
  const systemPref =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // User override (localStorage)
  const [reducedMotion, setReducedMotion] = useState(() => {
    const stored = localStorage.getItem("lp_reducedMotion");
    if (stored === "true") return true;
    if (stored === "false") return false;
    return systemPref;
  });

  useEffect(() => {
    localStorage.setItem("lp_reducedMotion", String(reducedMotion));
    if (reducedMotion) {
      document.body.classList.add("reduced-motion");
    } else {
      document.body.classList.remove("reduced-motion");
    }
  }, [reducedMotion]);

  return { reducedMotion, setReducedMotion };
}
