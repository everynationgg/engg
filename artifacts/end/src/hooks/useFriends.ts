import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";

export interface Friend {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  friendshipStatus: "pending" | "accepted" | null;
}

export function useFriends() {
  const { token, isInitialized } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/friends`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }

      const data = await response.json();
      setFriends(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch friends";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchFriendRequests = useCallback(async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/friend-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }

      const data = await response.json();
      setFriendRequests(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch friend requests";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const sendFriendRequest = useCallback(
    async (friendId: string) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/send-friend-request`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send friend request");
        }

        // Update search results to show pending status
        setSearchResults((prev) =>
          prev.map((result) =>
            result.id === friendId ? { ...result, friendshipStatus: "pending" } : result
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send friend request";
        setError(message);
      }
    },
    [token]
  );

  const acceptFriendRequest = useCallback(
    async (friendId: string) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/accept-friend-request`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to accept friend request");
        }

        // Remove from requests and refresh friends
        setFriendRequests((prev) => prev.filter((req) => req.id !== friendId));
        await fetchFriends();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to accept friend request";
        setError(message);
      }
    },
    [token, fetchFriends]
  );

  const declineFriendRequest = useCallback(
    async (friendId: string) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/decline-friend-request`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to decline friend request");
        }

        setFriendRequests((prev) => prev.filter((req) => req.id !== friendId));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to decline friend request";
        setError(message);
      }
    },
    [token]
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/remove-friend`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to remove friend");
        }

        setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to remove friend";
        setError(message);
      }
    },
    [token]
  );

  const searchFriends = useCallback(
    async (query: string) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/user/search-friends?query=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to search friends");
        }

        const data = await response.json();
        setSearchResults(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to search friends";
        setError(message);
      } finally {
        setIsSearching(false);
      }
    },
    [token]
  );

  // Fetch friends and requests on mount
  useEffect(() => {
  if (isInitialized && token) {
    fetchFriends();
    fetchFriendRequests();
  }
}, [isInitialized, token, fetchFriends, fetchFriendRequests]);

  return {
    friends,
    friendRequests,
    searchResults,
    isLoading,
    isSearching,
    error,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    searchFriends,
  };
}
