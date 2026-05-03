import { cn } from "@/lib/utils";
import { FaExternalLinkAlt, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";

interface GameGalleryItem {
  title: string;
  description: string;
  image: string;
  href?: string;
  status: "online" | "offline";
  subtitle?: string;
  index: number;
}

interface GameGalleryProps {
  games: GameGalleryItem[];
}

export default function GameGallery({ games }: GameGalleryProps) {
  return (
    <div className="flex items-stretch gap-2 w-full h-[480px] md:h-[560px]">
      {games.map(({ title, description, image, href, status, subtitle, index }) => {
        const isOffline = status === "offline";

        const handleEntry = () => {
          if (!isOffline && href) {
            window.location.href = href;
          }
        };

        return (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.12 }}
            onClick={handleEntry}
            className={cn(
              "relative group flex-grow transition-all duration-700 rounded-sm overflow-hidden",
              "w-24 md:w-40",
              "hover:w-full",
              isOffline ? "cursor-not-allowed grayscale" : "cursor-pointer"
            )}
          >
            {/* Background image */}
            <img
              src={image}
              alt={title}
              className={cn(
                "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[3000ms] ease-out",
                !isOffline && "group-hover:scale-105"
              )}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:from-black/80 group-hover:via-black/20 transition-all duration-700" />

            {/* Cyan border accent on hover */}
            {!isOffline && (
              <div className="absolute inset-0 border border-transparent group-hover:border-cyan-500/30 rounded-sm transition-all duration-500 pointer-events-none" />
            )}

            {/* Top title — always visible */}
            <div className="absolute top-0 left-0 right-0 px-4 pt-4 z-20">
              <h2 className={cn(
                "font-orbitron font-black text-[10px] tracking-[0.3em] uppercase transition-colors duration-300 truncate",
                isOffline ? "text-white/30" : "text-white/70 group-hover:text-cyan-400"
              )}>
                {title}
              </h2>
              <div className="w-full h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Bottom content — revealed on expand */}
            <div className="absolute inset-x-4 bottom-5 z-20 flex flex-col gap-2">
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                <div className={cn("w-1 h-1 rounded-full shrink-0", isOffline ? "bg-red-500/40" : "bg-cyan-500")} />
                <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/40 truncate">
                  {subtitle}
                </span>
              </div>

              <p className="font-mono text-[9px] uppercase tracking-wider text-white/40 leading-relaxed line-clamp-3 group-hover:text-white/60 transition-colors duration-300 opacity-0 group-hover:opacity-100 delay-150">
                {description}
              </p>

              {!isOffline && (
                <div className="flex items-center gap-2 text-cyan-400/60 group-hover:text-cyan-400 transition-colors duration-300 opacity-0 group-hover:opacity-100 delay-200 mt-2">
                  <span className="font-orbitron text-[8px] uppercase tracking-[0.4em] font-bold">Deploy_Link</span>
                  <FaExternalLinkAlt className="text-[7px]" />
                </div>
              )}

              {isOffline && (
                <div className="flex items-center gap-2 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 mt-2">
                  <FaLock className="text-[9px]" />
                  <span className="font-orbitron text-[8px] uppercase tracking-[0.4em]">Sector_Locked</span>
                </div>
              )}
            </div>

            {/* Vertical title for collapsed state */}
            <div className="absolute inset-0 flex items-center justify-center z-10 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
              <span className={cn(
                "font-orbitron font-black text-[9px] tracking-[0.3em] uppercase writing-vertical rotate-180",
                isOffline ? "text-white/20" : "text-white/50"
              )}
                style={{ writingMode: "vertical-rl" }}
              >
                {title}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
