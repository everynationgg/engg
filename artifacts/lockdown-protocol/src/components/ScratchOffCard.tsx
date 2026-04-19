import { useEffect, useRef, useState } from "react";

interface ScratchOffCardProps {
  children: React.ReactNode;
  width?: string;
  height?: string;
  coverImage?: string;
  coverColor?: string;
  onReveal?: () => void;
  revealThreshold?: number; // 0 to 1
  className?: string;
}

export default function ScratchOffCard({
  children,
  width = "100%",
  height = "100%",
  coverImage,
  coverColor = "hsl(220, 30%, 10%)",
  onReveal,
  revealThreshold = 0.5,
  className = "",
}: ScratchOffCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const drawCover = () => {
      ctx.fillStyle = coverColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (coverImage) {
        const img = new Image();
        img.src = coverImage;
        img.onload = () => {
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width / 2) - (img.width / 2) * scale;
          const y = (canvas.height / 2) - (img.height / 2) * scale;
          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          drawText();
        };
      } else {
        drawText();
      }
    };

    const drawText = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "bold 32px 'Orbitron', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SCRATCH TO DECRYPT", canvas.width / 2, canvas.height / 2);
    };

    drawCover();

    const getMousePos = (evt: MouseEvent | TouchEvent) => {
      const bRect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ("touches" in evt) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
      } else {
        clientX = (evt as MouseEvent).clientX;
        clientY = (evt as MouseEvent).clientY;
      }

      return {
        x: clientX - bRect.left,
        y: clientY - bRect.top
      };
    };

    const checkReveal = () => {
      if (isRevealed) return;
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clearPixels = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) clearPixels++;
      }
      const clearPercentage = clearPixels / (pixels.length / 4);
      if (clearPercentage > revealThreshold) {
        setIsRevealed(true);
        if (onReveal) onReveal();
      }
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      if (isRevealed) return;
      isDrawing.current = true;
      scratch(e);
    };

    const stopDrawing = () => {
      isDrawing.current = false;
      checkReveal();
    };

    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current || isRevealed) return;
      if ("touches" in e && e.cancelable) {
        // e.preventDefault(); // Sometimes prevents scrolling, may need passive: false
      }

      const { x, y } = getMousePos(e);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      // Use radial gradient for soft brush
      const radGrad = ctx.createRadialGradient(x, y, 10, x, y, 40);
      radGrad.addColorStop(0, "rgba(0,0,0,1)");
      radGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radGrad;
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();
    };

    const preventDefault = (e: TouchEvent) => {
      if (isDrawing.current) e.preventDefault();
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", scratch);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: true });
    canvas.addEventListener("touchmove", preventDefault, { passive: false });
    canvas.addEventListener("touchmove", scratch, { passive: true });
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", scratch);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);

      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", preventDefault);
      canvas.removeEventListener("touchmove", scratch);
      canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [coverImage, coverColor, isRevealed, onReveal, revealThreshold]);

  return (
    <div ref={containerRef} className={className} style={{ width, height, position: "relative" }}>
      {children}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: isRevealed ? 0 : 1,
          transition: "opacity 0.8s ease-out",
          pointerEvents: isRevealed ? "none" : "auto",
          cursor: isRevealed ? "default" : "crosshair",
          zIndex: 50,
        }}
      />
    </div>
  );
}
