import { Router } from "express";
import { db, usersTable, friendshipsTable } from "@workspace/db";
import { eq, and, or, ilike, inArray } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const friendsRouter = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Public user shape — deliberately excludes email for privacy. */
const publicUserSelect = {
  id: usersTable.id,
  username: usersTable.username,
  createdAt: usersTable.createdAt,
} as const;

// GET /api/user/friends - Get all accepted friends
friendsRouter.get("/user/friends", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.userId!;

    const friendRows = await db
      .select({
        userId: friendshipsTable.userId,
        friendId: friendshipsTable.friendId,
      })
      .from(friendshipsTable)
      .where(
        and(
          or(eq(friendshipsTable.userId, userId), eq(friendshipsTable.friendId, userId)),
          eq(friendshipsTable.status, "accepted")
        )
      );

    const friendIds = friendRows.map((row) =>
      row.userId === userId ? row.friendId : row.userId
    );

    if (friendIds.length === 0) {
      res.json([]);
      return;
    }

    const friends = await db
      .select(publicUserSelect)
      .from(usersTable)
      .where(inArray(usersTable.id, friendIds));

    const io = req.app.get("io");
    const friendsWithStatus = friends.map(f => {
      const isOnline = io?.sockets.adapter.rooms.get(`user:${f.id}`)?.size ?? 0;
      return {
        ...f,
        status: isOnline > 0 ? "online" : "offline"
      };
    });

    res.json(friendsWithStatus);
  } catch (error) {
    logger.error({ err: error }, "Error fetching friends");
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// GET /api/user/friend-requests - Get pending friend requests
friendsRouter.get(
  "/user/friend-requests",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.userId!;

      const requestRows = await db
        .select({ userId: friendshipsTable.userId })
        .from(friendshipsTable)
        .where(
          and(eq(friendshipsTable.friendId, userId), eq(friendshipsTable.status, "pending"))
        );

      const requestUserIds = requestRows.map((row) => row.userId);

      if (requestUserIds.length === 0) {
        res.json([]);
        return;
      }

      const requests = await db
        .select(publicUserSelect)
        .from(usersTable)
        .where(inArray(usersTable.id, requestUserIds));

      res.json(requests);
    } catch (error) {
      logger.error({ err: error }, "Error fetching friend requests");
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  }
);

// POST /api/user/send-friend-request - Send friend request
friendsRouter.post(
  "/user/send-friend-request",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.userId!;
      const { friendId } = req.body;

      if (!friendId || typeof friendId !== "string") {
        res.status(400).json({ error: "friendId is required" });
        return;
      }

      if (userId === friendId) {
        res.status(400).json({ error: "Cannot add yourself as a friend" });
        return;
      }

      // Check friend exists and no relationship exists in a single round-trip
      const [targetUsers, existingFriendship] = await Promise.all([
        db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.id, friendId))
          .limit(1),
        db
          .select({ status: friendshipsTable.status })
          .from(friendshipsTable)
          .where(
            or(
              and(eq(friendshipsTable.userId, userId), eq(friendshipsTable.friendId, friendId)),
              and(eq(friendshipsTable.userId, friendId), eq(friendshipsTable.friendId, userId))
            )
          )
          .limit(1),
      ]);

      if (targetUsers.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (existingFriendship.length > 0) {
        res.status(400).json({ error: "Friendship already exists or request pending" });
        return;
      }

      await db.insert(friendshipsTable).values({
        userId,
        friendId,
        status: "pending",
        updatedAt: new Date(),
      });

      res.json({ success: true, message: "Friend request sent" });
    } catch (error) {
      logger.error({ err: error }, "Error sending friend request");
      res.status(500).json({ error: "Failed to send friend request" });
    }
  }
);

