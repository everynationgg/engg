import React from "react";
import { Achievement } from "@/hooks/useAchievements";

interface AchievementsDisplayProps {
  totalAchievements: number;
  unlockedCount: number;
  achievements: Achievement[];
  isLoading?: boolean;
}

const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
  common: {
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-600",
  },
  rare: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-600",
  },
  epic: {
    bg: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-600",
  },
  legendary: {
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-600",
  },
};

export function AchievementsDisplay({
  totalAchievements,
  unlockedCount,
  achievements,
  isLoading = false,
}: AchievementsDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">🏆 ACHIEVEMENTS</h2>
          <div className="text-sm font-semibold text-gray-600">
            {unlockedCount} / {totalAchievements}
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
            style={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
          />
        </div>
        <div className="text-center py-12 text-gray-500">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">🏆 ACHIEVEMENTS</h2>
          <div className="text-sm font-semibold text-gray-600">
            {unlockedCount} / {totalAchievements}
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
            style={{
              width: `${(unlockedCount / totalAchievements) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {achievements.map((achievement) => {
          const colors = rarityColors[achievement.rarity] || rarityColors.common;
          const isUnlocked = achievement.unlocked;

          return (
            <div
              key={achievement.id}
              className={`relative group transition-all duration-200 ${
                isUnlocked ? "opacity-100" : "opacity-60 hover:opacity-80"
              }`}
            >
              {/* Card */}
              <div
                className={`p-4 rounded-lg border-2 text-center h-full flex flex-col items-center justify-center gap-2 ${
                  isUnlocked ? `${colors.bg} ${colors.border}` : "bg-gray-50 border-gray-300"
                }`}
              >
                <div className="text-4xl relative">
                  {achievement.icon}
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                      <span className="text-lg">🔒</span>
                    </div>
                  )}
                </div>
                <div className="text-xs font-bold line-clamp-2">{achievement.name}</div>
                {isUnlocked && achievement.unlockedAt && (
                  <div className="text-xs text-gray-500">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-normal">
                <div className="font-bold mb-1">{achievement.name}</div>
                <div className="text-gray-300 mb-2">{achievement.description}</div>
                <div className={`text-xs font-semibold capitalize ${colors.text}`}>
                  {achievement.rarity}
                </div>
                {!isUnlocked && (
                  <div className="mt-2 text-xs text-yellow-300">Locked - Keep playing!</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No achievements yet. Start playing to earn your first achievement!
        </div>
      )}
    </div>
  );
}
