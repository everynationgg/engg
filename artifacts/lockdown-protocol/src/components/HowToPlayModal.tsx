import { useEffect, useState } from "react";
import { ALIEN_ROLES, CREW_ROLES, CHAOTIC_ROLES, Role } from "@/data/roles";
import howToPlayImg from "@assets/How_to_Play.webp";
import { TeamIcon } from "@/components/TeamIcon";

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const [activeTab, setActiveTab] = useState<"phases" | "roles" | "image">("phases");

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 ix-backdrop ix-backdrop-blur"
      style={{ background: "hsl(220 30% 4% / 0.9)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg ix-modal-enter shadow-2xl"
        style={{
          background: "linear-gradient(180deg, hsl(220 28% 10%) 0%, hsl(220 28% 8%) 100%)",
          border: "1px solid hsl(185 100% 50% / 0.3)",
          boxShadow: "0 0 40px hsl(185 100% 50% / 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "hsl(210 30% 20%)" }}>
          <div>
            <h2 className="font-orbitron font-black text-xl tracking-[0.2em] uppercase" style={{ color: "hsl(185 100% 60%)", textShadow: "0 0 10px hsl(185 100% 50% / 0.5)" }}>
              HOW TO PLAY
            </h2>
            <div className="font-orbitron text-[0.65rem] tracking-[0.3em] uppercase mt-1" style={{ color: "hsl(210 30% 50%)" }}>
              ENFESTATION PROTOCOL
            </div>
          </div>
          <button
            onClick={onClose}
            className="ix-btn w-8 h-8 flex items-center justify-center rounded border font-orbitron font-bold text-sm"
            style={{
              background: "hsl(220 28% 12%)",
              borderColor: "hsl(210 30% 30%)",
              color: "hsl(210 30% 60%)",
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-4 shrink-0 border-b" style={{ borderColor: "hsl(210 30% 15%)" }}>
          <button
            onClick={() => setActiveTab("phases")}
            className="px-4 py-2 font-orbitron text-xs tracking-widest uppercase transition-colors"
            style={{
              color: activeTab === "phases" ? "hsl(185 100% 60%)" : "hsl(210 30% 50%)",
              borderBottom: activeTab === "phases" ? "2px solid hsl(185 100% 50%)" : "2px solid transparent",
            }}
          >
            Game Phases
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className="px-4 py-2 font-orbitron text-xs tracking-widest uppercase transition-colors"
            style={{
              color: activeTab === "roles" ? "hsl(185 100% 60%)" : "hsl(210 30% 50%)",
              borderBottom: activeTab === "roles" ? "2px solid hsl(185 100% 50%)" : "2px solid transparent",
            }}
          >
            Role Glossary
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className="px-4 py-2 font-orbitron text-xs tracking-widest uppercase transition-colors"
            style={{
              color: activeTab === "image" ? "hsl(185 100% 60%)" : "hsl(210 30% 50%)",
              borderBottom: activeTab === "image" ? "2px solid hsl(185 100% 50%)" : "2px solid transparent",
            }}
          >
            Quick Guide
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6" style={{ fontFamily: "'Exo 2', sans-serif" }}>
          {activeTab === "phases" ? (
            <div className="flex flex-col gap-8">
              <p className="text-sm leading-relaxed" style={{ color: "hsl(190 60% 75%)" }}>
                ENfestation is a real-time social deduction game for 3–10 players. One or more players are secretly assigned Alien roles, while the rest are Crew. Your goal depends on your team — find the Alien, or stay hidden.
              </p>

              <div className="flex flex-col gap-6">
                <PhaseStep step={1} title="Create or Join a Lobby">
                  One player creates a lobby and receives a unique room code. Share the code with friends so they can join. Each player enters a callsign (display name) before joining.
                </PhaseStep>
                <PhaseStep step={2} title="Configure Roles">
                  The host selects which roles to include. Roles belong to three teams: Crew, Alien, and Chaotic. There are always more role cards than players — extra cards are placed face-down in the center.
                </PhaseStep>
                <PhaseStep step={3} title="Role Reveal">
                  Each player is secretly assigned one role. Learn your ability, your win condition, and your team alignment. Keep your identity hidden from other players.
                </PhaseStep>
                <PhaseStep step={4} title="Orbit Phase — Use Your Ability">
                  All players use their abilities simultaneously during the Orbit phase. Some peek at center cards, some scan players, and Chaotic roles can swap or steal roles entirely without the victim knowing.
                </PhaseStep>
                <PhaseStep step={5} title="Discussion Phase">
                  After abilities resolve, a timed discussion begins. Players share information (or bluff), argue, and try to figure out who the Alien is. Trust no one completely — roles may have been swapped during Orbit.
                </PhaseStep>
                <PhaseStep step={6} title="Voting Phase">
                  All players vote simultaneously on who to eliminate. The player with the most votes is removed from the game. In the case of a tie, no one is eliminated.
                </PhaseStep>
                <PhaseStep step={7} title="Results">
                  After voting, all roles are revealed. The Crew wins if the Alien is voted out. The Alien wins by surviving the vote. Chaotic roles win or lose based on the alignment they chose during the Orbit phase.
                </PhaseStep>
              </div>
            </div>
          ) : activeTab === "roles" ? (
            <div className="flex flex-col gap-8">
              <RoleSection team="Crew" color="hsl(185 100% 50%)" glow="hsl(185 100% 50% / 0.3)" roles={CREW_ROLES} />
              <RoleSection team="Alien" color="hsl(0 75% 55%)" glow="hsl(0 75% 55% / 0.3)" roles={ALIEN_ROLES} />
              <RoleSection team="Chaotic" color="hsl(300 70% 65%)" glow="hsl(300 70% 65% / 0.3)" roles={CHAOTIC_ROLES} />
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={howToPlayImg}
                alt="Quick Guide"
                className="w-full max-w-sm rounded-lg"
                style={{ border: "1px solid hsl(185 100% 50% / 0.3)", boxShadow: "0 0 20px hsl(185 100% 50% / 0.15)" }}
                draggable={false}
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseStep({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-orbitron font-bold text-sm"
        style={{
          background: "hsl(185 100% 15%)",
          border: "1px solid hsl(185 100% 50%)",
          color: "hsl(185 100% 70%)",
          boxShadow: "0 0 10px hsl(185 100% 50% / 0.3)",
        }}
      >
        {step}
      </div>
      <div>
        <h3 className="font-orbitron font-bold tracking-widest uppercase text-sm mb-1" style={{ color: "hsl(190 80% 90%)" }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(190 60% 70%)" }}>
          {children}
        </p>
      </div>
    </div>
  );
}

function RoleSection({ team, color, glow, roles }: { team: string; color: string; glow: string; roles: Role[] }) {
  return (
    <div>
      <h3 className="font-orbitron font-black text-lg tracking-[0.2em] uppercase mb-4 border-b pb-2 flex items-center" style={{ color, borderColor: glow, textShadow: `0 0 10px ${glow}` }}>
        {team} TEAM <TeamIcon team={team} className="ml-3" />
      </h3>
      <div className="flex flex-col gap-4">
        {roles.map((role) => (
          <div key={role.id} className="flex gap-4 p-3 rounded-lg" style={{ background: "hsl(220 28% 12%)", border: `1px solid ${glow}` }}>
            <img src={role.image} alt={role.name} className="w-16 h-16 rounded object-cover border" style={{ borderColor: color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-orbitron font-bold tracking-widest uppercase text-sm" style={{ color: "hsl(190 80% 90%)" }}>
                  {role.name}
                </div>
                <div className="font-orbitron text-[0.6rem] tracking-widest uppercase px-2 py-0.5 rounded text-center ml-2 shrink-0" style={{ background: glow, color }}>
                  {role.winCondition}
                </div>
              </div>
              <p className="text-[0.65rem] mb-2 font-orbitron tracking-widest uppercase" style={{ color }}>
                Ability: <span style={{ color: "hsl(190 80% 90%)" }}>{role.ability || "None"}</span>
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(190 60% 65%)" }}>
                {role.lore.split("\n")[0]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
