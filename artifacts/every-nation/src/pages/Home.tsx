import type { CSSProperties } from "react";
import { useLocation } from "wouter";
import LandingNav from "@/components/ui/gradient-menu";

const HOME_HERO_IMAGE = "/engg_homepage.webp";
const HOME_LOGO_IMAGE = "/images/home/en_logo.webp";

type HomeParticle = {
  id: string;
  left: string;
  top: string;
  size: number;
  color: string;
  opacity: string;
  duration: string;
  delay: string;
  travelX: string;
  travelY: string;
};

const DESKTOP_PARTICLES: HomeParticle[] = [
  { id: "d1", left: "7%", top: "15%", size: 2, color: "rgba(140, 235, 255, 0.95)", opacity: "0.36", duration: "22s", delay: "-2s", travelX: "28px", travelY: "-66px" },
  { id: "d2", left: "15%", top: "30%", size: 2, color: "rgba(255, 191, 112, 0.9)", opacity: "0.3", duration: "26s", delay: "-10s", travelX: "-24px", travelY: "-54px" },
  { id: "d3", left: "24%", top: "12%", size: 1, color: "rgba(196, 130, 255, 0.9)", opacity: "0.34", duration: "24s", delay: "-6s", travelX: "18px", travelY: "-62px" },
  { id: "d4", left: "34%", top: "22%", size: 2, color: "rgba(156, 238, 255, 0.9)", opacity: "0.28", duration: "28s", delay: "-15s", travelX: "-28px", travelY: "-50px" },
  { id: "d5", left: "67%", top: "14%", size: 1, color: "rgba(255, 198, 126, 0.9)", opacity: "0.32", duration: "21s", delay: "-4s", travelX: "24px", travelY: "-54px" },
  { id: "d6", left: "82%", top: "24%", size: 2, color: "rgba(194, 124, 255, 0.95)", opacity: "0.38", duration: "27s", delay: "-18s", travelX: "-30px", travelY: "-64px" },
  { id: "d7", left: "91%", top: "37%", size: 1, color: "rgba(152, 235, 255, 0.9)", opacity: "0.3", duration: "23s", delay: "-9s", travelX: "-30px", travelY: "-46px" },
  { id: "d8", left: "10%", top: "63%", size: 1, color: "rgba(210, 142, 255, 0.9)", opacity: "0.28", duration: "28s", delay: "-13s", travelX: "26px", travelY: "-58px" },
  { id: "d9", left: "22%", top: "78%", size: 2, color: "rgba(255, 184, 100, 0.85)", opacity: "0.3", duration: "25s", delay: "-20s", travelX: "-25px", travelY: "-50px" },
  { id: "d10", left: "40%", top: "73%", size: 1, color: "rgba(144, 238, 255, 0.95)", opacity: "0.28", duration: "20s", delay: "-7s", travelX: "22px", travelY: "-44px" },
  { id: "d11", left: "58%", top: "82%", size: 1, color: "rgba(186, 122, 255, 0.9)", opacity: "0.27", duration: "28s", delay: "-22s", travelX: "-28px", travelY: "-54px" },
  { id: "d12", left: "73%", top: "71%", size: 2, color: "rgba(255, 196, 120, 0.9)", opacity: "0.32", duration: "22s", delay: "-3s", travelX: "28px", travelY: "-50px" },
  { id: "d13", left: "87%", top: "62%", size: 1, color: "rgba(146, 234, 255, 0.9)", opacity: "0.26", duration: "26s", delay: "-16s", travelX: "-22px", travelY: "-46px" },
  { id: "d14", left: "49%", top: "19%", size: 1, color: "rgba(255, 187, 104, 0.85)", opacity: "0.26", duration: "24s", delay: "-19s", travelX: "18px", travelY: "-44px" },
  { id: "d15", left: "4%", top: "44%", size: 1, color: "rgba(184, 132, 255, 0.9)", opacity: "0.28", duration: "28s", delay: "-24s", travelX: "30px", travelY: "-48px" },
  { id: "d16", left: "96%", top: "13%", size: 2, color: "rgba(160, 234, 255, 0.85)", opacity: "0.28", duration: "25s", delay: "-8s", travelX: "-29px", travelY: "-60px" },
];

const MOBILE_PARTICLES: HomeParticle[] = [
  { id: "m1", left: "8%", top: "17%", size: 2, color: "rgba(144, 235, 255, 0.9)", opacity: "0.25", duration: "22s", delay: "-5s", travelX: "13px", travelY: "-30px" },
  { id: "m2", left: "84%", top: "16%", size: 2, color: "rgba(194, 124, 255, 0.9)", opacity: "0.26", duration: "26s", delay: "-14s", travelX: "-14px", travelY: "-30px" },
  { id: "m3", left: "12%", top: "66%", size: 1, color: "rgba(255, 194, 116, 0.85)", opacity: "0.22", duration: "28s", delay: "-9s", travelX: "12px", travelY: "-22px" },
  { id: "m4", left: "88%", top: "70%", size: 1, color: "rgba(148, 232, 255, 0.85)", opacity: "0.22", duration: "24s", delay: "-17s", travelX: "-13px", travelY: "-22px" },
  { id: "m5", left: "31%", top: "84%", size: 1, color: "rgba(188, 124, 255, 0.85)", opacity: "0.2", duration: "27s", delay: "-22s", travelX: "14px", travelY: "-28px" },
  { id: "m6", left: "94%", top: "34%", size: 1, color: "rgba(255, 186, 104, 0.75)", opacity: "0.2", duration: "23s", delay: "-3s", travelX: "-12px", travelY: "-22px" },
  { id: "m7", left: "5%", top: "74%", size: 1, color: "rgba(146, 234, 255, 0.8)", opacity: "0.21", duration: "28s", delay: "-19s", travelX: "13px", travelY: "-24px" },
];

