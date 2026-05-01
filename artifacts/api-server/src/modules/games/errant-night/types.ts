import type { VersionedSession } from "./sessions.js";

/** Resolved return type of getSession — either a VersionedSession or undefined. */
export type MaybeSession = VersionedSession | undefined;

/** Shape of a row returned from the game_chats table. */
export interface GameChatRow {
  id: bigint;
  userId: string | null;
  guestName: string | null;
  message: string;
  timestamp: Date | string;
}

export interface Pack {
  id: string;
  name: string;
  amount: number;
  price: string;
  currency: string;
  bonus?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

