import alienImg from "@assets/role-alien.webp";
import parasiteImg from "@assets/role-parasite.webp";
import commanderImg from "@assets/role-commander.webp";
import crewImg from "@assets/role-crew.webp";
import sentinelImg from "@assets/role-sentinel.webp";
import scannerImg from "@assets/role-scanner.webp";
import seekerImg from "@assets/role-seeker.webp";
import disruptorImg from "@assets/role-disruptor.webp";
import shifterImg from "@assets/role-shifter.webp";
import warperImg from "@assets/role-warper.webp";
import virusImg from "@assets/role-virus.webp";
import routerImg from "@assets/role-router.webp";
import doctorImg from "@assets/role-doctor.webp";
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
import doctorVid from "@assets/role-doctor.webm";
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
import doctorEvictionVid from "@assets/role-doctor-eviction.webm";
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
    winCondition: "Spectating Only",
    abilityName: "Omniscient Observation",
    abilityDescription: "Observe the match in real time. You can view roles, actions, and votes, but cannot influence the outcome.",
    ability: "Observe the match in real time. You can view roles, actions, and votes, but cannot influence the outcome.",
    notes: "Cannot interact, vote, or use abilities.",
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
    winCondition: "Survive the Vote",
    abilityName: "Shadow Infiltration",
    abilityDescription: "View 1 unassigned center card during the Orbit phase. Keep your true identity hidden from the Crew.",
    ability: "View 1 unassigned center card during the Orbit phase. Keep your true identity hidden from the Crew.",
    notes: "Knows fellow Aliens at the start of the match.",
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
    winCondition: "Get Voted Out",
    abilityName: "Hive Mind Link",
    abilityDescription: "Reveals who the Alien players are during Role Reveal. Draw suspicion onto yourself so the Crew votes you out instead of the Alien.",
    ability: "Reveals who the Alien players are during Role Reveal. Draw suspicion onto yourself so the Crew votes you out instead of the Alien.",
    notes: "You see who the Aliens are, but the Aliens do not know who you are.",
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
    winCondition: "Chosen Alignment Wins",
    abilityName: "Signal Jamming",
    abilityDescription: "Choose one player during the Orbit phase to jam their signal, blocking their ability for this round.",
    ability: "Choose one player during the Orbit phase to jam their signal, blocking their ability for this round.",
    notes: "Choose Crew or Alien alignment during Role Reveal. Cannot block Scanner or Doctor.",
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
    winCondition: "Chosen Alignment Wins",
    abilityName: "Identity Hijack",
    abilityDescription: "Select one player during the Orbit phase to swap roles with them and view your new role.",
    ability: "Select one player during the Orbit phase to swap roles with them and view your new role.",
    notes: "Choose Crew or Alien alignment during Role Reveal.",
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
    winCondition: "Chosen Alignment Wins",
    abilityName: "Reality Fracture",
    abilityDescription: "Select two other players during the Orbit phase to swap their roles without their knowledge.",
    ability: "Select two other players during the Orbit phase to swap their roles without their knowledge.",
    notes: "Choose Crew or Alien alignment during Role Reveal.",
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
    abilityDescription: "Activate during the Orbit phase to make your vote count as 2 votes in the final tally.",
    ability: "Activate during the Orbit phase to make your vote count as 2 votes in the final tally.",
    notes: "Must be activated during the Orbit phase. Blocked if jammed by Disruptor or anesthetized by Doctor.",
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
    abilityName: "Crew Deduction",
    abilityDescription: "No active night ability. Use discussion, timing, and deduction to uncover and vote out the Alien.",
    ability: "No active night ability. Use discussion, timing, and deduction to uncover and vote out the Alien.",
    notes: "Standard Crew member.",
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
    abilityDescription: "Select a player to monitor during the Orbit phase. You will receive a log of every ability that targeted them this round.",
    ability: "Select a player to monitor during the Orbit phase. You will receive a log of every ability that targeted them this round.",
    notes: "Detects swaps, scans, and jams on the monitored player.",
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
    abilityDescription: "View 2 unassigned center cards OR scan 1 player to reveal their starting role.",
    ability: "View 2 unassigned center cards OR scan 1 player to reveal their starting role.",
    notes: "Cannot be blocked by Disruptor.",
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
    abilityDescription: "Inspect 1 player during the Orbit phase to learn whether their alignment is Good (Crew) or Bad (Alien).",
    ability: "Inspect 1 player during the Orbit phase to learn whether their alignment is Good (Crew) or Bad (Alien).",
    notes: "Reads a Chaotic player's chosen alignment.",
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
    abilityDescription: "Acts during Role Reveal. Infect a non-Alien player so their next Orbit ability targets a random player instead.",
    ability: "Acts during Role Reveal. Infect a non-Alien player so their next Orbit ability targets a random player instead.",
    notes: "Acts during Role Reveal. Cannot target Aliens. Immune to Router.",
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
    winCondition: "Chosen Alignment Wins",
    abilityName: "Gateway Hijack",
    abilityDescription: "Acts during Role Reveal. Choose a Source and Destination player; the Source's Orbit ability is redirected to the Destination.",
    ability: "Acts during Role Reveal. Choose a Source and Destination player; the Source's Orbit ability is redirected to the Destination.",
    notes: "Acts during Role Reveal. Choose Crew or Alien alignment. Immune to Virus.",
    salutation: "Traffic intercepted. Where shall we send them, {username}?",
    lore: "Information is traffic, and you own the hub.\nDuring the reveal, build a bridge between two players.\n\nOne will reach out, the other will receive.\nThey will never know the path was altered until it's too late.",
    canAct: false,
    isLocked: true,
    price: "$2.99",
  },
  {
    id: "doctor",
    name: "Doctor",
    team: "crew",
    alignment: "Crew Team",
    image: doctorImg,
    video: doctorVid,
    evictionVideo: doctorEvictionVid,
    winCondition: "Eliminate Alien",
    abilityName: "Anesthetize",
    abilityDescription: "Acts during Role Reveal. Sedate one player to prevent them from voting in the upcoming Voting phase.",
    ability: "Acts during Role Reveal. Sedate one player to prevent them from voting in the upcoming Voting phase.",
    notes: "Acts during Role Reveal. Cannot be blocked by Disruptor. Also cancels Commander's 2× vote bonus.",
    salutation: "Doctor {username}, your medical expertise is vital.",
    lore: "You are the guardian of health and order aboard this station.\nYour skills go beyond simple medicine — you can temporarily disconnect a player's cognitive functions, ensuring they cannot interfere with critical decisions.\n\nAct during the role reveal.\nChoose carefully, for your choice is blind, and its impact is absolute.",
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
