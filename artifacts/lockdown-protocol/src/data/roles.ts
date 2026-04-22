import alienImg from "@assets/role-alien_1776004623800.webp";
import parasiteImg from "@assets/role-parasite_1776003488684.webp";
import commanderImg from "@assets/role-commander_1776003488683.webp";
import crewImg from "@assets/role-crew_1776003488683.webp";
import sentinelImg from "@assets/role-sentinel_1776003488681.webp";
import scannerImg from "@assets/role-scanner_1776003488685.webp";
import seekerImg from "@assets/role-seeker_1776003488685.webp";
import disruptorImg from "@assets/role-disruptor_1776003488684.webp";
import shifterImg from "@assets/role-shifter_1776003488682.webp";
import warperImg from "@assets/role-warper_1776003488682.webp";

import alienVid from "@assets/role-alien.webm";
import parasiteVid from "@assets/role-parasite.webm";
import commanderVid from "@assets/role-commander.webm";
import crewVid from "@assets/role-crew.webm";
import sentinelVid from "@assets/role-sentinel.webm";
import scannerVid from "@assets/role-scanner.webm";
import seekerVid from "@assets/role-seeker.webm";
import disruptorVid from "@assets/role-disruptor.webm";
import shifterVid from "@assets/role-shifter.webm";
import warperVid from "@assets/role-warper.webm";

import alienEvictionVid from "@assets/role-alien-eviction.webm";
import parasiteEvictionVid from "@assets/role-parasite-eviction.webm";
import commanderEvictionVid from "@assets/role-commander-eviction.webm";
import crewEvictionVid from "@assets/role-crew-eviction.webm";
import sentinelEvictionVid from "@assets/role-sentinel-eviction.webm";
import scannerEvictionVid from "@assets/role-scanner-eviction.webm";
import seekerEvictionVid from "@assets/role-seeker-eviction.webm";
import disruptorEvictionVid from "@assets/role-disruptor-eviction.webm";
import shifterEvictionVid from "@assets/role-shifter-eviction.webm";
import warperEvictionVid from "@assets/role-warper-eviction.webm";

export type RoleTeam = "alien" | "crew" | "chaotic";

export interface Role {
  id: string;
  name: string;
  team: RoleTeam;
  alignment: string;
  image: string;
  video: string;
  evictionVideo: string;
  winCondition: string;
  ability: string;
  notes: string;
  salutation: string;
  lore: string;
  canAct: boolean;
  isLocked?: boolean;
  price?: string;
}

