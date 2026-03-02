import { motion, AnimatePresence } from 'framer-motion';
import { Discussion } from '@/types';
import { DiscussionRow } from '@/components/molecules/DiscussionRow';
import { Pagination } from '@/components/atoms/Pagination';
import { useAzureDevOps } from '@/hooks/useAzureDevOps';

interface DiscussionListProps {
  /** List of discussions to display */
  discussions: Discussion[];
  /** Set of discussion IDs that the current user has voted on */
  votedIds: Set<number>;
  /** Callback when vote button is clicked */
  onVote: (discussionId: number) => void;
  /** Callback when a discussion is clicked */
  onDiscussionClick: (discussionId: number) => void;
  /** Whether the list is loading */
  isLoading?: boolean;
  /** Current page number (1-indexed) */
  currentPage?: number;
  /** Total number of pages */
  totalPages?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Whether voting is disabled (e.g., while processing) */
  voteDisabled?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Loading skeleton for discussion rows
 */
function DiscussionSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 rounded-lg border border-border bg-surface p-4">
      {/* Vote button skeleton */}
      <div className="flex-shrink-0">
        <div className="h-8 w-14 rounded-md bg-surface-tertiary" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        <div className="h-4 w-24 rounded bg-surface-tertiary" />
        <div className="h-5 w-3/4 rounded bg-surface-tertiary" />
        <div className="h-4 w-1/2 rounded bg-surface-tertiary" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg
        className="mb-4 h-16 w-16 text-content-disabled"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <p className="text-lg text-content-secondary">{message}</p>
    </div>
  );
}

/**
 * DiscussionList component - displays a list of discussions
 * with loading states, empty states, and infinite scroll support
 */
export function DiscussionList({
  discussions,
  votedIds,
  onVote,
  onDiscussionClick,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  voteDisabled = false,
  emptyMessage = 'No discussions yet. Start a new one!',
}: DiscussionListProps) {
  const { projectName: currentProjectName } = useAzureDevOps();
  // Show loading skeletons
  if (isLoading && discussions.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <DiscussionSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!isLoading && discussions.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {discussions.map((discussion, index) => (
          <motion.div
            key={discussion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            <DiscussionRow
              discussion={discussion}
              hasVoted={votedIds.has(discussion.id)}
              onVote={onVote}
              onClick={onDiscussionClick}
              voteDisabled={voteDisabled}
              currentProjectName={currentProjectName}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Loading more indicator */}
      {isLoading && discussions.length > 0 && (
        <div className="py-4">
          <DiscussionSkeleton />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="pt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
}

export default DiscussionList;