const HOME_MOTION_STYLES = `
  .home-hero-layer,
  .home-hero-layer::after,
  .home-twinkle-field,
  .home-twinkle-field::before,
  .home-twinkle-field::after,
  .home-red-flare-field,
  .home-red-flare-field::before,
  .home-red-flare-field::after,
  .home-power-shade,
  .home-brand-layer,
  .home-logo-layer,
  .home-welcome-line,
  .home-logo-glow,
  .home-atmosphere,
  .home-particles {
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-user-drag: none;
    -webkit-touch-callout: none;
  }

  .home-hero-layer {
    opacity: 1;
    overflow: hidden;
  }

  .home-hero-layer::before {
    content: "";
    position: absolute;
    inset: -6%;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    transform: translate3d(0, 0, 0) scale(1.018);
    transform-origin: center center;
  }

  .home-hero-layer::before {
    background-image: url("${HOME_HERO_IMAGE}");
  }

  .home-hero-layer::after {
    content: "";
    position: absolute;
    inset: -8%;
    background:
      radial-gradient(circle at 14% 18%, rgba(255, 220, 168, 0.72) 0 1px, transparent 2px),
      radial-gradient(circle at 29% 8%, rgba(255, 255, 255, 0.56) 0 1px, transparent 2px),
      radial-gradient(circle at 47% 19%, rgba(255, 203, 128, 0.5) 0 1px, transparent 2px),
      radial-gradient(circle at 73% 16%, rgba(255, 255, 255, 0.62) 0 1px, transparent 2px),
      radial-gradient(circle at 86% 32%, rgba(255, 211, 154, 0.46) 0 1px, transparent 2px),
      radial-gradient(circle at 17% 62%, rgba(255, 244, 220, 0.48) 0 1px, transparent 2px),
      radial-gradient(circle at 64% 72%, rgba(255, 208, 130, 0.4) 0 1px, transparent 2px),
      radial-gradient(circle at 92% 68%, rgba(255, 255, 255, 0.45) 0 1px, transparent 2px);
    background-size:
      360px 260px,
      520px 340px,
      430px 310px,
      590px 390px,
      480px 330px,
      550px 360px,
      410px 300px,
      620px 410px;
    opacity: 0.42;
    mix-blend-mode: screen;
    transform: translate3d(0, 0, 0);
    animation: home-starfield-drift 34s linear infinite;
  }

  .home-twinkle-field {
    overflow: hidden;
    mix-blend-mode: screen;
    opacity: 0.78;
  }

  .home-twinkle-field::before,
  .home-twinkle-field::after {
    content: "";
    position: absolute;
    inset: -8%;
    background-repeat: repeat;
    transform: translate3d(0, 0, 0);
    will-change: opacity, filter;
  }

  .home-twinkle-field::before {
    background:
      radial-gradient(circle at 8% 14%, rgba(255, 247, 226, 0.95) 0 1px, transparent 2px),
      radial-gradient(circle at 22% 38%, rgba(255, 196, 112, 0.74) 0 1px, transparent 2px),
      radial-gradient(circle at 36% 18%, rgba(255, 255, 255, 0.9) 0 1px, transparent 2px),
      radial-gradient(circle at 54% 33%, rgba(255, 215, 148, 0.72) 0 1px, transparent 2px),
      radial-gradient(circle at 71% 12%, rgba(255, 255, 255, 0.86) 0 1px, transparent 2px),
      radial-gradient(circle at 88% 42%, rgba(218, 174, 255, 0.68) 0 1px, transparent 2px);
    background-size: 320px 240px, 420px 300px, 520px 380px, 390px 290px, 560px 410px, 470px 350px;
    opacity: 0.36;
    filter: brightness(0.85);
    animation: home-stars-blink-a 3.4s ease-in-out infinite alternate;
  }

  .home-twinkle-field::after {
    background:
      radial-gradient(circle at 16% 22%, rgba(255, 255, 255, 0.9) 0 1px, transparent 2px),
      radial-gradient(circle at 42% 11%, rgba(255, 186, 96, 0.74) 0 1px, transparent 2px),
      radial-gradient(circle at 63% 46%, rgba(255, 244, 210, 0.82) 0 1px, transparent 2px),
      radial-gradient(circle at 83% 18%, rgba(255, 255, 255, 0.7) 0 1px, transparent 2px),
      radial-gradient(circle at 94% 62%, rgba(255, 178, 100, 0.62) 0 1px, transparent 2px);
    background-size: 460px 330px, 610px 420px, 370px 280px, 520px 360px, 690px 480px;
    opacity: 0.22;
    filter: brightness(0.82);
    animation: home-stars-blink-b 4.8s ease-in-out 420ms infinite alternate;
  }

  .home-red-flare-field {
    overflow: hidden;
    mix-blend-mode: screen;
    opacity: 0.96;
  }

  .home-red-flare-field::before,
  .home-red-flare-field::after {
    content: "";
    position: absolute;
    inset: -10%;
    transform: translate3d(0, 0, 0);
  }

  .home-red-flare-field::before {
    background:
      radial-gradient(circle at 8% 59%, rgba(255, 236, 196, 0.68) 0 1.2%, rgba(255, 86, 36, 0.54) 3.4%, rgba(218, 28, 18, 0.26) 8.5%, transparent 18%),
      radial-gradient(ellipse 20% 30% at 11% 48%, rgba(255, 86, 32, 0.36), rgba(190, 28, 18, 0.2) 44%, transparent 80%),
      radial-gradient(ellipse 36% 21% at 17% 71%, rgba(255, 110, 32, 0.24), rgba(255, 44, 20, 0.11) 46%, transparent 82%),
      linear-gradient(112deg, transparent 2%, rgba(255, 56, 28, 0.2) 11%, rgba(255, 126, 48, 0.12) 23%, transparent 39%);
    filter: blur(2px) saturate(1.34) brightness(1.04);
    opacity: 0.86;
  }

  .home-red-flare-field::after {
    background:
      radial-gradient(circle at 50% 69%, rgba(255, 236, 188, 0.38) 0 1%, rgba(255, 72, 28, 0.26) 4.5%, transparent 15%),
      radial-gradient(ellipse 55% 13% at 50% 72%, rgba(255, 64, 28, 0.24), rgba(255, 126, 46, 0.12) 42%, transparent 84%),
      radial-gradient(ellipse 28% 12% at 29% 76%, rgba(255, 46, 22, 0.18), transparent 78%),
      radial-gradient(ellipse 24% 10% at 72% 74%, rgba(206, 32, 22, 0.14), transparent 78%);
    filter: blur(4px) saturate(1.24) brightness(1.02);
    opacity: 0.56;
  }

  .home-power-shade {
    background:
      radial-gradient(ellipse 72% 42% at 50% 44%, rgba(8, 6, 24, 0.14), rgba(0, 0, 0, 0.58) 76%),
      rgba(0, 0, 0, 0.42);
    opacity: 1;
    animation: home-scene-power-on 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .home-brand-layer {
    position: absolute;
    left: 50%;
    top: clamp(14rem, 42vh, 28rem);
    width: min(56rem, 62vw);
    max-width: calc(100vw - 2rem);
    text-align: center;
    transform: translate3d(-50%, -50%, 0);
    transform-origin: center center;
  }

  .home-logo-layer {
    position: relative;
    width: 100%;
    aspect-ratio: 2023 / 777;
    background-image: url("${HOME_LOGO_IMAGE}");
    background-position: center center;
    background-repeat: no-repeat;
    background-size: contain;
    filter:
      brightness(1.03)
      contrast(1.1)
      saturate(1.08)
      drop-shadow(0 0 10px rgba(255, 176, 76, 0.22))
      drop-shadow(0 0 16px rgba(190, 86, 255, 0.18));
    mix-blend-mode: normal;
    opacity: 1;
    transform: scale(1);
    transform-origin: center center;
    animation: home-logo-layer-charge 1150ms cubic-bezier(0.16, 1, 0.3, 1) 420ms both;
  }

  .home-logo-layer::after {
    content: none;
    position: absolute;
    inset: 0;
    background:
      linear-gradient(108deg, transparent 38%, rgba(255, 235, 174, 0.0) 44%, rgba(255, 218, 138, 0.2) 50%, transparent 58%);
    filter: blur(0.5px);
    mix-blend-mode: screen;
    opacity: 0;
    transform: translate3d(-42%, 0, 0) skewX(-10deg);
    animation: none;
  }

  .home-welcome-line {
    margin-top: clamp(0.2rem, 0.75vh, 0.65rem);
    color: rgba(255, 255, 255, 0.88);
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(1.15rem, 2vw, 2.45rem);
    font-weight: 400;
    letter-spacing: clamp(0.08em, 0.55vw, 0.18em);
    line-height: 1;
    text-transform: uppercase;
    text-shadow:
      0 0 8px rgba(255, 255, 255, 0.22),
      0 0 18px rgba(195, 118, 255, 0.2),
      0 1px 3px rgba(0, 0, 0, 0.78);
    white-space: nowrap;
  }

  .home-logo-glow {
    --home-logo-glow-opacity: 0.2;
    --home-logo-glow-soft-opacity: 0.06;
    background:
      radial-gradient(ellipse 24% 11% at 41% 41%, rgba(255, 176, 76, 0.2), transparent 82%),
      radial-gradient(ellipse 28% 13% at 59% 41%, rgba(166, 88, 255, 0.14), transparent 84%),
      radial-gradient(ellipse 54% 24% at 51% 42%, rgba(255, 210, 138, 0.035), transparent 86%);
    mix-blend-mode: screen;
    opacity: var(--home-logo-glow-opacity);
    transform: translate3d(0, 0, 0) scale(1);
    animation: home-logo-glow-pulse 8.5s ease-in-out 1900ms infinite alternate;
  }

  .home-logo-glow::before {
    content: "";
    position: absolute;
    inset: -4%;
    background:
      radial-gradient(ellipse 28% 12% at 41% 41%, rgba(255, 210, 110, 0.86), transparent 82%),
      radial-gradient(ellipse 32% 14% at 59% 41%, rgba(186, 104, 255, 0.5), transparent 84%),
      radial-gradient(ellipse 58% 22% at 51% 42%, rgba(255, 210, 138, 0.1), transparent 88%);
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.94);
    animation: home-logo-charge 1500ms cubic-bezier(0.16, 1, 0.3, 1) 280ms forwards;
  }

  .home-atmosphere {
    overflow: hidden;
    mix-blend-mode: screen;
    opacity: 0.62;
  }

  .home-atmosphere::before {
    --home-atmosphere-opacity-low: 0.12;
    --home-atmosphere-opacity-high: 0.22;
    content: "";
    position: absolute;
    inset: -26%;
    background:
      radial-gradient(ellipse 42% 28% at 82% 34%, rgba(132, 70, 255, 0.06), transparent 72%),
      radial-gradient(ellipse 40% 25% at 15% 70%, rgba(255, 120, 48, 0.08), transparent 74%),
      linear-gradient(112deg, transparent 12%, rgba(255, 128, 54, 0.035) 34%, rgba(146, 74, 255, 0.045) 62%, transparent 88%);
    opacity: var(--home-atmosphere-opacity-high);
    transform: translate3d(-3%, 1%, 0) rotate(-2deg);
    animation: home-atmosphere-shift 22s ease-in-out infinite alternate;
  }

  .home-atmosphere::after {
    content: "";
    position: absolute;
    inset: -18%;
    background:
      radial-gradient(ellipse 32% 12% at 48% 68%, rgba(255, 190, 92, 0.1), transparent 78%),
      radial-gradient(ellipse 24% 10% at 66% 38%, rgba(156, 82, 255, 0.05), transparent 80%),
      linear-gradient(106deg, transparent 36%, rgba(255, 150, 66, 0.035) 52%, transparent 70%);
    mix-blend-mode: screen;
    opacity: 0.18;
    transform: translate3d(-5%, 2%, 0) rotate(-1deg);
    animation: home-atmosphere-rift 18s ease-in-out infinite alternate;
  }

  .home-particle {
    position: absolute;
    border-radius: 9999px;
    background: var(--particle-color);
    box-shadow: 0 0 8px color-mix(in srgb, var(--particle-color) 72%, transparent);
    opacity: 0;
    transform: translate3d(0, 0, 0);
    animation: home-particle-drift var(--particle-duration) ease-in-out infinite;
    animation-delay: var(--particle-delay);
  }

  .home-particle::after {
    content: "";
    position: absolute;
    right: 0;
    top: 50%;
    width: 18px;
    height: 1px;
    border-radius: 9999px;
    background: linear-gradient(90deg, var(--particle-color), transparent);
    opacity: 0.22;
    transform: translate3d(14px, -50%, 0) rotate(-16deg);
    transform-origin: left center;
  }

  .home-particle--mobile {
    display: none;
  }

  .home-actions {
    bottom: calc(env(safe-area-inset-bottom, 0px) + 2rem);
  }

  .home-nav-list {
    pointer-events: auto;
    max-width: calc(100vw - 1.5rem);
    gap: clamp(0.55rem, 2.1vw, 2.25rem);
    justify-content: center;
  }

  .home-nav-item {
    opacity: 0;
    transform: translate3d(0, 14px, 0);
    animation: home-nav-enter 560ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    animation-delay: var(--nav-delay);
  }

  .home-nav-button {
    width: var(--nav-width);
    height: var(--nav-height);
    min-width: 0;
    gap: clamp(0.42rem, 1.5vw, 0.85rem);
    border: 1px solid color-mix(in srgb, var(--nav-tone) 78%, transparent);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.035) 45%, rgba(5, 7, 18, 0.66)),
      rgba(8, 8, 20, 0.42);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.11),
      inset 0 0 28px rgba(255, 255, 255, 0.045),
      0 0 18px var(--nav-glow),
      0 18px 34px rgba(0, 0, 0, 0.34);
    color: inherit;
    cursor: pointer;
    font: inherit;
    padding: 0 clamp(0.62rem, 2vw, 1.45rem);
    transform: translate3d(0, 0, 0);
    transition:
      width 280ms ease,
      transform 240ms ease,
      box-shadow 240ms ease,
      background 240ms ease,
      background-color 240ms ease,
      border-color 240ms ease;
  }

  .home-nav-button[data-nav-title="ENTER"] {
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.15),
      inset 0 0 34px rgba(202, 100, 255, 0.12),
      0 0 22px rgba(207, 82, 255, 0.82),
      0 0 44px rgba(116, 60, 255, 0.28),
      0 18px 34px rgba(0, 0, 0, 0.36);
  }

  .home-nav-button::before,
  .home-nav-button::after {
    content: "";
    position: absolute;
    pointer-events: none;
    border-radius: 9999px;
    opacity: 0.7;
  }

  .home-nav-button::before {
    inset: 5px 16%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.74), transparent);
    filter: blur(0.2px);
  }

  .home-nav-button::after {
    inset: -8px -10px;
    border: 1px solid color-mix(in srgb, var(--nav-tone) 22%, transparent);
    filter: blur(4px);
    opacity: 0.28;
  }

  .home-nav-fill {
    inset: -1px;
    height: 100%;
    width: 100%;
    transform: none;
    opacity: 0.14;
    background:
      radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.34), transparent 34%),
      linear-gradient(90deg, color-mix(in srgb, var(--gradient-from) 42%, transparent), color-mix(in srgb, var(--gradient-to) 38%, transparent));
    transition: opacity 260ms ease;
  }

  .home-nav-glow {
    left: 50%;
    top: 50%;
    height: 112%;
    width: 108%;
    transform: translate3d(-50%, -50%, 0);
    opacity: 0.42;
    transition: opacity 260ms ease;
  }

  .home-nav-icon {
    flex: 0 0 auto;
    transform: scale(1);
    opacity: 1;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.34));
    transition:
      transform 240ms ease,
      opacity 220ms ease;
  }

  .home-nav-label {
    position: relative;
    transform: translate3d(0, 0, 0);
    opacity: 1;
    text-shadow:
      0 0 10px rgba(255, 255, 255, 0.34),
      0 0 18px var(--nav-glow);
    transition:
      transform 240ms ease,
      opacity 220ms ease,
      text-shadow 240ms ease;
  }

  .home-nav-button:focus-visible {
    outline: 2px solid rgba(142, 239, 255, 0.95);
    outline-offset: 5px;
    border-color: rgba(142, 239, 255, 0.72);
    box-shadow:
      0 0 0 4px rgba(31, 209, 255, 0.14),
      0 0 30px rgba(159, 91, 255, 0.5),
      0 18px 34px rgba(0, 0, 0, 0.34);
  }

  .home-nav-button:active {
    transform: translate3d(0, 0, 0) scale(0.98);
  }

  @media (hover: hover) and (pointer: fine) {
    .home-nav-button:is(:hover, :focus-visible) {
      width: var(--nav-hover-width);
      transform: translate3d(0, -3px, 0);
      border-color: color-mix(in srgb, var(--nav-tone) 92%, rgba(255, 255, 255, 0.34));
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.16),
        inset 0 0 34px rgba(255, 255, 255, 0.07),
        0 0 30px var(--nav-glow),
        0 20px 40px rgba(0, 0, 0, 0.42);
    }

    .home-nav-button:is(:hover, :focus-visible) .home-nav-fill {
      opacity: 0.3;
    }

    .home-nav-button:is(:hover, :focus-visible) .home-nav-glow {
      opacity: 0.78;
    }

    .home-nav-button:is(:hover, :focus-visible) .home-nav-icon {
      opacity: 1;
      transform: scale(1.06);
    }

    .home-nav-button:is(:hover, :focus-visible) .home-nav-label {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1.02);
      text-shadow:
        0 0 12px rgba(255, 255, 255, 0.54),
        0 0 26px var(--nav-glow);
    }
  }

  @media (min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    .home-hero-layer::before {
      animation:
        home-space-arrival-desktop 2400ms cubic-bezier(0.16, 1, 0.3, 1) both,
        home-hero-drift-desktop 20s ease-in-out 2400ms infinite alternate;
    }
  }

  @media (min-width: 768px) and (max-height: 760px) {
    .home-brand-layer {
      top: clamp(12.5rem, 44vh, 21rem);
      width: min(52rem, 58vw);
    }

    .home-welcome-line {
      margin-top: clamp(0.15rem, 0.55vh, 0.45rem);
      font-size: clamp(1.05rem, 1.75vw, 2.15rem);
    }
  }

  @media (max-width: 639px) {
    .home-hero-layer::before {
      inset: -5%;
      animation:
        home-space-arrival-mobile 1900ms cubic-bezier(0.16, 1, 0.3, 1) both,
        home-hero-drift-mobile 24s ease-in-out 1900ms infinite alternate;
    }

    .home-actions {
      bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(0.75rem, 2vh, 1.05rem));
      padding-inline: clamp(0.55rem, 2.5vw, 0.85rem);
      width: 100%;
    }

    .home-nav-list {
      width: min(22rem, calc(100vw - 1.1rem));
      max-width: calc(100vw - 1.1rem);
      gap: clamp(0.38rem, 1.7vw, 0.55rem);
      justify-content: center;
      padding: clamp(0.26rem, 1.1vw, 0.36rem);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(7, 9, 24, 0.54)),
        rgba(5, 6, 18, 0.42);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.16),
        0 0 26px rgba(190, 82, 255, 0.18),
        0 14px 34px rgba(0, 0, 0, 0.38);
      backdrop-filter: blur(12px) saturate(1.18);
      -webkit-backdrop-filter: blur(12px) saturate(1.18);
    }

    .home-nav-item {
      flex: 1 1 0;
      min-width: 0;
    }

    .home-nav-button {
      width: 100%;
      min-width: 0;
      height: clamp(2.65rem, 11.5vw, 3rem);
      gap: clamp(0.26rem, 1.1vw, 0.38rem);
      padding: 0 clamp(0.38rem, 1.7vw, 0.56rem);
      border-color: color-mix(in srgb, var(--nav-tone) 58%, rgba(255, 255, 255, 0.28));
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.035) 46%, rgba(5, 7, 18, 0.5)),
        rgba(8, 8, 20, 0.32);
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 0 18px rgba(255, 255, 255, 0.04),
        0 0 12px color-mix(in srgb, var(--nav-glow) 60%, transparent),
        0 10px 18px rgba(0, 0, 0, 0.24);
    }

    .home-nav-button[data-nav-title="ENTER"] {
      width: 100%;
      border-color: rgba(220, 132, 255, 0.72);
      background:
        radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.2), transparent 42%),
        linear-gradient(180deg, rgba(214, 96, 255, 0.32), rgba(109, 56, 208, 0.32)),
        rgba(15, 10, 34, 0.56);
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.16),
        inset 0 0 22px rgba(202, 100, 255, 0.18),
        0 0 18px rgba(207, 82, 255, 0.55),
        0 10px 20px rgba(0, 0, 0, 0.28);
    }

    .home-nav-button:not([data-nav-title="ENTER"]) .home-nav-label {
      position: relative;
      width: auto;
      height: auto;
      margin: 0;
      overflow: visible;
      clip: auto;
      clip-path: none;
      white-space: nowrap;
    }

    .home-nav-icon {
      font-size: clamp(0.9rem, 4.2vw, 1.05rem);
      filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.26));
    }

    .home-nav-label,
    .home-nav-button[data-nav-title="ENTER"] .home-nav-label {
      font-size: clamp(0.47rem, 1.9vw, 0.58rem);
      letter-spacing: clamp(0.09em, 0.65vw, 0.14em);
      line-height: 1;
      text-shadow:
        0 0 8px rgba(255, 255, 255, 0.26),
        0 0 14px var(--nav-glow);
    }

    .home-nav-fill {
      opacity: 0.12;
    }

    .home-nav-glow {
      width: 96%;
      height: 94%;
      opacity: 0.26;
    }

    .home-nav-button::before {
      inset: 5px 19% auto;
      opacity: 0.62;
    }

    .home-nav-button::after {
      inset: -5px -4px;
      opacity: 0.18;
    }

    .home-nav-button:is(:focus-visible) .home-nav-icon {
      opacity: 1;
      transform: scale(1);
    }

    .home-brand-layer {
      top: clamp(16rem, 41vh, 21.5rem);
      width: min(25.5rem, 84vw);
    }

    .home-welcome-line {
      margin-top: 0.15rem;
      font-size: clamp(0.9rem, 4vw, 1.3rem);
      letter-spacing: clamp(0.04em, 0.8vw, 0.12em);
    }

    .home-particle--desktop {
      display: none;
    }

    .home-particle--mobile {
      display: block;
    }

    .home-atmosphere::before {
      --home-atmosphere-opacity-low: 0.12;
      --home-atmosphere-opacity-high: 0.22;
      opacity: var(--home-atmosphere-opacity-high);
      animation-duration: 24s;
    }

    .home-atmosphere::after {
      opacity: 0.12;
      animation-duration: 20s;
    }

  }

  @media (max-width: 767px) {
    .home-logo-glow {
      --home-logo-glow-opacity: 0.16;
      --home-logo-glow-soft-opacity: 0.05;
      background:
        radial-gradient(ellipse 31% 12% at 40% 43%, rgba(255, 170, 80, 0.16), transparent 84%),
        radial-gradient(ellipse 35% 13% at 62% 43%, rgba(170, 78, 255, 0.16), transparent 86%),
        radial-gradient(ellipse 58% 24% at 51% 45%, rgba(82, 210, 255, 0.05), transparent 88%);
    }

    .home-logo-glow::before {
      background:
        radial-gradient(ellipse 34% 13% at 40% 43%, rgba(255, 194, 96, 0.68), transparent 84%),
        radial-gradient(ellipse 38% 14% at 62% 43%, rgba(194, 100, 255, 0.64), transparent 86%),
        radial-gradient(ellipse 58% 22% at 51% 45%, rgba(92, 218, 255, 0.16), transparent 88%);
    }
  }

  @media (max-width: 639px) and (orientation: portrait) {
    .home-hero-layer::before {
      background-image: url("${HOME_HERO_IMAGE}");
      background-position: center 50%;
      background-size: auto 128%;
      transform-origin: center 46%;
    }

    .home-logo-glow {
      background:
        radial-gradient(ellipse 34% 13% at 40% 43%, rgba(255, 170, 80, 0.15), transparent 84%),
        radial-gradient(ellipse 38% 14% at 62% 43%, rgba(170, 78, 255, 0.16), transparent 86%),
        radial-gradient(ellipse 62% 25% at 51% 45%, rgba(82, 210, 255, 0.05), transparent 88%);
    }
  }

  @media (min-width: 1280px) {
    .home-actions {
      bottom: 4rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .home-hero-layer,
    .home-hero-layer::before,
    .home-hero-layer::after,
    .home-twinkle-field,
    .home-twinkle-field::before,
    .home-twinkle-field::after,
    .home-power-shade,
    .home-logo-layer,
    .home-logo-layer::after,
    .home-logo-glow,
    .home-logo-glow::before,
    .home-atmosphere::before,
    .home-atmosphere::after,
    .home-particle,
    .home-particle::after,
    .home-nav-item,
    .home-nav-button,
    .home-nav-icon {
      animation: none;
      transition: none;
      transform: none;
    }

    .home-nav-fill,
    .home-nav-glow,
    .home-nav-label {
      animation: none;
      transition: none;
    }

    .home-nav-item {
      opacity: 1;
    }

    .home-power-shade,
    .home-logo-layer::after {
      opacity: 0;
    }

    .home-logo-layer {
      opacity: 1;
      filter:
        brightness(1.03)
        contrast(1.1)
        saturate(1.08)
        drop-shadow(0 0 10px rgba(255, 176, 76, 0.22))
        drop-shadow(0 0 16px rgba(190, 86, 255, 0.18));
      mix-blend-mode: lighten;
    }

    .home-logo-glow {
      opacity: 0.05;
    }

    .home-atmosphere {
      opacity: 0;
    }

    .home-atmosphere::before {
      opacity: 0;
    }

    .home-atmosphere::after {
      opacity: 0;
    }

    .home-twinkle-field,
    .home-twinkle-field::before,
    .home-twinkle-field::after {
      opacity: 0;
    }

    .home-particle {
      opacity: var(--particle-reduced-opacity);
    }

    .home-nav-button:is(:hover, :focus-visible) {
      transform: none;
    }
  }

  @keyframes home-hero-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes home-scene-power-on {
    0% {
      opacity: 1;
      background:
        radial-gradient(ellipse 72% 42% at 50% 44%, rgba(8, 6, 24, 0.2), rgba(0, 0, 0, 0.64) 76%),
        rgba(0, 0, 0, 0.5);
    }
    22% {
      opacity: 0.82;
    }
    100% {
      opacity: 0;
      background:
        radial-gradient(ellipse 72% 42% at 50% 44%, rgba(8, 6, 24, 0.02), rgba(0, 0, 0, 0.12) 76%),
        rgba(0, 0, 0, 0);
    }
  }

  @keyframes home-hero-drift-desktop {
    0% { transform: translate3d(-18px, 7px, 0) scale(1.018); }
    100% { transform: translate3d(18px, -10px, 0) scale(1.04); }
  }

  @keyframes home-hero-drift-mobile {
    0% { transform: translate3d(-7px, 4px, 0) scale(1.012); }
    100% { transform: translate3d(7px, -5px, 0) scale(1.024); }
  }

  @keyframes home-space-arrival-desktop {
    0% {
      transform: translate3d(-32px, 18px, 0) scale(1.07);
      filter: brightness(0.74) saturate(0.92);
    }
    42% {
      transform: translate3d(10px, -4px, 0) scale(1.032);
      filter: brightness(1.08) saturate(1.12);
    }
    100% {
      transform: translate3d(0, 0, 0) scale(1.018);
      filter: brightness(1) saturate(1);
    }
  }

  @keyframes home-space-arrival-mobile {
    0% {
      transform: translate3d(-12px, 10px, 0) scale(1.04);
      filter: brightness(0.78) saturate(0.94);
    }
    48% {
      transform: translate3d(4px, -3px, 0) scale(1.018);
      filter: brightness(1.06) saturate(1.08);
    }
    100% {
      transform: translate3d(0, 0, 0) scale(1.012);
      filter: brightness(1) saturate(1);
    }
  }

  @keyframes home-starfield-drift {
    from {
      transform: translate3d(-1.5%, 0.5%, 0);
      background-position:
        0 0,
        80px 20px,
        -120px 40px,
        180px -60px,
        40px 120px,
        -80px -90px,
        130px 60px,
        -140px 100px;
    }
    to {
      transform: translate3d(1.5%, -0.5%, 0);
      background-position:
        160px -90px,
        -80px 120px,
        120px -80px,
        -180px 80px,
        170px -110px,
        90px 140px,
        -120px -70px,
        130px -130px;
    }
  }

  @keyframes home-stars-blink-a {
    0% {
      opacity: 0.22;
      filter: brightness(0.72);
    }
    32% {
      opacity: 0.78;
      filter: brightness(1.45);
    }
    58% {
      opacity: 0.34;
      filter: brightness(0.9);
    }
    100% {
      opacity: 0.64;
      filter: brightness(1.22);
    }
  }

  @keyframes home-stars-blink-b {
    0% {
      opacity: 0.16;
      filter: brightness(0.76);
    }
    42% {
      opacity: 0.6;
      filter: brightness(1.5);
    }
    72% {
      opacity: 0.24;
      filter: brightness(0.84);
    }
    100% {
      opacity: 0.54;
      filter: brightness(1.28);
    }
  }

  @keyframes home-logo-charge {
    0% {
      opacity: 0;
      transform: translate3d(0, 0, 0) scale(0.94);
    }
    32% {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
    68% {
      opacity: 0.58;
      transform: translate3d(0, 0, 0) scale(1.045);
    }
    100% {
      opacity: 0;
      transform: translate3d(0, 0, 0) scale(1.08);
    }
  }

  @keyframes home-logo-layer-charge {
    0% {
      opacity: 1;
      filter: brightness(0.66) contrast(1.04) saturate(0.94);
      transform: translate3d(0, 0, 0) scale(0.985);
    }
    38% {
      opacity: 1;
      filter:
        brightness(1.22)
        contrast(1.12)
        saturate(1.14)
        drop-shadow(0 0 18px rgba(255, 176, 76, 0.28))
        drop-shadow(0 0 26px rgba(190, 86, 255, 0.24));
      transform: translate3d(0, 0, 0) scale(0.997);
    }
    68% {
      opacity: 1;
      filter:
        brightness(1.07)
        contrast(1.1)
        saturate(1.08)
        drop-shadow(0 0 12px rgba(255, 176, 76, 0.22))
        drop-shadow(0 0 18px rgba(190, 86, 255, 0.18));
      transform: translate3d(0, 0, 0) scale(1);
    }
    100% {
      opacity: 1;
      filter:
        brightness(1.03)
        contrast(1.1)
        saturate(1.08)
        drop-shadow(0 0 10px rgba(255, 176, 76, 0.22))
        drop-shadow(0 0 16px rgba(190, 86, 255, 0.18));
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes home-logo-mask-sweep {
    0% {
      opacity: 0;
      transform: translate3d(-42%, 0, 0) skewX(-10deg);
    }
    22% {
      opacity: 0.95;
    }
    100% {
      opacity: 0;
      transform: translate3d(42%, 0, 0) skewX(-10deg);
    }
  }

  @keyframes home-logo-glow-pulse {
    from {
      opacity: var(--home-logo-glow-soft-opacity);
      transform: translate3d(0, 0, 0) scale(0.99);
    }
    to {
      opacity: var(--home-logo-glow-opacity);
      transform: translate3d(0, 0, 0) scale(1.012);
    }
  }

  @keyframes home-atmosphere-shift {
    from { transform: translate3d(-3%, 1%, 0) rotate(-2deg); opacity: var(--home-atmosphere-opacity-low); }
    to { transform: translate3d(3%, -1%, 0) rotate(2deg); opacity: var(--home-atmosphere-opacity-high); }
  }

  @keyframes home-atmosphere-rift {
    from { transform: translate3d(-5%, 2%, 0) rotate(-1deg); opacity: 0.08; }
    to { transform: translate3d(5%, -2%, 0) rotate(1deg); opacity: 0.18; }
  }

  @keyframes home-particle-drift {
    0% {
      opacity: 0;
      transform: translate3d(0, 0, 0);
    }
    18% {
      opacity: var(--particle-soft-opacity);
    }
    56% {
      opacity: var(--particle-opacity);
    }
    100% {
      opacity: 0;
      transform: translate3d(var(--particle-travel-x), var(--particle-travel-y), 0);
    }
  }

  @keyframes home-nav-enter {
    from {
      opacity: 0;
      transform: translate3d(0, 14px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
`;

