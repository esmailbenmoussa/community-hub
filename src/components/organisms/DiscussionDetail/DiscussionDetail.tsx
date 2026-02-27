/**
 * DiscussionDetail
 * Full discussion view with comments section and sidebar
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Discussion, Comment, CommentReactionType, User } from '@/types';
import { Avatar } from '@/components/atoms/Avatar';
import { TimeAgo } from '@/components/atoms/TimeAgo';
import { VoteButton } from '@/components/atoms/VoteButton';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { MarkdownRenderer } from '@/components/atoms/MarkdownRenderer';
import { Select } from '@/components/atoms/Select';
import { CommentCard } from '@/components/molecules/CommentCard';
import { CommentForm } from '@/components/molecules/CommentForm';

type CommentSortOrder = 'newest' | 'oldest';

const COMMENT_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

interface DiscussionDetailProps {
  /** The discussion to display */
  discussion: Discussion;
  /** Whether the current user has voted */
  hasVoted: boolean;
  /** List of comments */
  comments: Comment[];
  /** Current user */
  currentUser?: User;
  /** Callback when vote button is clicked */
  onVote: () => void;
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Callback when a new comment is submitted */
  onAddComment: (text: string) => Promise<void>;
  /** Callback when a comment is edited */
  onEditComment?: (commentId: number, text: string) => Promise<void>;
  /** Callback when a comment is deleted */
  onDeleteComment?: (commentId: number) => Promise<void>;
  /** Callback when a reaction is toggled on a comment */
  onToggleReaction?: (commentId: number, type: CommentReactionType) => void;
  /** Whether discussion is loading */
  isLoading?: boolean;
  /** Whether comments are loading */
  commentsLoading?: boolean;
  /** Whether a comment action is in progress */
  commentActionPending?: boolean;
  /** Whether voting is disabled */
  voteDisabled?: boolean;
}

/**
 * Loading skeleton for discussion detail
 */
function DiscussionSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-3/4 rounded bg-surface-tertiary" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-surface-tertiary" />
          <div className="h-4 w-32 rounded bg-surface-tertiary" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-surface-tertiary" />
        <div className="h-4 w-full rounded bg-surface-tertiary" />
        <div className="h-4 w-2/3 rounded bg-surface-tertiary" />
      </div>
    </div>
  );
}

/**
 * Sidebar skeleton
 */
function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-surface-tertiary" />
        <div className="h-6 w-24 rounded-full bg-surface-tertiary" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-12 rounded bg-surface-tertiary" />
        <div className="flex gap-1">
          <div className="h-5 w-12 rounded-full bg-surface-tertiary" />
          <div className="h-5 w-16 rounded-full bg-surface-tertiary" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-surface-tertiary" />
        <div className="flex gap-1">
          <div className="h-6 w-6 rounded-full bg-surface-tertiary" />
          <div className="h-6 w-6 rounded-full bg-surface-tertiary" />
          <div className="h-6 w-6 rounded-full bg-surface-tertiary" />
        </div>
      </div>
    </div>
  );
}

/**
 * Comments skeleton
 */
function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse gap-3">
          <div className="h-6 w-6 flex-shrink-0 rounded-full bg-surface-tertiary" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-surface-tertiary" />
            <div className="h-4 w-full rounded bg-surface-tertiary" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DiscussionDetail component - full discussion view with sidebar
 */
