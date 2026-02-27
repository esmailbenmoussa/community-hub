/**
 * Leaderboard
 * Displays the "Most Helpful" users panel with top contributors
 */

import { LeaderboardEntry } from '@/types';
import { LeaderboardItem } from '@/components/molecules/LeaderboardItem';

interface LeaderboardProps {
  /** Leaderboard entries to display */
  entries: LeaderboardEntry[];
  /** Whether data is loading */
  isLoading?: boolean;
}

/**
 * Skeleton loader for leaderboard items
 */
function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 py-2">
          <div className="h-5 w-6 rounded bg-surface-hover" />
          <div className="h-6 w-6 rounded-full bg-surface-hover" />
          <div className="h-4 flex-1 rounded bg-surface-hover" />
          <div className="h-4 w-8 rounded bg-surface-hover" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no activity
 */
function LeaderboardEmpty() {
  return (
    <div className="py-8 text-center">
      <svg
        className="mx-auto h-10 w-10 text-content-disabled"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <p className="mt-2 text-sm text-content-secondary">No activity yet</p>
      <p className="text-xs text-content-disabled">
        Start contributing to appear here
      </p>
    </div>
  );
}

/**
 * Leaderboard component - displays the "Most Helpful" users panel
 */
export function Leaderboard({ entries, isLoading = false }: LeaderboardProps) {
  return (
    <div className="bg-surface p-4">
      {/* Header */}
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
        <h3 className="text-sm font-semibold text-content">Most Helpful</h3>
        <p className="text-xs text-content-secondary">Last 30 days</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : entries.length === 0 ? (
        <LeaderboardEmpty />
      ) : (
        <div>
          {entries.map((entry) => (
            <LeaderboardItem key={entry.user.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
