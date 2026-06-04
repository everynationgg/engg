import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button'; 
import { cn } from '@/lib/utils'; 

interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle: string;
  images: {
    src: string;
    alt: string;
    subtitle?: string;
    onClick?: () => void;
    status?: "online" | "offline";
  }[];
}

export const HeroSection = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ title, subtitle, images, className, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const handleNext = React.useCallback(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, [images.length]);

    const handlePrev = () => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };
    
    // Removed auto-advance per user request

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full min-h-[560px] md:min-h-[620px] flex flex-col items-center justify-center overflow-x-hidden p-3 sm:p-4',
          className
        )}
        {...props}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" aria-hidden="true">
            <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(0,243,255,0.3),rgba(255,255,255,0))]"></div>
            <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(0,123,255,0.3),rgba(255,255,255,0))]"></div>
        </div>

        {/* Content */}
        <div className="z-10 flex w-full flex-col items-center text-center space-y-7 md:space-y-12">
          {/* Header Section */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-orbitron font-bold tracking-widest max-w-4xl uppercase text-white">
              {title}
            </h1>
            <p className="max-w-2xl mx-auto text-white/70 font-mono tracking-widest uppercase text-[11px] md:text-sm">
              {subtitle}
            </p>
          </div>

          {/* Main Showcase Section */}
          <div className="relative w-full h-[380px] sm:h-[420px] md:h-[520px] flex items-center justify-center">
            {/* Carousel Wrapper */}
            <div className="relative w-full h-full flex items-center justify-center [perspective:1000px]">
              {images.map((image, index) => {
                const offset = index - currentIndex;
                const total = images.length;
                let pos = (offset + total) % total;
                if (pos > Math.floor(total / 2)) {
                  pos = pos - total;
                }

                const isCenter = pos === 0;
                const isAdjacent = Math.abs(pos) === 1;

                return (
                  <div
                    key={image.src}
                    onClick={() => {
                        if (isCenter && image.onClick && image.status !== "offline") {
                            image.onClick();
                        } else if (!isCenter) {
                            setCurrentIndex(index);
                        }
                    }}
                    className={cn(
                      'absolute w-[min(72vw,16rem)] h-[min(108vw,24rem)] sm:w-64 sm:h-96 md:w-[330px] md:h-[460px] transition-all duration-500 ease-in-out',
                      'flex items-center justify-center cursor-pointer group'
                    )}
                    style={{
                      transform: `
                        translateX(${(pos) * 45}%) 
                        scale(${isCenter ? 1 : isAdjacent ? 0.85 : 0.7})
                        rotateY(${(pos) * -10}deg)
                      `,
                      zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                      opacity: isCenter ? 1 : isAdjacent ? 0.4 : 0,
                      filter: isCenter ? 'blur(0px)' : 'blur(4px)',
                      visibility: Math.abs(pos) > 1 ? 'hidden' : 'visible',
                    }}
                  >
                    <div className={cn(
                        "w-full h-full relative rounded-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300",
                        isCenter && image.status !== "offline" && "group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(0,243,255,0.2)]",
                        image.status === "offline" && "grayscale opacity-80 cursor-not-allowed"
                    )}>
                        <img
                          src={image.src}
                          alt={image.alt}
                          width={660}
                          height={920}
                          loading={isCenter ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={isCenter ? "high" : "low"}
                          sizes="(min-width: 768px) 330px, min(72vw, 256px)"
                          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent pointer-events-none" />
                        <div className="absolute left-4 top-4 rounded-full border border-cyan-300/25 bg-black/55 px-3 py-1 backdrop-blur-sm">
                          <span className={cn(
                            "font-mono text-[9px] uppercase tracking-[0.22em]",
                            image.status === "offline" ? "text-red-300" : "text-cyan-200"
                          )}>
                            {image.status === "offline" ? "Locked" : "Online"}
                          </span>
                        </div>
                        
                        {/* Title Overlay */}
                        <div className="absolute bottom-5 left-0 w-full text-center px-5">
                            <h3 className={cn(
                                "font-orbitron font-bold text-base md:text-xl tracking-widest uppercase text-white transition-colors",
                                isCenter && image.status !== "offline" && "text-cyan-400"
                            )}>
                                {image.alt}
                            </h3>
                            {image.subtitle && (
                              <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-white/70 font-mono">
                                {image.subtitle}
                              </p>
                            )}
                            <span className={cn(
                              "mt-4 inline-flex border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em]",
                              image.status === "offline"
                                ? "border-red-400/25 text-red-300/80"
                                : "border-cyan-300/30 text-cyan-200"
                            )}>
                              {image.status === "offline" ? "Standby" : "Deploy"}
                            </span>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 z-20 bg-black/50 backdrop-blur-md border-white/10 hover:bg-black/80 hover:text-cyan-400"
              onClick={handlePrev}
              aria-label="Previous game"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 z-20 bg-black/50 backdrop-blur-md border-white/10 hover:bg-black/80 hover:text-cyan-400"
              onClick={handleNext}
              aria-label="Next game"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

HeroSection.displayName = 'HeroSection';
