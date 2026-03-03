/**
 * useOrgDiscussions Hook
 * Manages fetching and state for organization-wide discussion list
 * Used in the org admin settings page for pinning discussions
 */

import { useState, useCallback, useEffect } from 'react';
import { Discussion } from '@/types';
import { discussionService } from '@/services/discussion.service';

interface Project {
  id: string;
  name: string;
}

interface UseOrgDiscussionsOptions {
  /** Page size (default: 25) */
  pageSize?: number;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseOrgDiscussionsReturn {
  /** List of discussions */
  discussions: Discussion[];
  /** List of available projects */
  projects: Project[];
  /** Currently selected project ID (undefined = all projects) */
  selectedProjectId?: string;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether projects are loading */
  isLoadingProjects: boolean;
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
  /** Fetch/refresh discussions */
  refresh: () => Promise<void>;
  /** Go to a specific page */
  goToPage: (pageNum: number) => Promise<void>;
  /** Set project filter */
  setProjectFilter: (projectId?: string) => void;
  /** Toggle pin status on a discussion */
  togglePin: (discussionId: number) => Promise<void>;
}

/**
 * Hook for fetching and managing organization-wide discussion list
 */
export function useOrgDiscussions({
  pageSize = 25,
  autoFetch = true,
}: UseOrgDiscussionsOptions = {}): UseOrgDiscussionsReturn {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Initialize services
  useEffect(() => {
    async function init() {
      try {
        await discussionService.initialize();
        setInitialized(true);
      } catch (err) {
        console.error(
          '[useOrgDiscussions] Failed to initialize services:',
          err
        );
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
    init();
  }, []);

  // Fetch projects list
  useEffect(() => {
    async function fetchProjects() {
      if (!initialized) return;

      setIsLoadingProjects(true);
      try {
        const projectList = await discussionService.getProjects();
        setProjects(projectList);
      } catch (err) {
        console.error('[useOrgDiscussions] Error fetching projects:', err);
        // Don't set error state - projects are optional for filtering
      } finally {
        setIsLoadingProjects(false);
      }
    }
    fetchProjects();
  }, [initialized]);

  // Fetch discussions
  const fetchDiscussions = useCallback(
    async (pageNum: number) => {
      if (!initialized) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await discussionService.listOrgWide({
          projectId: selectedProjectId,
          page: pageNum,
          pageSize,
        });

        setDiscussions(result.items);
        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
        setPage(pageNum);
      } catch (err) {
        console.error('[useOrgDiscussions] Error fetching discussions:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load discussions'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [initialized, selectedProjectId, pageSize]
  );

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch && initialized) {
      fetchDiscussions(1);
    }
  }, [autoFetch, initialized, selectedProjectId, fetchDiscussions]);

  // Refresh - refetch from page 1
  const refresh = useCallback(async () => {
    await fetchDiscussions(1);
  }, [fetchDiscussions]);

  // Go to a specific page
  const goToPage = useCallback(
    async (pageNum: number) => {
      if (isLoading) return;
      await fetchDiscussions(pageNum);
    },
    [fetchDiscussions, isLoading]
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Set project filter
  const setProjectFilter = useCallback((projectId?: string) => {
    setSelectedProjectId(projectId);
    setPage(1);
  }, []);

  // Toggle pin status on a discussion
  const togglePin = useCallback(
    async (discussionId: number) => {
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) return;

      const newPinned = !discussion.isPinned;

      try {
        // Optimistically update UI
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === discussionId ? { ...d, isPinned: newPinned } : d
          )
        );

        // Call API
        await discussionService.pin(discussionId, newPinned);

        // Re-sort discussions (pinned first)
        setDiscussions((prev) => {
          const sorted = [...prev].sort((a, b) => {
            if (a.isPinned !== b.isPinned) {
              return a.isPinned ? -1 : 1;
            }
            return b.createdDate.getTime() - a.createdDate.getTime();
          });
          return sorted;
        });
      } catch (err) {
        console.error('[useOrgDiscussions] Error toggling pin:', err);
        // Revert optimistic update
        setDiscussions((prev) =>
          prev.map((d) =>
            d.id === discussionId ? { ...d, isPinned: !newPinned } : d
          )
        );
        setError(
          err instanceof Error ? err.message : 'Failed to update pin status'
        );
      }
    },
    [discussions]
  );

  return {
    discussions,
    projects,
    selectedProjectId,
    isLoading,
    isLoadingProjects,
    error,
    hasMore,
    page,
    totalPages,
    totalCount,
    refresh,
    goToPage,
    setProjectFilter,
    togglePin,
  };
}

export default useOrgDiscussions;
