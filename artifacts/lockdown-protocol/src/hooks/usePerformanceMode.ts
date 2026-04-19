import { useState, useEffect } from "react";

export function usePerformanceMode() {
  const [lowGraphics, setLowGraphics] = useState(() => {
    return localStorage.getItem("lp_lowGraphics") === "true";
  });

  useEffect(() => {
    if (lowGraphics) {
      document.body.classList.add("low-graphics");
      localStorage.setItem("lp_lowGraphics", "true");
    } else {
      document.body.classList.remove("low-graphics");
      localStorage.setItem("lp_lowGraphics", "false");
    }
  }, [lowGraphics]);

  return { lowGraphics, setLowGraphics };
}
