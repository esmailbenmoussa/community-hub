import { Discussion } from '@/types';
import { VoteButton } from '@/components/atoms/VoteButton';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { Avatar } from '@/components/atoms/Avatar';
import { TimeAgo } from '@/components/atoms/TimeAgo';

interface DiscussionRowProps {
  /** Discussion data */
  discussion: Discussion;
  /** Whether the current user has voted on this discussion */
  hasVoted: boolean;
  /** Callback when vote button is clicked */
  onVote: (discussionId: number) => void;
  /** Callback when the row is clicked */
  onClick: (discussionId: number) => void;
  /** Whether voting is disabled */
  voteDisabled?: boolean;
}

/**
 * DiscussionRow component - displays a single discussion in a list
 * Styled like GitHub Discussions with vote button, title, metadata
 */
export function DiscussionRow({
  discussion,
  hasVoted,
  onVote,
  onClick,
  voteDisabled = false,
}: DiscussionRowProps) {
  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote(discussion.id);
  };

  const handleRowClick = () => {
    onClick(discussion.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(discussion.id);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      {/* Vote button */}
      <div className="flex-shrink-0" onClick={handleVoteClick}>
        <VoteButton
          count={discussion.voteCount}
          hasVoted={hasVoted}
          onVote={() => onVote(discussion.id)}
          disabled={voteDisabled}
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        {/* Left side: Category, Title, Meta */}
        <div className="min-w-0">
          {/* Header row: Category + Pin indicator */}
          <div className="mb-1 flex items-center gap-2">
            <CategoryBadge category={discussion.category} size="sm" />
            {discussion.isPinned && (
              <span className="inline-flex items-center gap-1 text-xs text-content-secondary">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05l-3.667 3.667V19a1 1 0 11-2 0v-1.332l-3.667-3.666a1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
                </svg>
                Pinned
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-1 line-clamp-2 text-base font-semibold text-content">
            {discussion.title}
          </h3>

          {/* Meta row: Author, date */}
          <div className="flex items-center gap-3 text-sm text-content-secondary">
            <div className="flex items-center gap-1.5">
              <Avatar user={discussion.author} size="xs" />
              <span className="max-w-[150px] truncate">
                {discussion.author.displayName}
              </span>
            </div>

            <span className="text-content-disabled">·</span>

            <TimeAgo date={discussion.createdDate} className="text-sm" />
          </div>
        </div>

        {/* Right side: Avatar stack + Comment count */}
        <div className="flex flex-shrink-0 items-center gap-4">
          {/* Avatar stack: Author + first 2 commenters */}
          <div className="flex -space-x-1.5">
            {/* Author avatar */}
            <div className="rounded-full ring-2 ring-surface">
              <Avatar user={discussion.author} size="xs" />
            </div>
            {/* Recent commenters (max 2) */}
            {discussion.recentCommenters?.slice(0, 2).map((commenter) => (
              <div
                key={commenter.id}
                className="rounded-full ring-2 ring-surface"
              >
                <Avatar user={commenter} size="xs" />
              </div>
            ))}
          </div>

          {/* Comment count */}
          <div className="text-sm text-content-secondary">
            <span className="inline-flex items-center gap-1">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {discussion.commentCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default DiscussionRow;
