import React from 'react';
import { FaDiscord } from 'react-icons/fa';
import { IoHeartOutline } from 'react-icons/io5';

interface GradientNavItem {
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
  size?: 'md' | 'lg';
}

interface LandingNavProps {
  onDiscord: () => void;
  onEnter: () => void;
  onSocials: () => void;
}

export default function LandingNav({ onDiscord, onEnter, onSocials }: LandingNavProps) {
  const items: GradientNavItem[] = [
    {
      title: 'Discord',
      icon: <FaDiscord />,
      gradientFrom: '#ff9f45',
      gradientTo: '#56CCF2',
      onClick: onDiscord,
      size: 'md',
    },
    {
      title: 'ENTER',
      icon: null,
      gradientFrom: '#875cff',
      gradientTo: '#ea51ff',
      onClick: onEnter,
      size: 'lg',
    },
    {
      title: 'Socials',
      icon: <IoHeartOutline />,
      gradientFrom: '#b66cff',
      gradientTo: '#f434e2',
      onClick: onSocials,
      size: 'md',
    },
  ];

  return (
    <ul className="home-nav-list flex items-center gap-2 sm:gap-4 md:gap-8">
      {items.map(({ title, icon, gradientFrom, gradientTo, onClick, size }, idx) => {
        const isLg = size === 'lg';
        const buttonWidth = isLg ? 'clamp(7.15rem, 32vw, 14.25rem)' : 'clamp(6.1rem, 27vw, 11.8rem)';
        const buttonHoverWidth = isLg ? 'clamp(8.4rem, 36vw, 16rem)' : 'clamp(6.9rem, 29vw, 12.75rem)';
        const buttonHeight = isLg ? 'clamp(3.25rem, 6vw, 4.75rem)' : 'clamp(3rem, 5.4vw, 4.25rem)';
        const buttonMobileSize = isLg ? '3.7rem' : '3.45rem';
        const iconSize = isLg ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl';
        const textSize = isLg ? 'text-[0.68rem] md:text-sm tracking-[0.32em]' : 'text-[0.62rem] md:text-xs tracking-[0.28em]';
        const navTone = title === 'Discord' ? '#ffb35c' : title === 'ENTER' ? '#d45cff' : '#bf68ff';
        const navGlow = title === 'Discord' ? 'rgba(255, 166, 70, 0.52)' : title === 'ENTER' ? 'rgba(195, 82, 255, 0.72)' : 'rgba(186, 94, 255, 0.5)';

        return (
          <li
            key={title}
            style={
              {
                '--nav-delay': `${720 + idx * 120}ms`,
              } as React.CSSProperties & { [key: string]: string }
            }
            className="home-nav-item relative flex items-center justify-center"
          >
            <button
              type="button"
              aria-label={title}
              data-nav-title={title}
              onClick={onClick}
              style={
                {
                  '--gradient-from': gradientFrom,
                  '--gradient-to': gradientTo,
                  '--nav-width': buttonWidth,
                  '--nav-hover-width': buttonHoverWidth,
                  '--nav-height': buttonHeight,
                  '--nav-mobile-size': buttonMobileSize,
                  '--nav-tone': navTone,
                  '--nav-glow': navGlow,
                } as React.CSSProperties & { [key: string]: string }
              }
              className="home-nav-button group relative isolate appearance-none overflow-visible rounded-full shadow-lg flex items-center justify-center"
            >
              <span className="home-nav-fill pointer-events-none absolute rounded-full" />

              <span className="home-nav-glow pointer-events-none absolute -z-10 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[18px]" />

              {icon && (
                <span className={`home-nav-icon relative z-10 text-white ${iconSize}`}>
                  {icon}
                </span>
              )}

              <span className={`home-nav-label pointer-events-none z-10 whitespace-nowrap text-white uppercase font-orbitron ${textSize}`}>
                {title}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