const WARM_PARTICLE_COLORS = [
  "rgba(255, 246, 220, 0.78)",
  "rgba(255, 200, 126, 0.72)",
  "rgba(255, 156, 74, 0.64)",
  "rgba(208, 160, 255, 0.52)",
];

function getWarmColor(id: string, palette: string[]): string {
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

function getParticleStyle(particle: HomeParticle): CSSProperties & Record<string, string> {
  const opacity = Number(particle.opacity);

  return {
    left: particle.left,
    top: particle.top,
    width: `${particle.size}px`,
    height: `${particle.size}px`,
    "--particle-color": getWarmColor(particle.id, WARM_PARTICLE_COLORS),
    "--particle-opacity": particle.opacity,
    "--particle-soft-opacity": `${Math.max(0, opacity * 0.72)}`,
    "--particle-reduced-opacity": `${Math.max(0, opacity * 0.35)}`,
    "--particle-duration": particle.duration,
    "--particle-delay": particle.delay,
    "--particle-travel-x": particle.travelX,
    "--particle-travel-y": particle.travelY,
  } as CSSProperties & Record<string, string>;
}

const DESKTOP_RENDERED_PARTICLES = DESKTOP_PARTICLES.map((particle) => ({
  ...particle,
  style: getParticleStyle(particle),
}));

const MOBILE_RENDERED_PARTICLES = MOBILE_PARTICLES.map((particle) => ({
  ...particle,
  style: getParticleStyle(particle),
}));

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div
      className="landing-root relative h-screen min-h-[100dvh] overflow-hidden bg-[#02040a] text-white"
      onContextMenu={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
      onDragStart={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
    >
      <style>{HOME_MOTION_STYLES}</style>
      <div className="absolute inset-0 bg-[#02040a]" aria-hidden="true" />

      <div className="home-hero-layer absolute inset-0 z-10 bg-[#02040a]" aria-hidden="true" />

      <div className="home-power-shade absolute inset-0 z-[18]" aria-hidden="true" />

      <div className="home-twinkle-field absolute inset-0 z-[21]" aria-hidden="true" />

      <div className="home-red-flare-field absolute inset-0 z-[22]" aria-hidden="true" />

      <div className="home-atmosphere absolute inset-0 z-[23]" aria-hidden="true" />

      <div className="home-brand-layer z-[30]" aria-hidden="true">
        <div className="home-logo-layer" />
        <div className="home-welcome-line">Welcome to Every Nation</div>
      </div>

      <div className="home-particles absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
        {DESKTOP_RENDERED_PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className="home-particle home-particle--desktop"
            style={particle.style}
          />
        ))}
        {MOBILE_RENDERED_PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className="home-particle home-particle--mobile"
            style={particle.style}
          />
        ))}
      </div>

      <div className="home-actions absolute left-1/2 z-50 flex w-full -translate-x-1/2 justify-center px-4">
        <LandingNav
          onDiscord={() => window.open("https://discord.gg/everynation", "_blank")}
          onEnter={() => navigate("/hub")}
          onSocials={() => window.open("https://linktr.ee/everynationgg", "_blank")}
        />
      </div>
    </div>
  );
}
