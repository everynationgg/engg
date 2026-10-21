import React, { useState } from "react";
import { FaTimes, FaShieldAlt, FaFileContract, FaUsers } from "react-icons/fa";

interface SiteSubFooterProps {
  className?: string;
}

type LegalDocKey = "privacy" | "terms" | "guidelines" | null;

const LEGAL_DOCS: Record<
  Exclude<LegalDocKey, null>,
  { title: string; updated: string; sections: { heading: string; body: string }[] }
> = {
  privacy: {
    title: "Privacy Policy",
    updated: "October 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "When you create an Every Nation account or play our multiplayer games, we collect your chosen username, email address (when registered), match statistics, friend connections, and optional profile preferences.",
      },
      {
        heading: "2. How We Use Your Data",
        body: "We use your account information solely to authenticate your sessions, save your game progress and credits across devices, facilitate real-time multiplayer lobbies and friend messages, and send requested verification or password-recovery emails.",
      },
      {
        heading: "3. Data Protection & Retention",
        body: "We never sell your personal information to third parties. Passwords are encrypted using industry-standard hashing, and you may request account or data deletion at any time through your account settings or our community support channels.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "October 2026",
    sections: [
      {
        heading: "1. Using Every Nation Services",
        body: "By accessing Every Nation websites, games (including Errant Night and Engraved Nether), and software tools, you agree to use our platform fairly, respect other players, and keep your account credentials secure.",
      },
      {
        heading: "2. Virtual Credits & Match Rewards",
        body: "In-platform credits, XP, and cosmetic unlocks earned through gameplay or purchased in the store are digital platform features with no cash redemption value. Automated farming, exploiting match results, or tampering with game sockets is prohibited.",
      },
      {
        heading: "3. Studio Software & Intellectual Property",
        body: "All original game designs, artwork, codebases, and studio branding belong to Every Nation Games & Studio. Custom client software projects are governed by their respective client agreements.",
      },
    ],
  },
  guidelines: {
    title: "Community Guidelines",
    updated: "October 2026",
    sections: [
      {
        heading: "1. Play Fair & Respect the Crew",
        body: "Social deduction and competitive games thrive on good sportsmanship. Harassment, hate speech, impersonation, or sharing private information in game chat, direct messages, or Discord is strictly prohibited.",
      },
      {
        heading: "2. No Cheating or Collusion",
        body: "Do not use external tools, multiple browser tabs, or out-of-game role sharing to spoil hidden roles in Errant Night or manipulate leaderboards.",
      },
      {
        heading: "3. Welcoming Global Community",
        body: "Every Nation was founded to bring players and creators together. Help new players learn the ropes, report bugs constructively, and keep lobbies welcoming for everyone.",
      },
    ],
  },
};

export default function SiteSubFooter({ className = "" }: SiteSubFooterProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocKey>(null);

  const docContent = activeDoc ? LEGAL_DOCS[activeDoc] : null;

  return (
    <>
      <div
        className={`shrink-0 border-t border-white/5 bg-black/95 pt-2.5 pb-4 sm:py-2.5 px-4 sm:px-6 2xl:px-10 text-[10px] 2xl:text-xs text-neutral-400 select-none z-30 ${className}`}
      >
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Left Mini Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Every Nation" className="h-5 w-auto object-contain brightness-200" />
            <span className="font-bold text-white text-[11px] 2xl:text-xs">Every Nation</span>
            <span className="text-neutral-500">|</span>
            <span className="text-[10px] 2xl:text-xs">
              <span className="text-[#8b5cf6] font-semibold">Gaming.</span>{" "}
              <span className="text-white/80 font-semibold">Community.</span>{" "}
              <span className="text-[#f97316] font-semibold">Studio.</span>
            </span>
          </div>

          {/* Right Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-neutral-400">
            <span>© 2026 Every Nation. All rights reserved.</span>
            <button
              type="button"
              onClick={() => setActiveDoc("privacy")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc("terms")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc("guidelines")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Community Guidelines
            </button>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {docContent && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveDoc(null)}
        >
          <div
            className="bg-white text-neutral-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                {activeDoc === "privacy" && <FaShieldAlt className="text-[#7c3aed] text-base" />}
                {activeDoc === "terms" && <FaFileContract className="text-[#7c3aed] text-base" />}
                {activeDoc === "guidelines" && <FaUsers className="text-[#7c3aed] text-base" />}
                <div>
                  <h3 className="text-base font-bold text-neutral-900">{docContent.title}</h3>
                  <p className="text-[11px] text-neutral-400">Last updated: {docContent.updated}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {docContent.sections.map((sec) => (
                <div key={sec.heading}>
                  <h4 className="font-bold text-neutral-900 mb-1">{sec.heading}</h4>
                  <p>{sec.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="px-5 py-2 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