export function DiscussionDetail({
  discussion,
  hasVoted,
  comments,
  currentUser,
  onVote,
  onBack,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onToggleReaction,
  isLoading = false,
  commentsLoading = false,
  commentActionPending = false,
  voteDisabled = false,
}: DiscussionDetailProps) {
  // Comment sort state
  const [commentSort, setCommentSort] = useState<CommentSortOrder>('newest');

  // Get unique participants (author + commenters)
  const participants = useMemo(() => {
    const uniqueUsers = new Map<string, User>();
    // Add author first
    uniqueUsers.set(discussion.author.id, discussion.author);
    // Add commenters
    comments.forEach((comment) => {
      if (!uniqueUsers.has(comment.author.id)) {
        uniqueUsers.set(comment.author.id, comment.author);
      }
    });
    return Array.from(uniqueUsers.values());
  }, [discussion.author, comments]);

  // Sort comments based on selected order
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const dateA = new Date(a.createdDate).getTime();
      const dateB = new Date(b.createdDate).getTime();
      return commentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [comments, commentSort]);

  const maxVisibleParticipants = 8;
  const visibleParticipants = participants.slice(0, maxVisibleParticipants);
  const remainingCount = participants.length - maxVisibleParticipants;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1">
            <DiscussionSkeleton />
          </div>
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <SidebarSkeleton />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-5xl"
    >
      {/* Back button */}
      <div className="border-b border-border px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-content-secondary transition-colors hover:text-content"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to discussions
        </button>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex gap-8 px-6 py-6">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Discussion header */}
          <div className="mb-6">
            {/* Category badge - visible on mobile only */}
            <div className="mb-3 lg:hidden">
              <CategoryBadge category={discussion.category} size="sm" />
            </div>

            {/* Title */}
            <h1 className="mb-4 text-2xl font-bold text-content">
              {discussion.title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar user={discussion.author} size="md" showTooltip />
                <div>
                  <span className="font-medium text-content">
                    {discussion.author.displayName}
                  </span>
                  <span className="mx-2 text-content-secondary">·</span>
                  <TimeAgo date={discussion.createdDate} className="text-sm" />
                </div>
              </div>

              {/* Vote button */}
              <VoteButton
                count={discussion.voteCount}
                hasVoted={hasVoted}
                onVote={onVote}
                disabled={voteDisabled}
              />
            </div>
          </div>

          {/* Discussion body */}
          <div className="mb-8 border-b border-border pb-8">
            <MarkdownRenderer content={discussion.body} />
          </div>

          {/* Labels - visible on mobile only */}
          {discussion.labels.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2 lg:hidden">
              {discussion.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Comments section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-content">
                Comments
                <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-sm text-content-secondary">
                  {comments.length}
                </span>
              </h2>

              {/* Sort dropdown - only show when there are 2+ comments */}
              {comments.length > 1 && (
                <Select
                  options={COMMENT_SORT_OPTIONS}
                  value={commentSort}
                  onChange={(e) =>
                    setCommentSort(e.target.value as CommentSortOrder)
                  }
                  className="w-28"
                />
              )}
            </div>

            {/* Comment form */}
            <CommentForm
              currentUser={currentUser}
              onSubmit={onAddComment}
              disabled={commentActionPending}
            />

            {/* Comments list */}
            {commentsLoading ? (
              <CommentsSkeleton />
            ) : sortedComments.length > 0 ? (
              <div className="space-y-6 pt-4">
                {sortedComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onEdit={onEditComment}
                    onDelete={onDeleteComment}
                    onToggleReaction={onToggleReaction}
                    actionsDisabled={commentActionPending}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-content-secondary">
                <svg
                  className="mx-auto mb-3 h-12 w-12 text-content-disabled"
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
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - hidden on mobile */}
        <aside className="hidden w-64 flex-shrink-0 space-y-6 lg:block">
          {/* Category Section */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">
              Category
            </h3>
            <CategoryBadge category={discussion.category} size="md" />
          </div>

          {/* Labels Section */}
          {discussion.labels.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">
                Labels
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {discussion.labels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Participants Section */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">
              {participants.length} Participant
              {participants.length !== 1 && 's'}
            </h3>
            <div className="flex flex-wrap gap-1">
              {visibleParticipants.map((user) => (
                <Avatar key={user.id} user={user} size="sm" showTooltip />
              ))}
              {remainingCount > 0 && (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-tertiary text-xs font-medium text-content-secondary"
                  title={`${remainingCount} more participant${remainingCount !== 1 ? 's' : ''}`}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

export default DiscussionDetail;
