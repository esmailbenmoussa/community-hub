/**
 * useTags Hook
 * Fetches and caches available tags from the project
 */

import { useState, useEffect, useCallback } from 'react';
import { discussionService } from '@/services/discussion.service';

interface UseTagsReturn {
  /** List of available tags */
  availableTags: string[];
  /** Whether tags are loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch tags */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching available tags from the project
 */
export function useTags(): UseTagsReturn {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await discussionService.initialize();
      const tags = await discussionService.getAllTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('[useTags] Failed to fetch tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    availableTags,
    isLoading,
    error,
    refetch: fetchTags,
  };
}

export default useTags;
