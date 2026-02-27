/**
 * useLeaderboard Hook
 * Fetches and aggregates comment data to show top 10 most helpful users
 */

import { useState, useCallback, useEffect } from 'react';
import { LeaderboardEntry, User } from '@/types';
import { commentService } from '@/services/comment.service';

interface UseLeaderboardOptions {
  /** Number of days to look back (default 30) */
  daysBack?: number;
  /** Maximum number of entries to return (default 10) */
  limit?: number;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseLeaderboardReturn {
  /** Leaderboard entries sorted by comment count */
  leaderboard: LeaderboardEntry[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh the leaderboard data */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and displaying the "Most Helpful" leaderboard
 */
export function useLeaderboard({
  daysBack = 30,
  limit = 10,
  autoFetch = true,
}: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize service
  useEffect(() => {
    async function init() {
      try {
        await commentService.initialize();
        setInitialized(true);
      } catch (err) {
        console.error('[useLeaderboard] Failed to initialize service:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
    init();
  }, []);

  // Fetch and aggregate leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    if (!initialized) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get all recent comments
      const comments = await commentService.getAllRecentComments(daysBack);

      // Aggregate by author
      const authorMap = new Map<string, { user: User; count: number }>();

      comments.forEach((comment) => {
        const authorId = comment.author.id;
        const existing = authorMap.get(authorId);
        if (existing) {
          existing.count++;
        } else {
          authorMap.set(authorId, {
            user: comment.author,
            count: 1,
          });
        }
      });

      // Convert to array, sort by count, take top N
      const sorted = Array.from(authorMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      // Map to LeaderboardEntry with ranks
      const entries: LeaderboardEntry[] = sorted.map((item, index) => ({
        user: item.user,
        commentCount: item.count,
        rank: index + 1,
      }));

      setLeaderboard(entries);
    } catch (err) {
      console.error('[useLeaderboard] Error fetching leaderboard:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load leaderboard'
      );
    } finally {
      setIsLoading(false);
    }
  }, [initialized, daysBack, limit]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && initialized) {
      fetchLeaderboard();
    }
  }, [autoFetch, initialized, fetchLeaderboard]);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    isLoading,
    error,
    refresh,
  };
}

export default useLeaderboard;
