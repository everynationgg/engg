import { z } from "zod";

/** Room codes are 6 upper-case alphanumeric characters (excluding O/0/I/1). */
export const sessionIdSchema = z.string().regex(/^[A-Z2-9]{6}$/, "Invalid session ID");

/** Player display name: 1–30 characters, no leading/trailing whitespace. */
export const playerNameSchema = z.string().min(1).max(30).transform((s) => s.trim());

export const orbitActionSchema = z.object({
  type: z.string().min(1).max(50),
  targets: z.array(z.string().max(128)).max(10),
  alignment: z.enum(["Good", "Bad"]).optional(),
});

export const createSessionSchema = z.object({
  sessionId: sessionIdSchema,
  playerName: playerNameSchema,
  playerId: z.string().uuid().optional(),
  userId: z.string().max(128).optional(),
  isSpectator: z.boolean().optional(),
});

export const joinSessionSchema = z.object({
  sessionId: sessionIdSchema,
  playerName: playerNameSchema,
  playerId: z.string().uuid(),
  playerToken: z.string().min(1).max(128).optional(),
  userId: z.string().max(128).optional(),
  isSpectator: z.boolean().optional(),
});

/** Schema for the token-issuance event. */
export const requestPlayerTokenSchema = z.object({
  playerId: z.string().uuid(),
});

export const sessionOnlySchema = z.object({
  sessionId: sessionIdSchema,
});

export const startGameSchema = z.object({
  sessionId: sessionIdSchema,
  roleCounts: z.record(z.string().max(50), z.number().int().min(0).max(20)),
  customRoles: z.record(z.string().max(128), z.string().max(50)).optional(),
});

// Schema for custom game start (custom player roles + custom deck)
export const startGameCustomSchema = z.object({
  sessionId: sessionIdSchema,
  customRoles: z.record(z.string().max(128), z.string().max(50)),
  customDeck: z.array(z.string().max(50)).length(3),
});

export const submitActionSchema = z.object({
  sessionId: sessionIdSchema,
  action: orbitActionSchema,
});

export const castEmergencyVoteSchema = z.object({
  sessionId: sessionIdSchema,
  vote: z.enum(["yes", "no"]),
});

export const castVoteSchema = z.object({
  sessionId: sessionIdSchema,
  targetId: z.string().min(1).max(128),
});

export const sendChatMessageSchema = z.object({
  sessionId: sessionIdSchema,
  message: z.string().min(1).max(500).transform((s) => s.trim()),
});

export const chatTypingSchema = z.object({
  sessionId: sessionIdSchema,
});

export const kickPlayerSchema = z.object({
  sessionId: sessionIdSchema,
  targetPlayerId: z.string().uuid(),
});

/**
 * Validates socket event data with a Zod schema.
 * Returns the parsed (coerced) data on success, or sends a failure ack and
 * returns null so the caller can bail out early.
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  ack?: (result: { success: false; error: string }) => void,
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.errors[0]?.message ?? "Invalid input";
    ack?.({ success: false, error: msg });
    return null;
  }
  return result.data;
}

