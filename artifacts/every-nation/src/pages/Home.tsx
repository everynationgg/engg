import { useLocation } from "wouter";
import LandingNav from "@/components/ui/gradient-menu";

const HOME_HERO_IMAGE = "/images/home/home-hero.webp";
const HOME_HERO_MOBILE_IMAGE = "/images/home/home-hero-mobile.webp";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="landing-root relative h-screen min-h-[100dvh] overflow-hidden bg-[#02040a] text-white">
      <style>{`
        .home-hero-image {
          object-position: center center;
        }

        .home-actions {
          bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);
        }

        @media (max-width: 639px) and (orientation: portrait) {
          .home-hero-image {
            object-position: center 45%;
          }
        }

        @media (min-width: 1280px) {
          .home-actions {
            bottom: 4rem;
          }
        }
      `}</style>
      <div className="absolute inset-0 bg-[#02040a]" aria-hidden="true" />

      <picture
        className="absolute inset-0 block h-full w-full bg-[#02040a]"
        aria-hidden="true"
      >
        <source
          media="(max-width: 639px) and (orientation: portrait)"
          srcSet={HOME_HERO_MOBILE_IMAGE}
        />
        <img
          src={HOME_HERO_IMAGE}
          alt=""
          className="home-hero-image h-full w-full bg-[#02040a] object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </picture>

      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.1)_48%,rgba(0,0,0,0.44)_100%)]"
        aria-hidden="true"
      />

      <div className="home-actions absolute left-1/2 z-30 flex w-full -translate-x-1/2 justify-center px-4">
        <div>
          <LandingNav
            onDiscord={() => window.open("https://discord.gg/everynation", "_blank")}
            onEnter={() => navigate("/hub")}
            onSocials={() => window.open("https://linktr.ee/everynationgg", "_blank")}
          />
        </div>
      </div>
    </div>
  );
}