export const ROLES: Role[] = [
  {
    id: "alien",
    name: "Alien",
    team: "alien",
    alignment: "Alien Team",
    image: alienImg,
    video: alienVid,
    evictionVideo: alienEvictionVid,
    winCondition: "Do not get voted out",
    ability: "View 1 center card",
    notes: "None",
    salutation: "Greetings, {username}. Your true form remains hidden.",
    lore: "You are the apex predator aboard this vessel.\nYour kind has infiltrated the crew undetected.\nEvery smile, every handshake — a calculated act.\n\nDo not reveal yourself.\nSurvive long enough, and victory is yours.",
    canAct: true,
  },
  {
    id: "parasite",
    name: "Parasite",
    team: "alien",
    alignment: "Alien Team",
    image: parasiteImg,
    video: parasiteVid,
    evictionVideo: parasiteEvictionVid,
    winCondition: "Get voted out",
    ability: "See Alien(s)",
    notes: "Alien cannot see you",
    salutation: "{username}, your loyalty is your weapon.",
    lore: "You serve the Alien without their knowledge of you.\nYou seek to be voted out — a willing sacrifice that destabilizes the crew.\n\nYour death is not failure.\nYour death is the plan.",
    canAct: false,
  },
  {
    id: "disruptor",
    name: "Disruptor",
    team: "chaotic",
    alignment: "Chaotic",
    image: disruptorImg,
    video: disruptorVid,
    evictionVideo: disruptorEvictionVid,
    winCondition: "Depends on chosen alignment",
    ability: "Block 1 player's ability",
    notes: "None",
    salutation: "{username}, the system has cracks — and you are one of them.",
    lore: "You answer to no one.\nYour allegiance shifts with the wind, your ability to block others cuts deep.\n\nChoose your side wisely.\nThe outcome of this game depends on which team you decide to serve.",
    canAct: true,
  },
  {
    id: "shifter",
    name: "Shifter",
    team: "chaotic",
    alignment: "Chaotic",
    image: shifterImg,
    video: shifterVid,
    evictionVideo: shifterEvictionVid,
    winCondition: "Depends on chosen alignment",
    ability: "Steal another player's role",
    notes: "None",
    salutation: "Who are you really, {username}?",
    lore: "Identities are not permanent — not for you.\nYou can steal another player's role entirely, replacing your fate with theirs.\n\nDecide your allegiance.\nThen become whoever you need to be to win.",
    canAct: true,
  },
  {
    id: "warper",
    name: "Warper",
    team: "chaotic",
    alignment: "Chaotic",
    image: warperImg,
    video: warperVid,
    evictionVideo: warperEvictionVid,
    winCondition: "Depends on chosen alignment",
    ability: "Swap 2 players' roles",
    notes: "None",
    salutation: "{username}, reality bends to your will.",
    lore: "You hold the power to reassign fates.\nTwo players. Two roles. Swapped without warning.\n\nYou are neither crew nor alien until you choose.\nUse your power at the right moment and reshape the outcome of everything.",
    canAct: true,
  },
  {
    id: "commander",
    name: "Commander",
    team: "crew",
    alignment: "Crew Team",
    image: commanderImg,
    video: commanderVid,
    evictionVideo: commanderEvictionVid,
    winCondition: "Eliminate Alien",
    ability: "Obtain +1 additional vote",
    notes: "Activate during the ability phase. If blocked, bonus is lost.",
    salutation: "Commander {username}, your crew needs you.",
    lore: "You are the backbone of this operation.\nYour vote carries weight, your word carries authority.\n\nActivate your command authority during the orbit phase.\nIf successful, your vote counts double this round.",
    canAct: true,
  },
  {
    id: "crew",
    name: "Crew",
    team: "crew",
    alignment: "Crew Team",
    image: crewImg,
    video: crewVid,
    evictionVideo: crewEvictionVid,
    winCondition: "Eliminate Alien",
    ability: "None",
    notes: "None",
    salutation: "Welcome aboard, {username}.",
    lore: "You are the foundation of the crew.\nNo special powers. No hidden agenda.\n\nYour greatest strength is your numbers.\nTrust carefully, speak openly, and vote with conviction.",
    canAct: false,
  },
  {
    id: "sentinel",
    name: "Sentinel",
    team: "crew",
    alignment: "Crew Team",
    image: sentinelImg,
    video: sentinelVid,
    evictionVideo: sentinelEvictionVid,
    winCondition: "Eliminate Alien",
    ability: "See all actions affecting 1 player in order",
    notes: "None",
    salutation: "{username}, nothing escapes your watch.",
    lore: "You observe everything that happens to those you protect.\nActions leave traces — and you read them all.\n\nKnowledge is your armor.\nUse it to expose the alien before it's too late.",
    canAct: true,
  },
  {
    id: "scanner",
    name: "Scanner",
    team: "crew",
    alignment: "Crew Team",
    image: scannerImg,
    video: scannerVid,
    evictionVideo: scannerEvictionVid,
    winCondition: "Eliminate Alien",
    ability: "View 2 center cards OR view 1 player's original role",
    notes: "Cannot be blocked",
    salutation: "Scanning identity: {username}. Verified.",
    lore: "Your equipment cuts through deception like a blade.\nNo ability can block your scan. No lie survives your analysis.\n\nTwo center cards or one player's origin — choose wisely.\nThe truth you uncover could save everyone.",
    canAct: true,
  },
  {
    id: "seeker",
    name: "Seeker",
    team: "crew",
    alignment: "Crew Team",
    image: seekerImg,
    video: seekerVid,
    evictionVideo: seekerEvictionVid,
    winCondition: "Eliminate Alien",
    ability: "Learn if a player is Good or Bad",
    notes: "None",
    salutation: "{username}, the hunt begins now.",
    lore: "You can sense alignment where others see only faces.\nOne question, one player — good or bad.\n\nYour instincts are your compass.\nFollow them, and the alien cannot hide forever.",
    canAct: true,
  },
  {
    id: "vip_agent",
    name: "VIP Agent",
    team: "crew",
    alignment: "Crew Team",
    image: seekerImg,
    video: seekerVid,
    evictionVideo: seekerEvictionVid,
    winCondition: "Eliminate Alien",
    ability: "Master Strategist — View 1 player's role AND 1 center card.",
    notes: "Requires VIP Lobby status",
    salutation: "Welcome, {username}. Your clearance level is absolute.",
    lore: "You are a high-level operative with access to restricted data.\n deception is your enemy, and information is your weapon.\n\nYou see what others cannot.\nYou know what others hide.\nUse your clearance to lead the crew to victory.",
    canAct: true,
    isLocked: true,
    price: "$4.99",
  },
  {
    id: "virus",
    name: "Virus",
    team: "alien",
    alignment: "Alien Team",
    image: alienImg,
    video: alienVid,
    evictionVideo: alienEvictionVid,
    winCondition: "Alien Team Wins",
    ability: "Packet Loss — Scramble one crew member's interface during the Reveal phase. They cannot see target names in the next round.",
    notes: "Acts during Role Reveal. Cannot target Aliens.",
    salutation: "System compromised. Target identified: {username}.",
    lore: "You are a ghost in the machine. A digital plague.\nDuring the reveal, choose a crew member to disconnect from reality.\n\nIn the next round, they will wander blind,\ntargeting ghosts in a glitched interface.",
    canAct: true,
    isLocked: true,
    price: "$2.99",
  },
  {
    id: "router",
    name: "Router",
    team: "chaotic",
    alignment: "Chaotic",
    image: disruptorImg,
    video: disruptorVid,
    evictionVideo: disruptorEvictionVid,
    winCondition: "Chaotic Victory",
    ability: "Gateway Hijack — During Reveal, select a 'Source' player and a 'Destination' player. The Source's next ability will be forced onto the Destination.",
    notes: "Acts during Role Reveal.",
    salutation: "Traffic intercepted. Where shall we send them, {username}?",
    lore: "Information is traffic, and you own the hub.\nDuring the reveal, build a bridge between two players.\n\nOne will reach out, the other will receive.\nThey will never know the path was altered until it's too late.",
    canAct: true,
    isLocked: true,
    price: "$2.99",
  },
];

// Validate all roles have lore
Object.entries(ROLES).forEach(([, role]) => {
  if (!role.lore) {
    throw new Error("Missing lore for role: " + role.id);
  }
});

export const ALIEN_ROLES = ROLES.filter((r) => r.team === "alien");
export const CHAOTIC_ROLES = ROLES.filter((r) => r.team === "chaotic");
export const CREW_ROLES = ROLES.filter((r) => r.team === "crew");
