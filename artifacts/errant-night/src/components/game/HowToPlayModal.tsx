import { useEffect, useState } from "react";
import { ALIEN_ROLES, CREW_ROLES, CHAOTIC_ROLES, Role } from "@/data/roles";
import howToPlayImg from "@assets/How_to_Play.webp";
import { TeamIcon } from "@/components/common/TeamIcon";
import { playSciFiClick } from "@/lib/sound";

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const [activeTab, setActiveTab] = useState<"phases" | "roles" | "image">("phases");
  const [zoomImage, setZoomImage] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  // Close on ESC or Android back button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (zoomImage) {
          setZoomImage(false);
        } else {
          onClose();
        }
      }
    };
    const handleBackButton = (e: Event) => {
      e.preventDefault();
      if (zoomImage) {
        setZoomImage(false);
      } else {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("backbutton", handleBackButton);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("backbutton", handleBackButton);
    };
  }, [onClose, zoomImage]);

  const handleTabChange = (tab: "phases" | "roles" | "image") => {
    playSciFiClick();
    setActiveTab(tab);
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-sm transition-all duration-300"
      style={{
        background: "hsl(220 30% 2% / 0.85)",
        paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
      }}
      onClick={() => { playSciFiClick(); onClose(); }}
    >
      <div
        className="relative w-full max-w-4xl h-[90dvh] sm:h-[88dvh] bg-[#0c1016] border border-white/15 shadow-[0_0_50px_rgba(0,243,255,0.12)] overflow-hidden flex flex-col rounded-xl"
        onClick={(e) => e.stopPropagation()}
        data-no-swipe="true"
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />

        {/* Header */}
        <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-6 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full" />
              <h2 className="font-orbitron font-black text-lg sm:text-2xl tracking-[0.18em] uppercase text-white">
                Field Manual
              </h2>
            </div>
            <p className="font-mono text-[11px] sm:text-xs tracking-[0.12em] uppercase text-white/60">
              How to Play &amp; Role Guide
            </p>
          </div>
          <button
            onClick={() => { playSciFiClick(); onClose(); }}
            className="w-11 h-11 flex items-center justify-center rounded-lg border border-white/15 hover:border-cyan-400/50 hover:bg-cyan-500/10 active:scale-95 transition-all text-white/70 hover:text-cyan-300 font-mono text-lg cursor-pointer"
            style={{ touchAction: "manipulation" }}
            aria-label="Close manual"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-8 flex gap-5 sm:gap-8 shrink-0 bg-white/[0.03] border-b border-white/10 overflow-x-auto no-scrollbar">
          <TabButton
            active={activeTab === "phases"}
            onClick={() => handleTabChange("phases")}
            label="How to Play"
          />
          <TabButton
            active={activeTab === "roles"}
            onClick={() => handleTabChange("roles")}
            label="Roles & Abilities"
          />
          <TabButton
            active={activeTab === "image"}
            onClick={() => handleTabChange("image")}
            label="Quick Guide"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {activeTab === "phases" ? (
            <div className="max-w-2xl space-y-6 sm:space-y-8">
              <div className="p-4 sm:p-5 bg-cyan-500/[0.07] border border-cyan-500/25 rounded-lg">
                <p className="text-xs sm:text-sm leading-relaxed text-cyan-50/90">
                  <strong>Errant Night</strong> is a fast-paced sci-fi social deduction game for 4–8 players. Every match deals one secret role card to each player and places <strong>3 unassigned cards</strong> in the center. Because abilities can swap or redirect roles during the night, the role you start with might not be the role you hold when voting begins!
                </p>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <PhaseStep
                  step={1}
                  title="Join Lobby"
                  desc="Create a match or join a room using a 6-character code. Add AI bots anytime to fill empty seats."
                />
                <PhaseStep
                  step={2}
                  title="Select Roles"
                  desc="The host selects a deck of roles equal to the player count plus 3 extra cards placed face-down in the center."
                />
                <PhaseStep
                  step={3}
                  title="Role Reveal"
                  desc="View your starting role, team, and win condition. Chaotic roles choose whether to side with Crew or Alien, and early-action roles (Virus, Router, Doctor) pick their targets."
                />
                <PhaseStep
                  step={4}
                  title="Orbit Phase (Night)"
                  desc="Use your role ability in secret—peek at center cards, scan players, jam abilities, or swap roles before the timer runs out."
                />
                <PhaseStep
                  step={5}
                  title="Crew Discussion"
                  desc="Share information, bluff, and piece together whose roles were swapped during the Orbit phase."
                />
                <PhaseStep
                  step={6}
                  title="Vote to Eject"
                  desc="Every player votes for who they suspect holds an Alien role. The player with the most votes is ejected."
                />
                <PhaseStep
                  step={7}
                  title="Match Result"
                  desc="Final roles are revealed! Crew wins if an Alien is ejected. Alien wins if no Alien is ejected. Parasite wins if voted out."
                />
              </div>
            </div>
          ) : activeTab === "roles" ? (
            <div className="space-y-10 sm:space-y-12">
              <RoleSection
                team="Crew Team"
                teamKey="Crew"
                subtitle="Eliminate at least one Alien (or survive if no Alien is in play) to win."
                color="#00f3ff"
                roles={CREW_ROLES}
                expandedRoleId={expandedRoleId}
                onToggleRole={(id) => {
                  playSciFiClick();
                  setExpandedRoleId((prev) => (prev === id ? null : id));
                }}
              />
              <RoleSection
                team="Alien Team"
                teamKey="Alien"
                subtitle="Deceive the Crew and keep all Aliens from being voted out."
                color="#ff4e4e"
                roles={ALIEN_ROLES}
                expandedRoleId={expandedRoleId}
                onToggleRole={(id) => {
                  playSciFiClick();
                  setExpandedRoleId((prev) => (prev === id ? null : id));
                }}
              />
              <RoleSection
                team="Chaotic Roles"
                teamKey="Chaotic"
                subtitle="Choose Crew or Alien alignment at the start of the match, then disrupt the board."
                color="#c084fc"
                roles={CHAOTIC_ROLES}
                expandedRoleId={expandedRoleId}
                onToggleRole={(id) => {
                  playSciFiClick();
                  setExpandedRoleId((prev) => (prev === id ? null : id));
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 sm:py-6 space-y-3">
              <div
                className="relative p-2 bg-white/5 border border-cyan-500/30 rounded-lg group shadow-[0_0_25px_rgba(0,243,255,0.1)] cursor-pointer"
                onClick={() => setZoomImage(true)}
              >
                <img
                  src={howToPlayImg}
                  alt="Quick Guide"
                  className="w-full max-w-lg transition-all duration-300 rounded"
                />
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity rounded flex items-center justify-center pointer-events-none">
                  <span className="px-3 py-1 bg-black/80 border border-cyan-400 text-cyan-300 text-xs font-orbitron tracking-widest uppercase rounded">
                    Tap to Expand
                  </span>
                </div>
              </div>
              <p className="font-mono text-xs text-white/60 uppercase tracking-wider text-center">
                Tap quick guide image to zoom in
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Zoom Overlay */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[10005] bg-black/95 flex flex-col items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setZoomImage(false)}
        >
          <div className="w-full max-w-2xl flex justify-between items-center mb-2 px-2">
            <span className="font-orbitron text-xs text-cyan-300 tracking-widest uppercase">
              Quick Reference Guide
            </span>
            <button
              onClick={() => setZoomImage(false)}
              className="w-11 h-11 rounded-lg bg-black/80 border border-cyan-500/50 text-cyan-300 font-mono text-xl flex items-center justify-center cursor-pointer active:scale-95"
              style={{ touchAction: "manipulation" }}
            >
              ✕
            </button>
          </div>
          <div className="flex-1 w-full max-w-2xl overflow-y-auto flex items-center justify-center">
            <img
              src={howToPlayImg}
              alt="Quick Guide Full"
              className="w-full object-contain max-h-[85dvh] rounded border border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,243,255,0.3); }
      `}} />
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{ touchAction: "manipulation" }}
      className={`py-3.5 sm:py-4 font-orbitron font-bold text-xs tracking-[0.14em] uppercase transition-all relative whitespace-nowrap shrink-0 cursor-pointer ${
        active ? "text-cyan-300" : "text-white/55 hover:text-white/85"
      }`}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.6)]" />
      )}
    </button>
  );
}

function PhaseStep({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-lg bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-colors">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center font-orbitron font-bold text-xs text-cyan-300 shrink-0">
        0{step}
      </div>
      <div>
        <h3 className="font-orbitron font-bold text-xs sm:text-sm tracking-[0.12em] uppercase text-white mb-1">
          {title}
        </h3>
        <p className="text-xs sm:text-sm leading-relaxed text-white/75">{desc}</p>
      </div>
    </div>
  );
}

function RoleSection({
  team,
  teamKey,
  subtitle,
  color,
  roles,
  expandedRoleId,
  onToggleRole,
}: {
  team: string;
  teamKey: string;
  subtitle: string;
  color: string;
  roles: Role[];
  expandedRoleId: string | null;
  onToggleRole: (id: string) => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h3
            className="font-orbitron font-black text-sm sm:text-base tracking-[0.2em] uppercase flex items-center gap-2.5"
            style={{ color }}
          >
            <TeamIcon team={teamKey} className="w-4 h-4" />
            {team}
          </h3>
          <div className="h-px flex-1" style={{ background: `${color}35` }} />
        </div>
        <p className="text-xs text-white/65">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const isExpanded = expandedRoleId === role.id;
          return (
            <div
              key={role.id}
              onClick={() => onToggleRole(role.id)}
              style={{ borderColor: isExpanded ? `${color}70` : "rgba(255,255,255,0.1)" }}
              className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border hover:bg-white/[0.06] transition-all cursor-pointer flex flex-col gap-3"
            >
              <div className="flex gap-3.5 sm:gap-4 items-start">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative rounded-lg overflow-hidden border bg-black/50"
                  style={{ borderColor: `${color}60`, boxShadow: `0 0 16px ${color}20` }}
                >
                  <img
                    src={role.image}
                    alt={role.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <span className="font-orbitron font-bold text-xs sm:text-sm tracking-[0.12em] uppercase text-white">
                      {role.name}
                    </span>
                    <span
                      className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded border"
                      style={{
                        borderColor: `${color}60`,
                        color,
                        backgroundColor: `${color}15`,
                      }}
                    >
                      {role.winCondition}
                    </span>
                  </div>

                  <p className="text-xs font-semibold mb-1" style={{ color }}>
                    Ability: {role.abilityName}
                  </p>
                  <p className="text-xs text-white/85 leading-relaxed">
                    {role.abilityDescription || role.ability}
                  </p>
                </div>
              </div>

              {role.notes && role.notes !== "None" && (
                <div className="px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-[11px] text-white/75 flex items-start gap-2">
                  <span className="font-bold text-cyan-300 shrink-0">Note:</span>
                  <span>{role.notes}</span>
                </div>
              )}

              {isExpanded ? (
                <div className="pt-2 border-t border-white/10 text-xs text-white/70 italic leading-relaxed whitespace-pre-line">
                  {role.lore}
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-white/45 pt-1">
                  <span className="truncate italic">{role.lore.split("\n")[0]}</span>
                  <span className="font-mono text-[10px] text-cyan-400/80 shrink-0 ml-2">
                    {isExpanded ? "Hide Lore ▲" : "Read Lore ▼"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

