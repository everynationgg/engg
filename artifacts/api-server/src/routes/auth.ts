import { randomBytes, randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, usersTable, emailVerificationTokensTable, passwordResetTokensTable, refreshTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  RegisterUserBody,
  LoginUserBody,
  LoginUserResponse,
  GetCurrentUserResponse,
  RefreshTokenBody,
} from "@workspace/api-zod";
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } from "../lib/auth.js";
import { sendEmail, generateVerificationEmailHTML, generatePasswordResetEmailHTML } from "../lib/email.js";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import xss from "xss";
import { Filter } from "bad-words";
import { logger } from "../lib/logger.js";
import { logAudit } from "../lib/audit.js";
import { ensureUserMissions } from "../lib/missions.js";

import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

const filter = new Filter();
const router: IRouter = Router();

// ── RATE LIMITERS ────────────────────────────────────────────────────────────
// Brute-force protection for sensitive auth endpoints
// Brute-force protection for sensitive auth endpoints
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 attempts
  store: new RedisStore({
    sendCommand: (...args: string[]) => {
      const [cmd, ...rest] = args;
      return redisClient.call(cmd, ...rest) as Promise<any>;
    },
    prefix: "rl:auth:ip:",
  }),
  message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
});

// Targeted brute-force protection per account identifier
// NOTE: For production scaling, swap the default memory store for Redis
const identifierLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, 
  store: new RedisStore({
    sendCommand: (...args: string[]) => {
      const [cmd, ...rest] = args;
      return redisClient.call(cmd, ...rest) as Promise<any>;
    },
    prefix: "rl:auth:id:",
  }),
  keyGenerator: (req) => {
    // Stringify and normalize (NFKC) to prevent bypass via casing/whitespace/unicode variants
    const identifier = String(req.body.email || "").normalize('NFKC').toLowerCase().trim();
    return identifier || req.ip || "unknown";
  },
  message: { error: "Too many login attempts. Protocol synchronized delay active." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.body.email,
  passOnStoreError: true,
});

// Broad IP-based rate limiting
const ipLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  store: new RedisStore({
    sendCommand: (...args: string[]) => {
      const [cmd, ...rest] = args;
      return redisClient.call(cmd, ...rest) as Promise<any>;
    },
    prefix: "rl:global:ip:",
  }),
  message: { error: "Tactical network congestion detected. Please wait." },
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
});

const resetLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 reset requests
  store: new RedisStore({
    sendCommand: (...args: string[]) => {
      const [cmd, ...rest] = args;
      return redisClient.call(cmd, ...rest) as Promise<any>;
    },
    prefix: "rl:reset:ip:",
  }),
  message: { error: "Too many reset requests. Please try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
});

const identifierResetLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2, // Limit each email to 2 requests per hour
  store: new RedisStore({
    sendCommand: (...args: string[]) => {
      const [cmd, ...rest] = args;
      return redisClient.call(cmd, ...rest) as Promise<any>;
    },
    prefix: "rl:reset:id:",
  }),
  keyGenerator: (req) => {
    return String(req.body.email || "").normalize('NFKC').toLowerCase().trim() || req.ip || "unknown";
  },
  message: { error: "Reset protocol active. Check your uplink for previous keys." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.body.email,
  passOnStoreError: true,
});

// Username validation helper
function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3 || username.length > 30) {
    return { valid: false, error: "Username must be between 3 and 30 characters" };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
  }
  if (filter.isProfane(username)) {
    return { valid: false, error: "Username contains inappropriate language" };
  }
  return { valid: true };
}

