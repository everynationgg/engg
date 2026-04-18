import { Router, type IRouter } from "express";
import { db, usersTable, gameResultsTable, spectatorsTable } from "@workspace/db";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const spectatorRouter: IRouter = Router();

// POST /api/games/:gameId/join-spectator - Join game as spectator
spectatorRouter.post(
  "/games/:gameId/join-spectator",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { gameId } = req.params;

      if (!gameId || typeof gameId !== "string") {
        res.status(400).json({ error: "gameId is required" });
        return;
      }

      // Check if game exists by looking for players in that game
      const gameExists = await db
        .select()
        .from(gameResultsTable)
        .where(eq(gameResultsTable.gameId, gameId as string))
        .limit(1);

      if (gameExists.length === 0) {
        res.status(404).json({ error: "Game not found" });
        return;
      }

      // Check if user is already a participant (not a spectator)
      const isParticipant = await db
        .select()
        .from(gameResultsTable)
        .where(
          and(
            eq(gameResultsTable.gameId, gameId),
            eq(gameResultsTable.userId, req.userId)
          )
        );

      if (isParticipant.length > 0) {
        res.status(400).json({ error: "Cannot spectate a game you participated in" });
        return;
      }

      // Check if already spectating
      const alreadySpectating = await db
        .select()
        .from(spectatorsTable)
        .where(
          and(
            eq(spectatorsTable.gameId, gameId as string),
            eq(spectatorsTable.userId, req.userId),
            isNull(spectatorsTable.leftAt)
          )
        );

      if (alreadySpectating.length > 0) {
        res.status(400).json({ error: "Already spectating this game" });
        return;
      }

      // Add as spectator
      await db.insert(spectatorsTable).values({
        gameId,
        userId: req.userId,
      });

      res.json({ success: true, message: "Joined as spectator" });
    } catch (error) {
      logger.error({ err: error }, "Error joining spectator");
      res.status(500).json({ error: "Failed to join spectator" });
    }
  }
);

// POST /api/games/:gameId/leave-spectator - Leave spectator mode
spectatorRouter.post(
  "/games/:gameId/leave-spectator",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { gameId } = req.params;

      if (!gameId || typeof gameId !== "string") {
        res.status(400).json({ error: "gameId is required" });
        return;
      }

      // Mark as left
      await db
        .update(spectatorsTable)
        .set({ leftAt: new Date() })
        .where(
          and(
            eq(spectatorsTable.gameId, gameId as string),
            eq(spectatorsTable.userId, req.userId),
            isNull(spectatorsTable.leftAt)
          )
        );

      res.json({ success: true, message: "Left spectator mode" });
    } catch (error) {
      logger.error({ err: error }, "Error leaving spectator");
      res.status(500).json({ error: "Failed to leave spectator" });
    }
  }
);

// GET /api/games/:gameId/spectators - Get active spectators
spectatorRouter.get("/games/:gameId/spectators", async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId || typeof gameId !== "string") {
      res.status(400).json({ error: "gameId is required" });
      return;
    }

    // Get active spectators
    const spectators = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        joinedAt: spectatorsTable.joinedAt,
      })
      .from(spectatorsTable)
      .innerJoin(usersTable, eq(spectatorsTable.userId, usersTable.id))
      .where(
        and(
          eq(spectatorsTable.gameId, gameId as string),
          isNull(spectatorsTable.leftAt)
        )
      );

    res.json({
      gameId,
      activeSpectatorCount: spectators.length,
      spectators,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching spectators");
    res.status(500).json({ error: "Failed to fetch spectators" });
  }
});

// GET /api/games/:gameId/state - Get game state for spectators
spectatorRouter.get("/games/:gameId/state", async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId || typeof gameId !== "string") {
      res.status(400).json({ error: "gameId is required" });
      return;
    }

    // Get all players and their roles
    const players = await db
      .select({
        userId: gameResultsTable.userId,
        username: usersTable.username,
        role: gameResultsTable.role,
        won: gameResultsTable.won,
      })
      .from(gameResultsTable)
      .innerJoin(usersTable, eq(gameResultsTable.userId, usersTable.id))
      .where(eq(gameResultsTable.gameId, gameId as string));

    // Count spectators
    const spectators = await db
      .select()
      .from(spectatorsTable)
      .where(
        and(
          eq(spectatorsTable.gameId, gameId as string),
          isNull(spectatorsTable.leftAt)
        )
      );

    // Determine game status based on results
    const gameComplete = players.some((p) => p.won === "yes" || p.won === "no");
    const crewWon = players.some((p) => p.role === "crew" && p.won === "yes");
    const alienWon = players.some((p) => p.role.includes("alien") && p.won === "yes");

    res.json({
      gameId,
      gameComplete,
      winner: crewWon ? "crew" : alienWon ? "aliens" : "pending",
      playerCount: players.length,
      spectatorCount: spectators.length,
      players: players.map((p) => ({
        userId: p.userId,
        username: p.username,
        role: p.role,
        won: p.won === "yes",
      })),
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching game state");
    res.status(500).json({ error: "Failed to fetch game state" });
  }
});

// GET /api/user/spectating - Get games user is spectating
spectatorRouter.get(
  "/user/spectating",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Get active spectating games
      const spectatingGames = await db
        .select({
          gameId: spectatorsTable.gameId,
          joinedAt: spectatorsTable.joinedAt,
        })
        .from(spectatorsTable)
        .where(
          and(
            eq(spectatorsTable.userId, req.userId),
            isNull(spectatorsTable.leftAt)
          )
        );

      if (spectatingGames.length === 0) {
        res.json({ spectatingCount: 0, games: [] });
        return;
      }

      // Batch-count players per game in a single GROUP BY query (no N+1)
      const gameIds = spectatingGames.map((g) => g.gameId as string);
      const playerCounts = await db
        .select({
          gameId: gameResultsTable.gameId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(gameResultsTable)
        .where(inArray(gameResultsTable.gameId, gameIds))
        .groupBy(gameResultsTable.gameId);

      const countByGame = new Map(playerCounts.map((p) => [p.gameId, p.count]));

      const gamesWithState = spectatingGames.map((g) => ({
        gameId: g.gameId,
        joinedAt: g.joinedAt,
        playerCount: countByGame.get(g.gameId as string) ?? 0,
      }));

      res.json({
        spectatingCount: gamesWithState.length,
        games: gamesWithState,
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching spectating games");
      res.status(500).json({ error: "Failed to fetch spectating games" });
    }
  }
);

export { spectatorRouter };
