/**
 * DiscussionDetail
 * Full discussion view with comments section
 */

import { motion } from 'framer-motion';
import { Discussion, Comment, User } from '@/types';
import { Avatar } from '@/components/atoms/Avatar';
import { TimeAgo } from '@/components/atoms/TimeAgo';
import { VoteButton } from '@/components/atoms/VoteButton';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { CommentCard } from '@/components/molecules/CommentCard';
import { CommentForm } from '@/components/molecules/CommentForm';

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
        <div className="h-4 w-24 rounded bg-surface-tertiary" />
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
 * DiscussionDetail component - full discussion view
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
  isLoading = false,
  commentsLoading = false,
  commentActionPending = false,
  voteDisabled = false,
}: DiscussionDetailProps) {
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <DiscussionSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl"
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

      {/* Main content */}
      <div className="px-6 py-6">
        {/* Discussion header */}
        <div className="mb-6">
          {/* Category badge */}
          <div className="mb-3">
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
        <div className="prose prose-sm mb-8 max-w-none border-b border-border pb-8">
          <div className="whitespace-pre-wrap text-content">
            {discussion.body}
          </div>
        </div>

        {/* Labels */}
        {discussion.labels.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
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
          <h2 className="flex items-center gap-2 text-lg font-semibold text-content">
            Comments
            <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-sm text-content-secondary">
              {comments.length}
            </span>
          </h2>

          {/* Comment form */}
          <CommentForm
            currentUser={currentUser}
            onSubmit={onAddComment}
            disabled={commentActionPending}
          />

          {/* Comments list */}
          {commentsLoading ? (
            <CommentsSkeleton />
          ) : comments.length > 0 ? (
            <div className="space-y-6 pt-4">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onEdit={onEditComment}
                  onDelete={onDeleteComment}
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
    </motion.div>
  );
}

export default DiscussionDetail;