// Register endpoint
router.post("/auth/register", authLimit, async (req, res) => {
  try {
    const body = RegisterUserBody.parse(req.body);

    if (body.password.length < 8) {
      res.status(400).json({ error: "Security protocol requires a minimum of 8 characters for passwords" });
      return;
    }

    // New: Complexity check (1 letter + 1 number)
    if (!/[a-zA-Z]/.test(body.password) || !/[0-9]/.test(body.password)) {
      res.status(400).json({ error: "Password must contain at least one letter and one number" });
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = xss(body.email.trim().normalize('NFKC').toLowerCase());
    const sanitizedUsername = xss(body.username.trim().normalize('NFKC').toLowerCase()); // Lowercase and normalize for case-insensitivity

    // Validate username
    const usernameCheck = validateUsername(sanitizedUsername);
    if (!usernameCheck.valid) {
      res.status(400).json({ error: usernameCheck.error });
      return;
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, sanitizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Check if username taken
    const existingUsername = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, sanitizedUsername))
      .limit(1);

    if (existingUsername.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const userId = randomUUID();
    const user = await db
      .insert(usersTable)
      .values({
        id: userId,
        email: sanitizedEmail,
        username: sanitizedUsername,
        passwordHash,
        isVerified: false,
      })
      .returning({ id: usersTable.id, email: usersTable.email, username: usersTable.username, credits: usersTable.credits });

    if (user.length === 0) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    // Create verification token (6-digit code for easier manual entry)
    const verificationTokenId = randomUUID();
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(emailVerificationTokensTable).values({
      id: verificationTokenId,
      userId,
      token: verificationToken,
      expiresAt,
    });

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    try {
      await sendEmail({
        to: sanitizedEmail,
        subject: "EN_PROTOCOL: Identity Synchronization Key",
        html: generateVerificationEmailHTML(sanitizedUsername, verificationToken),
      });
    } catch (emailError) {
      logger.error({ emailError, sanitizedEmail }, "Failed to send verification email");
      // Don't fail the registration if email fails
    }

    const token = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Store refresh token
    await db.insert(refreshTokensTable).values({
      id: randomUUID(),
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Ensure missions are assigned
    try {
      await ensureUserMissions(userId);
    } catch (err) {
      logger.error({ err, userId }, "Failed to assign starter missions on registration");
    }

    const response: z.infer<typeof LoginUserResponse> = {
      id: user[0].id,
      email: user[0].email,
      username: user[0].username,
      token,
      refreshToken,
      isVerified: false,
      credits: user[0].credits,
      isAdmin: false,
    };

    await logAudit({
      userId,
      eventType: "AUTH_REGISTER_SUCCESS",
      description: `New user protocol initiated for: ${sanitizedUsername}`,
      req,
    });

    res.status(201).json(response);
  } catch (error) {
    logger.error({ error }, "Registration error");
    res.status(400).json({ error: "Invalid request" });
  }
});

// Login endpoint
// Using IP-based (ipLimit), IP+Auth (authLimit), and Identifier-based (identifierLimit) protection
router.post("/auth/login", ipLimit, authLimit, identifierLimit, async (req, res) => {
  const startTime = Date.now();
  try {
    const body = LoginUserBody.parse(req.body);
    const identifier = body.email.trim().normalize('NFKC').toLowerCase();
    const sanitizedIdentifier = xss(identifier);

    // Timing-safe baseline
    const DUMMY_HASH = "$2b$12$K9p/m.yP3iJqO2yvE8q.ieyvE8q.ieyvE8q.ieyvE8q.ieyvE8q.i"; // Cost matches SALT_ROUNDS=12

    let users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, sanitizedIdentifier))
      .limit(1);

    if (users.length === 0) {
      users = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, sanitizedIdentifier))
        .limit(1);
    }

    const user = users[0];

    // Check account lockout
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      await logAudit({
        userId: user.id,
        eventType: "AUTH_LOGIN_LOCKED",
        description: `Login blocked for locked account: ${user.username}`,
        req,
      });
      // Timing-safe window: clamp execution time to 300-400ms (uniform random delay)
      const elapsed = Date.now() - startTime;
      const jitter = Math.floor(Math.random() * 101); // 0-100ms
      const delay = Math.max(0, 300 - elapsed) + jitter;
      await new Promise(r => setTimeout(r, delay));
      return res.status(403).json({ error: "Access temporarily restricted. Please try again later." });
    }

    // NOTE: Password reset flow bypasses lockedUntil to allow identity recovery
    const passwordToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isPasswordValid = await comparePassword(body.password, passwordToCompare);

    if (!user || !isPasswordValid) {
      if (user) {
        // Increment failure count
        const newFailCount = user.failedLoginAttempts + 1;
        const updateData: any = { failedLoginAttempts: newFailCount };
        
        if (newFailCount >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
          updateData.failedLoginAttempts = 0; // Reset count on lock to allow retry after cooldown
        }

        await db.update(usersTable).set(updateData).where(eq(usersTable.id, user.id));

        await logAudit({
          userId: user.id,
          eventType: "AUTH_LOGIN_FAILURE",
          description: `Failed login attempt for user: ${user.username} (${newFailCount >= 5 ? 'Account Locked' : 'Incorrect password'})`,
          req,
        });
      } else {
        await logAudit({
          eventType: "AUTH_LOGIN_FAILURE",
          description: `Failed login attempt for identifier: ${sanitizedIdentifier} (User not found)`,
          req,
        });
      }

      // Timing-safe window: clamp execution time to 300-400ms (uniform random delay)
      const elapsed = Date.now() - startTime;
      const jitter = Math.floor(Math.random() * 101); // 0-100ms
      const delay = Math.max(0, 300 - elapsed) + jitter;
      await new Promise(r => setTimeout(r, delay));
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Success: Reset failure count
    await db.update(usersTable).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(usersTable.id, user.id));

    await logAudit({
      userId: user.id,
      eventType: "AUTH_LOGIN_SUCCESS",
      description: `Session synchronized for: ${user.username}`,
      req,
    });

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await db.insert(refreshTokensTable).values({
      id: randomUUID(),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Ensure missions are assigned/rotated
    try {
      await ensureUserMissions(user.id);
    } catch (err) {
      logger.error({ err, userId: user.id }, "Failed to ensure missions on login");
    }

    const response: z.infer<typeof LoginUserResponse> = {
      id: user.id,
      email: user.email,
      username: user.username,
      token,
      refreshToken,
      isVerified: user.isVerified === true,
      credits: user.credits,
      isAdmin: user.isAdmin === true,
    };

    return res.json(response);
  } catch (error) {
    logger.error({ error }, "Login error");
    return res.status(400).json({ error: "Invalid request" });
  }
});

