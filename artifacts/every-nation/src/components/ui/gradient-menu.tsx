import React from 'react';
import { IoShareSocialOutline, IoHeartOutline, IoHomeOutline } from 'react-icons/io5';

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
      title: 'Join Discord',
      icon: <IoShareSocialOutline />,
      gradientFrom: '#56CCF2',
      gradientTo: '#2F80ED',
      onClick: onDiscord,
      size: 'md',
    },
    {
      title: 'Enter Hub',
      icon: <IoHomeOutline />,
      gradientFrom: '#a955ff',
      gradientTo: '#ea51ff',
      onClick: onEnter,
      size: 'lg',
    },
    {
      title: 'Social Links',
      icon: <IoHeartOutline />,
      gradientFrom: '#ffa9c6',
      gradientTo: '#f434e2',
      onClick: onSocials,
      size: 'md',
    },
  ];

  return (
    <ul className="flex items-center gap-6 md:gap-10">
      {items.map(({ title, icon, gradientFrom, gradientTo, onClick, size }, idx) => {
        const isLg = size === 'lg';
        const baseSize = isLg ? 'w-16 h-16 md:w-20 md:h-20' : 'w-14 h-14 md:w-16 md:h-16';
        const expandedWidth = isLg ? 'hover:w-[190px] md:hover:w-[220px]' : 'hover:w-[160px] md:hover:w-[190px]';
        const iconSize = isLg ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl';
        const textSize = isLg ? 'text-sm md:text-base tracking-widest' : 'text-xs md:text-sm tracking-widest';

        return (
          <li
            key={idx}
            onClick={onClick}
            style={
              {
                '--gradient-from': gradientFrom,
                '--gradient-to': gradientTo,
              } as React.CSSProperties & { [key: string]: string }
            }
            className={`relative ${baseSize} ${expandedWidth} bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-full flex items-center justify-center transition-all duration-500 hover:shadow-none group cursor-pointer`}
          >
            {/* Gradient fill on hover */}
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100" />

            {/* Glow */}
            <span className="absolute top-[10px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[18px] opacity-0 -z-10 transition-all duration-500 group-hover:opacity-60" />

            {/* Icon */}
            <span className={`relative z-10 transition-all duration-300 group-hover:scale-0 group-hover:opacity-0 text-white ${iconSize}`}>
              {icon}
            </span>

            {/* Label */}
            <span className={`absolute z-10 text-white uppercase font-orbitron ${textSize} transition-all duration-300 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 delay-100 whitespace-nowrap`}>
              {title}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
