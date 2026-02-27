/**
 * useComments Hook
 * Manages fetching and state for discussion comments
 */

import { useState, useCallback, useEffect } from 'react';
import { Comment, CreateCommentInput } from '@/types';
import { commentService } from '@/services/comment.service';

interface UseCommentsOptions {
  /** Discussion ID to fetch comments for */
  discussionId: number;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseCommentsReturn {
  /** List of comments */
  comments: Comment[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether a comment is being submitted */
  isSubmitting: boolean;
  /** Error message if any */
  error: string | null;
  /** Fetch/refresh comments */
  refresh: () => Promise<void>;
  /** Add a new comment */
  addComment: (text: string) => Promise<Comment | null>;
  /** Update a comment */
  updateComment: (commentId: number, text: string) => Promise<Comment | null>;
  /** Delete a comment */
  deleteComment: (commentId: number) => Promise<boolean>;
}

/**
 * Hook for fetching and managing comments on a discussion
 */
export function useComments({
  discussionId,
  autoFetch = true,
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize service
  useEffect(() => {
    async function init() {
      try {
        await commentService.initialize();
        setInitialized(true);
      } catch (err) {
        console.error('[useComments] Failed to initialize service:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
    init();
  }, []);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!initialized) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await commentService.getComments(discussionId);
      setComments(result);
    } catch (err) {
      console.error('[useComments] Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [initialized, discussionId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && initialized) {
      fetchComments();
    }
  }, [autoFetch, initialized, fetchComments]);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchComments();
  }, [fetchComments]);

  // Add comment
  const addComment = useCallback(
    async (text: string): Promise<Comment | null> => {
      if (!text.trim()) {
        setError('Comment cannot be empty');
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const input: CreateCommentInput = { text };
        const newComment = await commentService.addComment(discussionId, input);
        setComments((prev) => [...prev, newComment]);
        return newComment;
      } catch (err) {
        console.error('[useComments] Error adding comment:', err);
        setError(err instanceof Error ? err.message : 'Failed to add comment');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [discussionId]
  );

  // Update comment
  const updateComment = useCallback(
    async (commentId: number, text: string): Promise<Comment | null> => {
      if (!text.trim()) {
        setError('Comment cannot be empty');
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const updated = await commentService.updateComment(
          discussionId,
          commentId,
          { text }
        );
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updated : c))
        );
        return updated;
      } catch (err) {
        console.error('[useComments] Error updating comment:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to update comment'
        );
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [discussionId]
  );

  // Delete comment
  const deleteComment = useCallback(
    async (commentId: number): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);

      try {
        await commentService.deleteComment(discussionId, commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        return true;
      } catch (err) {
        console.error('[useComments] Error deleting comment:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to delete comment'
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [discussionId]
  );

  return {
    comments,
    isLoading,
    isSubmitting,
    error,
    refresh,
    addComment,
    updateComment,
    deleteComment,
  };
}

export default useComments;
