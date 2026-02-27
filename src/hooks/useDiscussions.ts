/**
 * useDiscussions Hook
 * Manages fetching and state for discussion list
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Discussion,
  ListDiscussionsOptions,
  SortOption,
  Category,
} from '@/types';
import { discussionService } from '@/services/discussion.service';
import { voteService } from '@/services/vote.service';

/** localStorage key for persisting sort preference */
const SORT_PREFERENCE_KEY = 'community-hub-sort-preference';

/**
 * Get saved sort preference from localStorage with validation
 */
function getSavedSortPreference(): SortOption {
  try {
    const saved = localStorage.getItem(SORT_PREFERENCE_KEY);
    if (saved && Object.values(SortOption).includes(saved as SortOption)) {
      return saved as SortOption;
    }
  } catch {
    // localStorage might not be available (e.g., private browsing)
  }
  return SortOption.Newest;
}

interface UseDiscussionsOptions {
  /** Initial category filter */
  category?: Category;
  /** Initial sort option */
  sort?: SortOption;
  /** Page size (default: 25) */
  pageSize?: number;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseDiscussionsReturn {
  /** List of discussions */
  discussions: Discussion[];
  /** Set of discussion IDs the user has voted on */
  votedIds: Set<number>;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether there are more discussions to load */
  hasMore: boolean;
  /** Current page number */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total count of discussions */
  totalCount: number;
  /** Current filters */
  filters: {
    category?: Category;
    sort: SortOption;
  };
  /** Fetch/refresh discussions */
  refresh: () => Promise<void>;
  /** Load more discussions (for infinite scroll - deprecated, use goToPage) */
  loadMore: () => Promise<void>;
  /** Go to a specific page */
  goToPage: (pageNum: number) => Promise<void>;
  /** Set category filter */
  setCategory: (category?: Category) => void;
  /** Set sort option */
  setSort: (sort: SortOption) => void;
  /** Toggle vote on a discussion */
  toggleVote: (discussionId: number) => Promise<void>;
}

/**
 * Hook for fetching and managing discussion list
 */
export function useDiscussions({
  category: initialCategory,
  sort: initialSort = SortOption.Newest,
  pageSize = 25,
  autoFetch = true,
}: UseDiscussionsOptions = {}): UseDiscussionsReturn {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [category, setCategory] = useState<Category | undefined>(
    initialCategory
  );
  const [sort, setSort] = useState<SortOption>(
    initialSort ?? getSavedSortPreference()
  );
  const [initialized, setInitialized] = useState(false);

  // Initialize services
  useEffect(() => {
    async function init() {
      try {
        await discussionService.initialize();
        await voteService.initialize();
        setInitialized(true);
      } catch (err) {
        console.error('[useDiscussions] Failed to initialize services:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
    init();
  }, []);

  // Fetch discussions
  const fetchDiscussions = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!initialized) return;

      setIsLoading(true);
      setError(null);

      try {
        const options: ListDiscussionsOptions = {
          filters: category ? { category } : undefined,
          sort,
          page: pageNum,
          pageSize,
        };

        const result = await discussionService.list(options);

        // Enrich discussions with recent commenters
        const enrichedItems = await discussionService.enrichWithCommenters(
          result.items
        );

        if (append) {
          setDiscussions((prev) => [...prev, ...enrichedItems]);
        } else {
          setDiscussions(enrichedItems);
        }

        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
        setPage(pageNum);

        // Fetch user's votes for these discussions
        const discussionIds = result.items.map((d) => d.id);
        const votedSet = await voteService.getUserVotes(discussionIds);

        if (append) {
          setVotedIds((prev) => {
            const combined = new Set<number>(prev);
            votedSet.forEach((id) => combined.add(id));
            return combined;
          });
        } else {
          setVotedIds(votedSet);
        }
      } catch (err) {
        console.error('[useDiscussions] Error fetching discussions:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load discussions'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [initialized, category, sort, pageSize]
  );

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch && initialized) {
      fetchDiscussions(1, false);
    }
  }, [autoFetch, initialized, category, sort, fetchDiscussions]);

  // Refresh - refetch from page 1
  const refresh = useCallback(async () => {
    await fetchDiscussions(1, false);
  }, [fetchDiscussions]);

  // Load more - fetch next page and append
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchDiscussions(page + 1, true);
  }, [fetchDiscussions, hasMore, isLoading, page]);

  // Go to a specific page (replaces current discussions)
  const goToPage = useCallback(
    async (pageNum: number) => {
      if (isLoading) return;
      await fetchDiscussions(pageNum, false);
    },
    [fetchDiscussions, isLoading]
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Update category filter
  const handleSetCategory = useCallback((newCategory?: Category) => {
    setCategory(newCategory);
    setPage(1);
  }, []);

  // Update sort option and persist to localStorage
  const handleSetSort = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
    try {
      localStorage.setItem(SORT_PREFERENCE_KEY, newSort);
    } catch {
      // Ignore if localStorage is unavailable
    }
  }, []);

  // Toggle vote on a discussion
  const toggleVote = useCallback(
    async (discussionId: number) => {
      const hasVoted = votedIds.has(discussionId);

      try {
        if (hasVoted) {
          await voteService.removeVote(discussionId);
          setVotedIds((prev) => {
            const next = new Set(prev);
            next.delete(discussionId);
            return next;
          });
          // Update local vote count
          setDiscussions((prev) =>
            prev.map((d) =>
              d.id === discussionId
                ? { ...d, voteCount: Math.max(0, d.voteCount - 1) }
                : d
            )
          );
        } else {
          await voteService.upvote(discussionId);
          setVotedIds((prev) => new Set([...prev, discussionId]));
          // Update local vote count
          setDiscussions((prev) =>
            prev.map((d) =>
              d.id === discussionId ? { ...d, voteCount: d.voteCount + 1 } : d
            )
          );
        }
      } catch (err) {
        console.error('[useDiscussions] Error toggling vote:', err);
        setError(err instanceof Error ? err.message : 'Failed to update vote');
      }
    },
    [votedIds]
  );

  return {
    discussions,
    votedIds,
    isLoading,
    error,
    hasMore,
    page,
    totalPages,
    totalCount,
    filters: {
      category,
      sort,
    },
    refresh,
    loadMore,
    goToPage,
    setCategory: handleSetCategory,
    setSort: handleSetSort,
    toggleVote,
  };
}

export default useDiscussions;
