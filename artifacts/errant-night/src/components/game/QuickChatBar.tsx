import React, { useState } from "react";
import { playSciFiClick } from "@/lib/sound";

interface QuickChatBarProps {
  onSendMessage: (text: string) => void;
  playerNames: string[];
  disabled?: boolean;
}

type Category = "CLAIM" | "ACCUSE" | "SCAN" | "VOTE" | "REACTION";

const ROLES = [
  "Crew",
  "Scanner",
  "Sentinel",
  "Commander",
  "Disruptor",
  "Shifter",
  "Warper",
  "Alien",
];

const ACCUSATION_TEMPLATES = [
  "{name} is lying!",
  "I suspect {name}!",
  "{name} is an Alien!",
  "Why so quiet, {name}?",
];

const SCAN_TEMPLATES = [
  "I scanned {name} -> Result: Crew",
  "I scanned {name} -> Result: Alien",
  "I swapped roles with {name}",
  "Center cards are clear",
];

const VOTE_TEMPLATES = [
  "Vote for {name}!",
  "I trust {name}",
  "Don't vote me, I'm innocent!",
  "Skip voting this round!",
];

const QUICK_REACTIONS = [
  "Agreed! 👍",
  "No way! ❌",
  "Wait, hear me out!",
  "Time is running out! ⏳",
  "Who swapped roles?",
  "I was Sentinel, shield held!",
];

export default function QuickChatBar({
  onSendMessage,
  playerNames,
  disabled = false,
}: QuickChatBarProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSelectCategory = (cat: Category) => {
    playSciFiClick();
    if (activeCategory === cat) {
      setActiveCategory(null);
      setSelectedTemplate(null);
    } else {
      setActiveCategory(cat);
      setSelectedTemplate(null);
    }
  };

  const handleSendText = (text: string) => {
    playSciFiClick();
    onSendMessage(text);
    setActiveCategory(null);
    setSelectedTemplate(null);
  };

  const handleTemplateClick = (tpl: string) => {
    playSciFiClick();
    if (tpl.includes("{name}")) {
      setSelectedTemplate(tpl);
    } else {
      handleSendText(tpl);
    }
  };

  const handleTargetPlayer = (playerName: string) => {
    if (!selectedTemplate) return;
    const finalMsg = selectedTemplate.replace("{name}", playerName);
    handleSendText(finalMsg);
  };

  // Filter out any empty names
  const cleanPlayers = playerNames.filter(Boolean);

  return (
    <div
      className="border-t px-2 py-2 shrink-0 transition-all select-none"
      style={{
        background: "hsl(220 28% 10% / 0.95)",
        borderColor: "hsl(210 30% 20%)",
      }}
    >
      {/* Top category tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <span className="text-[9px] font-orbitron font-bold uppercase tracking-wider text-cyan-400/70 shrink-0 mr-1">
          QUICK:
        </span>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectCategory("CLAIM")}
          className={`px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider uppercase transition-all shrink-0 ${
            activeCategory === "CLAIM"
              ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
          }`}
        >
          CLAIM 🛡️
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectCategory("ACCUSE")}
          className={`px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider uppercase transition-all shrink-0 ${
            activeCategory === "ACCUSE"
              ? "bg-red-500/30 text-red-300 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
              : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
          }`}
        >
          ACCUSE 🎯
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectCategory("SCAN")}
          className={`px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider uppercase transition-all shrink-0 ${
            activeCategory === "SCAN"
              ? "bg-amber-500/30 text-amber-300 border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
          }`}
        >
          SCAN 🔍
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectCategory("VOTE")}
          className={`px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider uppercase transition-all shrink-0 ${
            activeCategory === "VOTE"
              ? "bg-purple-500/30 text-purple-300 border border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
          }`}
        >
          VOTE 🗳️
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectCategory("REACTION")}
          className={`px-2.5 py-1 rounded text-[10px] font-orbitron font-semibold tracking-wider uppercase transition-all shrink-0 ${
            activeCategory === "REACTION"
              ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
          }`}
        >
          FAST ⚡
        </button>
      </div>

      {/* Sub-bar / wheel content */}
      {activeCategory && (
        <div className="mt-2 pt-2 border-t border-white/10">
          {/* If a template needing a player is picked, show player list */}
          {selectedTemplate ? (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-orbitron text-amber-300 font-bold">
                  Pick Target: "{selectedTemplate.replace("{name}", "____")}"
                </span>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-[9px] font-mono text-white/50 hover:text-white"
                >
                  [Cancel]
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {cleanPlayers.length > 0 ? (
                  cleanPlayers.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleTargetPlayer(name)}
                      className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-800/80 border border-cyan-500/40 text-cyan-200 text-[11px] font-orbitron rounded active:scale-95 transition-all shadow-[0_0_6px_rgba(6,182,212,0.2)]"
                    >
                      {name}
                    </button>
                  ))
                ) : (
                  <span className="text-[10px] text-white/40 italic py-1">
                    No other players in room
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Otherwise show category items */
            <div className="animate-in fade-in slide-in-from-top-1 duration-150 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {activeCategory === "CLAIM" &&
                ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleSendText(`I am ${role}!`)}
                    className="px-2 py-1 bg-cyan-950/40 hover:bg-cyan-800/60 border border-cyan-500/30 text-cyan-200 text-[10px] font-orbitron rounded active:scale-95 transition-all"
                  >
                    I am {role}
                  </button>
                ))}

              {activeCategory === "ACCUSE" &&
                ACCUSATION_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl}
                    onClick={() => handleTemplateClick(tpl)}
                    className="px-2 py-1 bg-red-950/40 hover:bg-red-800/60 border border-red-500/30 text-red-200 text-[10px] font-orbitron rounded active:scale-95 transition-all"
                  >
                    {tpl.replace("{name}", "...")}
                  </button>
                ))}

              {activeCategory === "SCAN" &&
                SCAN_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl}
                    onClick={() => handleTemplateClick(tpl)}
                    className="px-2 py-1 bg-amber-950/40 hover:bg-amber-800/60 border border-amber-500/30 text-amber-200 text-[10px] font-orbitron rounded active:scale-95 transition-all"
                  >
                    {tpl.replace("{name}", "...")}
                  </button>
                ))}

              {activeCategory === "VOTE" &&
                VOTE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl}
                    onClick={() => handleTemplateClick(tpl)}
                    className="px-2 py-1 bg-purple-950/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 text-[10px] font-orbitron rounded active:scale-95 transition-all"
                  >
                    {tpl.replace("{name}", "...")}
                  </button>
                ))}

              {activeCategory === "REACTION" &&
                QUICK_REACTIONS.map((react) => (
                  <button
                    key={react}
                    onClick={() => handleSendText(react)}
                    className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-200 text-[10px] font-orbitron rounded active:scale-95 transition-all"
                  >
                    {react}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
