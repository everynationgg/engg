import { Router, type IRouter } from "express";
import { db, userPreferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// Get user preferences — creates default row if none exists
router.get("/user/preferences", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Upsert defaults so the row always exists after the first call
    const [prefs] = await db
      .insert(userPreferencesTable)
      .values({
        userId: req.userId,
        musicVolume: 70,
        sfxVolume: 70,
        theme: "dark",
        notificationsEnabled: true,
      })
      .onConflictDoUpdate({
        target: userPreferencesTable.userId,
        set: { updatedAt: new Date() }, // no-op update — just returns the row
      })
      .returning();

    res.json(prefs);
  } catch (error) {
    logger.error({ err: error }, "Get preferences error");
    res.status(500).json({ error: "Server error" });
  }
});

// Update user preferences — single atomic upsert, no read required
router.post("/user/preferences", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { musicVolume, sfxVolume, theme, notificationsEnabled } = req.body;

    if (musicVolume !== undefined && (musicVolume < 0 || musicVolume > 100)) {
      res.status(400).json({ error: "Music volume must be between 0 and 100" });
      return;
    }

    if (sfxVolume !== undefined && (sfxVolume < 0 || sfxVolume > 100)) {
      res.status(400).json({ error: "SFX volume must be between 0 and 100" });
      return;
    }

    if (theme !== undefined && theme !== "dark" && theme !== "light") {
      res.status(400).json({ error: "Theme must be 'dark' or 'light'" });
      return;
    }

    // Build only the fields the caller provided
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (musicVolume !== undefined) patch.musicVolume = musicVolume;
    if (sfxVolume !== undefined) patch.sfxVolume = sfxVolume;
    if (theme !== undefined) patch.theme = theme;
    if (notificationsEnabled !== undefined) patch.notificationsEnabled = notificationsEnabled;

    const [updated] = await db
      .insert(userPreferencesTable)
      .values({
        userId: req.userId,
        musicVolume: musicVolume ?? 70,
        sfxVolume: sfxVolume ?? 70,
        theme: theme ?? "dark",
        notificationsEnabled: notificationsEnabled ?? true,
      })
      .onConflictDoUpdate({
        target: userPreferencesTable.userId,
        set: patch,
      })
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error({ err: error }, "Update preferences error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
