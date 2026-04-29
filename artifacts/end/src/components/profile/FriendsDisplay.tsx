import React, { useState } from "react";
import { Friend, FriendRequest, SearchResult } from "@/hooks/useFriends";

interface FriendsDisplayProps {
  friends: Friend[];
  friendRequests: FriendRequest[];
  isLoading?: boolean;
  onRemoveFriend?: (friendId: string) => void;
  onAcceptRequest?: (friendId: string) => void;
  onDeclineRequest?: (friendId: string) => void;
  onSendRequest?: (friendId: string) => void;
  onSearchChange?: (query: string) => void;
  searchResults?: SearchResult[];
  isSearching?: boolean;
}

export function FriendsDisplay({
  friends,
  friendRequests,
  isLoading = false,
  onRemoveFriend,
  onAcceptRequest,
  onDeclineRequest,
  onSendRequest,
  onSearchChange,
  searchResults = [],
  isSearching = false,
}: FriendsDisplayProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">👥 FRIENDS</h2>
        <div className="text-center py-8 text-gray-500">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">👥 FRIENDS</h2>
        <div className="text-sm font-semibold text-gray-600">
          {friends.length} friend{friends.length !== 1 ? "s" : ""}
          {friendRequests.length > 0 && (
            <span className="ml-3 text-yellow-500">
              + {friendRequests.length} request{friendRequests.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search players by username..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsSearchOpen(true)}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
        />

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-gray-400 text-sm">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 border-b border-gray-700 flex items-center justify-between hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{result.username}</div>
                  </div>
                  {result.friendshipStatus === "accepted" ? (
                    <span className="text-xs px-2 py-1 bg-cyan-900 text-cyan-300 rounded">
                      Friends
                    </span>
                  ) : result.friendshipStatus === "pending" ? (
                    <span className="text-xs px-2 py-1 bg-yellow-900 text-yellow-300 rounded">
                      Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onSendRequest?.(result.id);
                        setIsSearchOpen(false);
                      }}
                      className="px-3 py-1 text-xs rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-gray-400 text-sm">No players found</div>
            )}
          </div>
        )}
        {isSearchOpen && searchQuery.length < 2 && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-400 text-sm"
            onClick={() => setIsSearchOpen(false)}
          >
            Type at least 2 characters to search
          </div>
        )}
        {isSearchOpen && !isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsSearchOpen(false)}
          />
        )}
      </div>

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-yellow-500 uppercase">Incoming Requests</h3>
          {friendRequests.map((request) => (
            <div
              key={request.id}
              className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-700 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-sm">{request.username}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAcceptRequest?.(request.id)}
                  className="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-500 text-white transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => onDeclineRequest?.(request.id)}
                  className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends List Section */}
      {friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="p-3 rounded-lg bg-gray-700/50 border border-gray-600 flex items-center justify-between hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1">
                <div className="font-semibold text-sm">{friend.username}</div>
              </div>
              <button
                onClick={() => onRemoveFriend?.(friend.id)}
                className="px-3 py-1 text-xs rounded bg-red-900 hover:bg-red-800 text-red-300 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : friendRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-3">No friends yet. Search and add players!</p>
        </div>
      ) : null}
    </div>
  );
}
