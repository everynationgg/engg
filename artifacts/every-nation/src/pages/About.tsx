import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import StudioLayout, { getActiveAboutPhaseIndex } from "@/components/StudioLayout";
import { WhoWeAreContent } from "./about/WhoWeAre";
import { WhatWeDoContent } from "./about/WhatWeDo";
import { MissionVisionContent } from "./about/MissionVision";

const PHASE_PATHS = [
  "/about/who-we-are",
  "/about/what-we-do",
  "/about/mission-and-vision",
];

export default function About() {
  const [location, setLocation] = useLocation();
  const currentPhaseIndex = getActiveAboutPhaseIndex(location);
  const prevPhaseRef = useRef(currentPhaseIndex);
  const [direction, setDirection] = useState<number>(1);

  useEffect(() => {
    if (currentPhaseIndex !== prevPhaseRef.current) {
      setDirection(currentPhaseIndex > prevPhaseRef.current ? 1 : -1);
      prevPhaseRef.current = currentPhaseIndex;
    }
  }, [currentPhaseIndex]);

  const handleNavigate = (targetPath: string) => {
    const nextIdx = getActiveAboutPhaseIndex(targetPath);
    if (targetPath.startsWith("/about")) {
      setDirection(nextIdx >= currentPhaseIndex ? 1 : -1);
      prevPhaseRef.current = nextIdx;
    }
    setLocation(targetPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Support Left / Right arrow keys to step between About phases
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight" && currentPhaseIndex < PHASE_PATHS.length - 1) {
        const nextPath = PHASE_PATHS[currentPhaseIndex + 1];
        setDirection(1);
        prevPhaseRef.current = currentPhaseIndex + 1;
        setLocation(nextPath);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (e.key === "ArrowLeft" && currentPhaseIndex > 0) {
        const prevPath = PHASE_PATHS[currentPhaseIndex - 1];
        setDirection(-1);
        prevPhaseRef.current = currentPhaseIndex - 1;
        setLocation(prevPath);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentPhaseIndex, setLocation]);

  return (
    <StudioLayout>
      <div className="overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPhaseIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 42 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -42 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 32,
              mass: 0.8,
            }}
          >
            {currentPhaseIndex === 0 && (
              <WhoWeAreContent onNavigate={handleNavigate} />
            )}
            {currentPhaseIndex === 1 && (
              <WhatWeDoContent onNavigate={handleNavigate} />
            )}
            {currentPhaseIndex === 2 && (
              <MissionVisionContent onNavigate={handleNavigate} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </StudioLayout>
  );
}