// POST /api/user/accept-friend-request - Accept friend request
friendsRouter.post(
  "/user/accept-friend-request",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.userId!;
      const { friendId } = req.body;

      if (!friendId || typeof friendId !== "string") {
        res.status(400).json({ error: "friendId is required" });
        return;
      }

      const requests = await db
        .select()
        .from(friendshipsTable)
        .where(
          and(
            eq(friendshipsTable.userId, friendId),
            eq(friendshipsTable.friendId, userId),
            eq(friendshipsTable.status, "pending")
          )
        );

      if (requests.length === 0) {
        res.status(404).json({ error: "Friend request not found" });
        return;
      }

      // Update original + insert reverse direction atomically
      await db.transaction(async (tx) => {
        await tx
          .update(friendshipsTable)
          .set({ status: "accepted", updatedAt: new Date() })
          .where(
            and(
              eq(friendshipsTable.userId, friendId),
              eq(friendshipsTable.friendId, userId)
            )
          );

        await tx.insert(friendshipsTable).values({
          userId,
          friendId,
          status: "accepted",
        });
      });

      res.json({ success: true, message: "Friend request accepted" });
    } catch (error) {
      logger.error({ err: error }, "Error accepting friend request");
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  }
);

// POST /api/user/decline-friend-request - Decline friend request
friendsRouter.post(
  "/user/decline-friend-request",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.userId!;
      const { friendId } = req.body;

      if (!friendId || typeof friendId !== "string") {
        res.status(400).json({ error: "friendId is required" });
        return;
      }

      await db
        .delete(friendshipsTable)
        .where(
          and(
            eq(friendshipsTable.userId, friendId),
            eq(friendshipsTable.friendId, userId),
            eq(friendshipsTable.status, "pending")
          )
        );

      res.json({ success: true, message: "Friend request declined" });
    } catch (error) {
      logger.error({ err: error }, "Error declining friend request");
      res.status(500).json({ error: "Failed to decline friend request" });
    }
  }
);

// POST /api/user/remove-friend - Remove a friend
friendsRouter.post(
  "/user/remove-friend",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.userId!;
      const { friendId } = req.body;

      if (!friendId || typeof friendId !== "string") {
        res.status(400).json({ error: "friendId is required" });
        return;
      }

      await db
        .delete(friendshipsTable)
        .where(
          or(
            and(eq(friendshipsTable.userId, userId), eq(friendshipsTable.friendId, friendId)),
            and(eq(friendshipsTable.userId, friendId), eq(friendshipsTable.friendId, userId))
          )
        );

      res.json({ success: true, message: "Friend removed" });
    } catch (error) {
      logger.error({ err: error }, "Error removing friend");
      res.status(500).json({ error: "Failed to remove friend" });
    }
  }
);

// GET /api/user/search-friends - Search for users to add as friends
friendsRouter.get(
  "/user/search-friends",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.userId!;
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        res.status(400).json({ error: "query parameter is required" });
        return;
      }

      if (query.length < 2) {
        res.status(400).json({ error: "query must be at least 2 characters" });
        return;
      }

      // Search by username only — never expose email in search results
      const searchResults = await db
        .select(publicUserSelect)
        .from(usersTable)
        .where(ilike(usersTable.username, `%${query}%`));

      const filtered = searchResults.filter((u) => u.id !== userId);

      if (filtered.length === 0) {
        res.json([]);
        return;
      }

      // Batch-fetch all relevant friendship rows in a single query (no N+1)
      const friendIds = filtered.map((u) => u.id);
      const friendships = await db
        .select({
          userId: friendshipsTable.userId,
          friendId: friendshipsTable.friendId,
          status: friendshipsTable.status,
        })
        .from(friendshipsTable)
        .where(
          or(
            and(eq(friendshipsTable.userId, userId), inArray(friendshipsTable.friendId, friendIds)),
            and(inArray(friendshipsTable.userId, friendIds), eq(friendshipsTable.friendId, userId))
          )
        );

      // Build a lookup map: otherUserId → status
      const statusMap = new Map(
        friendships.map((f) => [
          f.userId === userId ? f.friendId : f.userId,
          f.status,
        ])
      );

      res.json(
        filtered.map((user) => ({
          ...user,
          friendshipStatus: statusMap.get(user.id) ?? null,
        }))
      );
    } catch (error) {
      logger.error({ err: error }, "Error searching for friends");
      res.status(500).json({ error: "Failed to search for friends" });
    }
  }
);

export { friendsRouter };