// Get current user
router.get("/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const users = await db
      .select({ 
        id: usersTable.id, 
        email: usersTable.email, 
        username: usersTable.username, 
        isVerified: usersTable.isVerified, 
        createdAt: usersTable.createdAt, 
        credits: usersTable.credits,
        isAdmin: usersTable.isAdmin
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId))
      .limit(1);

    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = users[0];
    const response: z.infer<typeof GetCurrentUserResponse> = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      isVerified: user.isVerified === true,
      credits: user.credits,
      isAdmin: user.isAdmin === true,
    };

    res.json(response);
  } catch (error) {
    logger.error({ error }, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify email with token/code
router.post(["/auth/verify", "/auth/verify-email"], async (req, res) => {
  try {
    const { token, code } = req.body;
    const verificationCode = token || code;

    if (!verificationCode || typeof verificationCode !== "string") {
      res.status(400).json({ error: "Verification code required" });
      return;
    }

    // Find the verification token
    const verificationRecords = await db
      .select()
      .from(emailVerificationTokensTable)
      .where(eq(emailVerificationTokensTable.token, verificationCode))
      .limit(1);

    if (verificationRecords.length === 0) {
      res.status(400).json({ error: "Invalid verification token" });
      return;
    }

    const verificationRecord = verificationRecords[0];

    // Check if token expired
    if (new Date() > verificationRecord.expiresAt) {
      res.status(400).json({ error: "Verification token expired" });
      return;
    }

    // Mark user as verified
    await db
      .update(usersTable)
      .set({ isVerified: true })
      .where(eq(usersTable.id, verificationRecord.userId));

    // Delete the verification token (one-time use)
    await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.id, verificationRecord.id));

    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    logger.error({ error }, "Email verification error");
    res.status(500).json({ error: "Email verification failed" });
  }
});

