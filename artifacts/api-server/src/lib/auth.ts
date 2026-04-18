import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHmac, timingSafeEqual } from "node:crypto";

const _rawJwtSecret = process.env.JWT_SECRET;
if (!_rawJwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}
// Re-assign after the guard so TypeScript knows the type is `string` inside function bodies.
const JWT_SECRET: string = _rawJwtSecret;

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded !== "object" || decoded === null || !("userId" in decoded)) {
      return null;
    }
    const payload = decoded as jwt.JwtPayload;
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

// ── Player identity tokens ────────────────────────────────────────────────────
//
// A player token binds a client-generated UUID (playerId) to the server secret
// via HMAC-SHA256.  The token is deterministic: the same playerId always
// produces the same MAC, so there is no state to store — any server instance
// can verify it.  It does not expire, but expiry is not needed because:
//   - The playerId is a random UUID (not guessable).
//   - A token issued for one UUID cannot be reused for any other UUID.
//   - Rotating JWT_SECRET invalidates all outstanding tokens (acceptable for
//     a game lobby that resets on server deploy).
//
// Threat model addressed:
//   - An attacker who observes another player's playerId in traffic cannot
//     use it without the corresponding HMAC token.
//   - Tokens cannot be forged without knowledge of JWT_SECRET (server-only).
//   - timingSafeEqual prevents timing oracle attacks during verification.

/**
 * Issue a player identity token for `playerId`.
 * Token = HMAC-SHA256(playerId, JWT_SECRET) encoded as base64url.
 */
export function issuePlayerToken(playerId: string): string {
  return createHmac("sha256", JWT_SECRET).update(playerId).digest("base64url");
}

/**
 * Verify that `token` was issued by this server for `playerId`.
 * Uses a timing-safe comparison to prevent oracle attacks.
 * Returns `true` only when the MAC matches exactly.
 */
export function verifyPlayerToken(token: string, playerId: string): boolean {
  try {
    const expected = issuePlayerToken(playerId);
    const a = Buffer.from(token, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
