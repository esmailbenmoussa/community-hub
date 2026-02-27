/**
 * LeaderboardItem
 * Displays a single user row in the "Most Helpful" leaderboard
 */

import { LeaderboardEntry } from '@/types';
import { Avatar } from '@/components/atoms/Avatar';

interface LeaderboardItemProps {
  /** The leaderboard entry to display */
  entry: LeaderboardEntry;
}

/**
 * LeaderboardItem component - displays a single leaderboard row
 */
export function LeaderboardItem({ entry }: LeaderboardItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Avatar */}
      <Avatar user={entry.user} size="sm" />

      {/* Name */}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-content">
          {entry.user.displayName}
        </span>
      </div>

      {/* Comment count */}
      <div className="flex flex-shrink-0 items-center gap-1 text-right">
        <svg
          className="h-4 w-4 text-content-disabled"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-sm font-medium text-content-secondary">
          {entry.commentCount}
        </span>
      </div>
    </div>
  );
}

export default LeaderboardItem;
