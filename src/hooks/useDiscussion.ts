/**
 * useDiscussion Hook
 * Manages fetching and state for a single discussion
 */

import { useState, useCallback, useEffect } from 'react';
import { Discussion } from '@/types';
import { discussionService } from '@/services/discussion.service';
import { voteService } from '@/services/vote.service';

interface UseDiscussionOptions {
  /** Discussion ID to fetch */
  discussionId: number;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseDiscussionReturn {
  /** The discussion data */
  discussion: Discussion | null;
  /** Whether the current user has voted */
  hasVoted: boolean;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Fetch/refresh discussion */
  refresh: () => Promise<void>;
  /** Toggle vote on the discussion */
  toggleVote: () => Promise<void>;
}

/**
 * Hook for fetching and managing a single discussion
 */
export function useDiscussion({
  discussionId,
  autoFetch = true,
}: UseDiscussionOptions): UseDiscussionReturn {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize services
  useEffect(() => {
    async function init() {
      try {
        await discussionService.initialize();
        await voteService.initialize();
        setInitialized(true);
      } catch (err) {
        console.error('[useDiscussion] Failed to initialize services:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
    init();
  }, []);

  // Fetch discussion
  const fetchDiscussion = useCallback(async () => {
    if (!initialized) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await discussionService.get(discussionId);

      if (!result) {
        setError('Discussion not found');
        setDiscussion(null);
        return;
      }

      setDiscussion(result);

      // Check if user has voted
      const voted = await voteService.hasVoted(discussionId);
      setHasVoted(voted);
    } catch (err) {
      console.error('[useDiscussion] Error fetching discussion:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load discussion'
      );
    } finally {
      setIsLoading(false);
    }
  }, [initialized, discussionId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && initialized) {
      fetchDiscussion();
    }
  }, [autoFetch, initialized, fetchDiscussion]);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchDiscussion();
  }, [fetchDiscussion]);

  // Toggle vote
  const toggleVote = useCallback(async () => {
    if (!discussion) return;

    try {
      if (hasVoted) {
        await voteService.removeVote(discussionId);
        setHasVoted(false);
        setDiscussion((prev) =>
          prev ? { ...prev, voteCount: Math.max(0, prev.voteCount - 1) } : prev
        );
      } else {
        await voteService.upvote(discussionId);
        setHasVoted(true);
        setDiscussion((prev) =>
          prev ? { ...prev, voteCount: prev.voteCount + 1 } : prev
        );
      }
    } catch (err) {
      console.error('[useDiscussion] Error toggling vote:', err);
      setError(err instanceof Error ? err.message : 'Failed to update vote');
    }
  }, [discussion, hasVoted, discussionId]);

  return {
    discussion,
    hasVoted,
    isLoading,
    error,
    refresh,
    toggleVote,
  };
}

export default useDiscussion;
