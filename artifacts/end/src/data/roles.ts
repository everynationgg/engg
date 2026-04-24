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
import virusImg from "@assets/role-virus.webp";
import routerImg from "@assets/role-router.webp";
import spectatorImg from "@assets/role-spectator.webp";

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
import virusVid from "@assets/role-virus.webm";
import routerVid from "@assets/role-router.webm";
import spectatorVid from "@assets/role-spectator.webm";


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
import virusEvictionVid from "@assets/role-virus-eviction.webm";
import routerEvictionVid from "@assets/role-router-eviction.webm";
import spectatorEvictionVid from "@assets/role-spectator.webm";

export type RoleTeam = "alien" | "crew" | "chaotic" | "spectator";

export interface Role {
  id: string;
  name: string;
  team: RoleTeam;
  alignment: string;
  image: string;
  video: string;
  evictionVideo: string;
  winCondition: string;
  abilityName: string;
  abilityDescription: string;
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
    id: "spectator",
    name: "Spectator",
    team: "spectator",
    alignment: "Spectator",
    image: spectatorImg,
    video: spectatorVid,
    evictionVideo: spectatorEvictionVid,
    winCondition: "Just watching. No win/lose.",
    abilityName: "Omniscient Observation",
    abilityDescription: "Observe the game from the digital ether. You see all actions, votes, and roles, but your presence cannot influence the outcome.",
    ability: "Observe the game from the digital ether. You see all actions, votes, and roles, but your presence cannot influence the outcome.",
    notes: "Cannot interact, vote, or act. Only sees the game.",
    salutation: "You are a Spectator, {username}. Enjoy the show!",
    lore: "You are here to watch, not to play. You see everything, but cannot interact or influence the outcome. Sit back and enjoy the chaos.",
    canAct: false,
  },
  {
    id: "alien",
    name: "Alien",
    team: "alien",
    alignment: "Alien Team",
    image: alienImg,
    video: alienVid,
    evictionVideo: alienEvictionVid,
    winCondition: "Do not get voted out",
    abilityName: "Shadow Infiltration",
    abilityDescription: "View 1 center card to verify its signature. Keep your true form hidden from the crew.",
    ability: "View 1 center card to verify its signature. Keep your true form hidden from the crew.",
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
    abilityName: "Hive Mind Link",
    abilityDescription: "Locate and synchronize with the Alien(s) at the start of the match. You work in the shadows to draw suspicion away from the Hive.",
    ability: "Locate and synchronize with the Alien(s) at the start of the match. You work in the shadows to draw suspicion away from the Hive.",
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
    abilityName: "Signal Jamming",
    abilityDescription: "Select one player to jam their transmitter. Their ability will be neutralized for the duration of this round.",
    ability: "Select one player to jam their transmitter. Their ability will be neutralized for the duration of this round.",
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
    abilityName: "Identity Hijack",
    abilityDescription: "Select one player to extract and overwrite their identity. You assume their role and objectives entirely.",
    ability: "Select one player to extract and overwrite their identity. You assume their role and objectives entirely.",
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
    abilityName: "Reality Fracture",
    abilityDescription: "Select two players to swap their digital signatures. They will trade roles without knowing the source of the shift.",
    ability: "Select two players to swap their digital signatures. They will trade roles without knowing the source of the shift.",
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
    abilityName: "Command Authority",
    abilityDescription: "Activate to double the weight of your vote. If successful, your input counts as 2 units in the final tally.",
    ability: "Activate to double the weight of your vote. If successful, your input counts as 2 units in the final tally.",
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
    abilityName: "System Maintenance",
    abilityDescription: "You have no specialized abilities. Use your deduction and teamwork to expose the intruder.",
    ability: "You have no specialized abilities. Use your deduction and teamwork to expose the intruder.",
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
    abilityName: "Event Logging",
    abilityDescription: "Select a player to monitor. You will receive a detailed log of all actions that affected them this round.",
    ability: "Select a player to monitor. You will receive a detailed log of all actions that affected them this round.",
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
    abilityName: "Deep Scan",
    abilityDescription: "Analyze 2 center cards to identify unassigned roles, OR scan 1 player to learn their original role assignment.",
    ability: "Analyze 2 center cards to identify unassigned roles, OR scan 1 player to learn their original role assignment.",
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
    abilityName: "Alignment Pulse",
    abilityDescription: "Ping a player to determine their core alignment. The result will return as either 'Good' or 'Bad'.",
    ability: "Ping a player to determine their core alignment. The result will return as either 'Good' or 'Bad'.",
    notes: "None",
    salutation: "{username}, the hunt begins now.",
    lore: "You can sense alignment where others see only faces.\nOne question, one player — good or bad.\n\nYour instincts are your compass.\nFollow them, and the alien cannot hide forever.",
    canAct: true,
  },
  {
    id: "virus",
    name: "Virus",
    team: "alien",
    alignment: "Alien Team",
    image: virusImg,
    video: virusVid,
    evictionVideo: virusEvictionVid,
    winCondition: "Alien Team Wins",
    abilityName: "Packet Loss",
    abilityDescription: "Acts during Role Reveal. Target a non-alien player to corrupt their interface. Their next action will target a random entity.",
    ability: "Acts during Role Reveal. Target a non-alien player to corrupt their interface. Their next action will target a random entity.",
    notes: "Acts during Role Reveal. Cannot target Aliens.",
    salutation: "System compromised. Target identified: {username}.",
    lore: "You are a ghost in the machine. A digital plague.\nDuring the reveal, choose a crew member to disconnect from reality.\n\nIn the next round, they will wander blind,\ntargeting ghosts in a glitched interface.",
    canAct: false,
    isLocked: true,
    price: "$2.99",
  },
  {
    id: "router",
    name: "Router",
    team: "chaotic",
    alignment: "Chaotic",
    image: routerImg,
    video: routerVid,
    evictionVideo: routerEvictionVid,
    winCondition: "Chaotic Victory",
    abilityName: "Gateway Hijack",
    abilityDescription: "Acts during Role Reveal. Select a 'Source' and a 'Destination' player. The Source's ability will be redirected to the Destination.",
    ability: "Acts during Role Reveal. Select a 'Source' and a 'Destination' player. The Source's ability will be redirected to the Destination.",
    notes: "Acts during Role Reveal.",
    salutation: "Traffic intercepted. Where shall we send them, {username}?",
    lore: "Information is traffic, and you own the hub.\nDuring the reveal, build a bridge between two players.\n\nOne will reach out, the other will receive.\nThey will never know the path was altered until it's too late.",
    canAct: false,
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
export const SPECTATOR_ROLES = ROLES.filter((r) => r.team === "spectator");
