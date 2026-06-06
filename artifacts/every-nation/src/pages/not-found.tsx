import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  CinematicPageShell,
  AccessGate,
} from "@/components/common/PremiumVisuals";
import { SciFiButton } from "@/components/common/SciFiButton";

export default function NotFound() {
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(reducedMotion);

  return (
    <CinematicPageShell
      pageLabel="404_PAGE_DISCONNECTED"
      accentColor="rgba(239, 68, 68, 0.12)"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.45,
          ease: "easeOut",
        }}
        className="w-full max-w-[1080px] relative z-20 px-4 mt-4 mb-20 flex justify-center"
      >
        <AccessGate
          title="Link Terminated"
          subtitle="Protocol: ADDRESS_RESOLUTION_FAULT"
          icon={
            <AlertCircle className="text-2xl text-red-500 drop-shadow-[0_0_8px_#ef4444]" />
          }
          accentColor="#ef4444"
          reducedMotion={shouldReduceMotion}
        >
          <div className="p-8 md:p-10 flex flex-col gap-6 text-center md:text-left">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-red-500/60">
                CRITICAL_ERROR_CODE: 404_NODE_DISCONNECTED
              </span>
              <p className="font-mono text-[13px] uppercase tracking-wider text-white/50 leading-relaxed">
                The requesting operator has initiated a traversal to an address
                that does not exist in the active registry. Session integrity
                remains verified.
              </p>
            </div>

            <div className="w-full h-[1px] bg-white/5" />

            <div className="flex flex-col gap-4 mt-2">
              <Link href="/hub">
                <SciFiButton
                  variant="primary"
                  className="w-full py-4 border border-red-500/20 text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                >
                  <span className="text-[14px]">Re-establish Uplink</span>
                </SciFiButton>
              </Link>
            </div>
          </div>
        </AccessGate>
      </motion.div>
    </CinematicPageShell>
  );
}