// Resend verification email
router.post(["/auth/resend", "/auth/resend-verification-email"], authLimit, authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get user
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId))
      .limit(1);

    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = users[0];

    if (user.isVerified) {
      res.status(400).json({ error: "Email already verified" });
      return;
    }

    // Delete old tokens
    await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.userId, req.userId));

    // Create new verification token (6-digit code)
    const verificationTokenId = randomUUID();
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(emailVerificationTokensTable).values({
      id: verificationTokenId,
      userId: req.userId,
      token: verificationToken,
      expiresAt,
    });

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: "EN_PROTOCOL: Identity Synchronization Key (Resend)",
        html: generateVerificationEmailHTML(user.username, verificationToken),
      });
      res.json({ success: true, message: "Verification code sent" });
    } catch (emailError) {
      logger.error({ emailError, userId: req.userId }, "Failed to send verification email");
      res.status(500).json({ error: "Failed to send verification email" });
    }
  } catch (error) {
    console.error("Resend verification email error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Request password reset
router.post("/auth/request-password-reset", resetLimit, identifierResetLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const sanitizedEmail = xss(email.trim().normalize('NFKC').toLowerCase());

    // Get user
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, sanitizedEmail))
      .limit(1);

    if (users.length === 0) {
      // Don't reveal if email exists (security best practice)
      return res.json({ success: true, message: "If the account exists, recovery instructions have been sent." });
    }

    const user = users[0];

    // Delete old reset tokens
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, user.id));

    // Create new reset token (valid for 1 hour)
    const resetTokenId = randomUUID();
    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokensTable).values({
      id: resetTokenId,
      userId: user.id,
      token: resetToken,
      expiresAt,
    });

    // Send password reset email
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Errant Night password",
        html: generatePasswordResetEmailHTML(user.username, resetLink),
      });
      
      await logAudit({
        userId: user.id,
        eventType: "AUTH_PASSWORD_RESET_REQUEST",
        description: `Identity recovery requested for: ${user.username}`,
        req,
      });

      return res.json({ success: true, message: "If the account exists, recovery instructions have been sent." });
    } catch (emailError) {
      logger.error({ emailError, email }, "Failed to send password reset email");
      return res.status(500).json({ error: "Failed to send reset email" });
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Reset password
router.post("/auth/reset-password", authLimit, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    // Get reset token
    const resetTokens = await db
      .select()
      .from(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.token, token))
      .limit(1);

    if (resetTokens.length === 0) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const resetRecord = resetTokens[0];

    // Check if token is expired
    if (new Date() > resetRecord.expiresAt) {
      res.status(400).json({ error: "Reset token has expired" });
      return;
    }

    // Get user
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, resetRecord.userId))
      .limit(1);

    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = users[0];

    // New: Complexity check (1 letter + 1 number)
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      res.status(400).json({ error: "Password must contain at least one letter and one number" });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Atomic update: password change + lockout clear + token invalidation
    await db.transaction(async (tx) => {
      // Update password and CLEAR lockout state
      await tx
        .update(usersTable)
        .set({ 
          passwordHash: newPasswordHash,
          failedLoginAttempts: 0,
          lockedUntil: null 
        })
        .where(eq(usersTable.id, user.id));

      // Delete used token
      await tx.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.token, token));
    });

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    logger.error({ error }, "Password reset error");
    res.status(500).json({ error: "Server error" });
  }
});

// Refresh Token endpoint
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = RefreshTokenBody.parse(req.body);
    
    // 1. Verify token cryptographically
    const userId = verifyRefreshToken(refreshToken);
    if (!userId) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // 2. Verify token in DB (lookup and expiry)
    const storedTokens = await db
      .select()
      .from(refreshTokensTable)
      .where(and(eq(refreshTokensTable.token, refreshToken), eq(refreshTokensTable.userId, userId)))
      .limit(1);

    if (storedTokens.length === 0 || new Date() > storedTokens[0].expiresAt) {
      res.status(401).json({ error: "Refresh token expired or revoked" });
      return;
    }

    // 3. Issue new access token
    const newAccessToken = generateToken(userId);
    
    // Optional: Rotate refresh token (issue a new one and delete the old one)
    // For simplicity we'll keep the same refresh token but we could rotate it here.

    res.json({ token: newAccessToken });
  } catch (err) {
    res.status(400).json({ error: "Invalid request" });
  }
});

// Logout endpoint
router.post("/auth/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, refreshToken));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});

export default router;