import { motion } from "framer-motion";
import { FaExternalLinkAlt, FaLock } from "react-icons/fa";

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  href?: string;
  status: "online" | "offline";
  subtitle?: string;
}

function GameCard({ title, description, image, href, status, subtitle }: GameCardProps) {
  const isOffline = status === "offline";

  const handleEntry = () => {
    if (!isOffline && href) {
      window.location.href = href;
    }
  };

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-[400px]">
      {/* HUD Header */}
      <div className="w-full flex flex-col items-center gap-4">
        <img src="/hub_bracket.png" alt="HUD Bracket" className="w-48 h-auto opacity-80" />
        <h2 className="font-orbitron font-black text-xl tracking-[0.2em] uppercase text-white whitespace-nowrap">
          {title}
        </h2>
      </div>

      {/* Main Card */}
      <motion.div
        whileHover={!isOffline ? { scale: 1.03, y: -10 } : {}}
        onClick={handleEntry}
        className={`relative w-full aspect-[3/4] transition-all duration-500 overflow-hidden ${isOffline ? "cursor-not-allowed opacity-60 grayscale" : "cursor-pointer group"
          }`}
        style={{
          background: "linear-gradient(180deg, #0a0b1e 0%, #05060d 100%)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.05)"
        }}
      >
        {/* Glowing border for active card */}
        {!isOffline && (
          <div className="absolute inset-0 border-2 border-cyan-500/0 group-hover:border-cyan-500/30 transition-colors z-20 rounded-[24px]" />
        )}

        {/* The Clipped Image Container */}
        <div className="absolute inset-6 z-10">
          <div
            className="w-full h-full relative overflow-hidden"
            style={{
              clipPath: "polygon(0 0, 75% 0, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0 75%, 0 0)",
              background: "rgba(0,0,0,0.4)"
            }}
          >
            <img
              src={image}
              alt={title}
              className={`w-full h-full object-cover transition-transform duration-1000 ${!isOffline && "group-hover:scale-110"
                }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05060d]/80 via-transparent to-transparent" />

            {isOffline && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <FaLock className="text-white/20 text-4xl" />
              </div>
            )}
          </div>
        </div>

        {/* Decorative HUD Elements inside card */}
        <div className="absolute bottom-4 left-6 z-20 flex flex-col gap-1">
          <span className="font-mono text-[8px] uppercase tracking-widest text-cyan-500/60">Node_ID: 0x449</span>
          <div className="w-12 h-0.5 bg-cyan-500/20" />
        </div>
      </motion.div>

      {/* Description Pod */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-center"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 leading-relaxed">
          {subtitle}<br />
          {description}
        </p>
        {!isOffline && (
          <div className="mt-4 flex items-center justify-center gap-3 text-cyan-400 font-orbitron text-[9px] uppercase tracking-[0.4em] font-bold">
            Initialize <FaExternalLinkAlt className="text-[8px]" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function Hub() {
  const games = [
    {
      title: "ERROR: Newform Detected",
      subtitle: "A Social Deduction game etc",
      description: "A high-stakes social deduction engine. Identify the Virus before the system collapses.",
      image: "/hub_lockdown.png",
      href: "/end",
      status: "online" as const
    },
    {
      title: "TRIPLE TRIAD ONLINE",
      subtitle: "A Social Deduction game etc",
      description: "Strategic card warfare. Collect, trade, and dominate the digital grid.",
      image: "/hub_triad.png",
      status: "offline" as const
    },
    {
      title: "TOWER DEFENSE",
      subtitle: "A Social Deduction game etc",
      description: "Coordinate orbital defenses. Protect the core from relentless machine swarms.",
      image: "/hub_td.png",
      status: "offline" as const
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-24 relative flex flex-col items-center justify-center overflow-x-hidden">
      {/* Background Layer */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hub_bg.png')" }}
      />
      <div className="fixed inset-0 z-1 bg-black/30" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[1440px] px-12 py-32">
        <div className="flex flex-col md:flex-row items-start justify-center gap-12 lg:gap-20">
          {games.map((game, i) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex-1"
            >
              <GameCard {...game} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="relative z-10 mt-auto pb-12 opacity-30">
        <span className="font-orbitron text-[10px] uppercase tracking-[0.8em]">ENGG // CENTRAL_RELAY</span>
      </div>
    </div>
  );
}
