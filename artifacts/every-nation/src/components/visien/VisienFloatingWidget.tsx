import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaExpandAlt } from "react-icons/fa";
import { useLocation } from "wouter";
import EnosOrb, { OrbState } from "./EnosOrb";
import VisienChat from "./VisienChat";

export default function VisienFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [location, setLocation] = useLocation();

  // If the user is on the dedicated /visien page or in the gaming /hub, hide the floating widget
  if (location === "/visien" || location === "/hub" || location.startsWith("/hub")) {
    return null;
  }

  return (
    <>
      <aside aria-label="VISIEN AI Assistant" className="fixed bottom-5 right-5 z-40 flex items-center gap-2 select-none">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              onClick={() => setIsOpen(true)}
              className="bg-white/95 hover:bg-white text-neutral-900 border border-neutral-300/80 shadow-2xl rounded-full pl-2 pr-4 py-1.5 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                <EnosOrb state={orbState} size={32} />
              </div>

              <div className="text-left">
                <div className="text-[11px] font-bold tracking-tight text-neutral-900 flex items-center gap-1.5">
                  <span>VISIEN AI Guide</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[9px] text-[#7c3aed] font-semibold leading-tight">
                  Customer & APK Support
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </aside>

      <AnimatePresence>
        {isOpen && (
          <aside aria-label="VISIEN AI Assistant Chat Drawer" className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-[420px] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 text-white/80">
                <a
                  href="https://visien-gray.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open live VISIEN portal"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <FaExpandAlt className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              </div>

              <VisienChat
                compact={true}
                onStateChange={(st) => setOrbState(st)}
              />
            </div>
          </aside>
        )}
      </AnimatePresence>
    </>
  );
}
