import { useEffect, useState } from "react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const { lowGraphics } = usePerformanceMode();

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    if (lowGraphics || isTouchDevice) {
      if (lowGraphics) document.body.classList.add('low-graphics');
      return;
    }

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const isClickable = 
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName.toLowerCase() === "button" ||
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "input" ||
        target.closest("button") !== null ||
        target.closest("a") !== null;
        
      setIsPointer(isClickable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", updatePosition);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [lowGraphics]);

  const isTouchDevice = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0);
  if (lowGraphics || isTouchDevice) return null;

  return (
    <>
      <div 
        className="ix-cursor-dot" 
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${isClicking ? 0.7 : isPointer ? 1.5 : 1})`,
          backgroundColor: isPointer ? "hsl(185 100% 50%)" : "hsl(190 80% 90%)",
          boxShadow: isPointer ? "0 0 10px hsl(185 100% 50%)" : "none"
        }} 
      />
      <div 
        className="ix-cursor-ring" 
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${isClicking ? 0.8 : isPointer ? 1.2 : 1})`,
          borderColor: isPointer ? "hsl(185 100% 50% / 0.5)" : "hsl(190 80% 90% / 0.3)"
        }} 
      />
    </>
  );
}
