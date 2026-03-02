/**
 * DiscussionDetail
 * Full discussion view with comments section and sidebar
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Discussion,
  Comment,
  CommentReactionType,
  User,
  UpdateDiscussionInput,
  VisibilityScope,
} from '@/types';
import { Avatar } from '@/components/atoms/Avatar';
import { TimeAgo } from '@/components/atoms/TimeAgo';
import { VoteButton } from '@/components/atoms/VoteButton';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { ProjectBadge } from '@/components/atoms/ProjectBadge';
import { MarkdownRenderer } from '@/components/atoms/MarkdownRenderer';
import { Select } from '@/components/atoms/Select';
import { CommentCard } from '@/components/molecules/CommentCard';
import { CommentForm } from '@/components/molecules/CommentForm';
import { MarkdownEditor } from '@/components/molecules/MarkdownEditor';

type CommentSortOrder = 'newest' | 'oldest';

const COMMENT_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

const VISIBILITY_OPTIONS = [
  { value: VisibilityScope.Project, label: 'This project only' },
  { value: VisibilityScope.Organization, label: 'Entire organization' },
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
  /** Callback when the discussion is edited */
  onEditDiscussion?: (updates: UpdateDiscussionInput) => Promise<boolean>;
  /** Whether discussion is loading */
  isLoading?: boolean;
  /** Whether comments are loading */
  commentsLoading?: boolean;
  /** Whether a comment action is in progress */
  commentActionPending?: boolean;
  /** Whether voting is disabled */
  voteDisabled?: boolean;
  /** Whether a discussion update is in progress */
  discussionUpdating?: boolean;
  /** Current project name - used to determine if origin badge should be shown */
  currentProjectName?: string;
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
  onEditDiscussion,
  isLoading = false,
  commentsLoading = false,
  commentActionPending = false,
  voteDisabled = false,
  discussionUpdating = false,
  currentProjectName,
}: DiscussionDetailProps) {
  // Comment sort state
  const [commentSort, setCommentSort] = useState<CommentSortOrder>('newest');

  // Edit discussion state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(discussion.title);
  const [editBody, setEditBody] = useState(discussion.body);
  const [editVisibility, setEditVisibility] = useState<VisibilityScope>(
    discussion.visibility
  );
  const [editTags, setEditTags] = useState<string[]>(discussion.tags);
  const [newTag, setNewTag] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Authorization check
  const isAuthor = currentUser?.id === discussion.author.id;
  const canEdit = isAuthor && onEditDiscussion;

  // Check if discussion was edited
  const wasEdited =
    discussion.changedDate &&
    new Date(discussion.changedDate).getTime() >
      new Date(discussion.createdDate).getTime() + 1000; // 1 second tolerance

  // Reset edit state when discussion changes
  const resetEditState = () => {
    setEditTitle(discussion.title);
    setEditBody(discussion.body);
    setEditVisibility(discussion.visibility);
    setEditTags(discussion.tags);
    setNewTag('');
    setEditErrors({});
  };

  // Start editing
  const handleStartEdit = () => {
    resetEditState();
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    resetEditState();
  };

  // Validate edit form
  const validateEdit = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editTitle.trim()) {
      errors.title = 'Title is required';
    } else if (editTitle.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    } else if (editTitle.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    if (!editBody.trim()) {
      errors.body = 'Body is required';
    } else if (editBody.length < 10) {
      errors.body = 'Body must be at least 10 characters';
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit edit
  const handleSubmitEdit = async () => {
    if (!onEditDiscussion || !validateEdit()) return;

    const updates: UpdateDiscussionInput = {};

    // Only include changed fields
    if (editTitle.trim() !== discussion.title) {
      updates.title = editTitle.trim();
    }
    if (editBody.trim() !== discussion.body) {
      updates.body = editBody.trim();
    }
    if (editVisibility !== discussion.visibility) {
      updates.visibility = editVisibility;
    }
    if (JSON.stringify(editTags) !== JSON.stringify(discussion.tags)) {
      updates.tags = editTags;
    }

    // If no changes, just close edit mode
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    const success = await onEditDiscussion(updates);
    if (success) {
      setIsEditing(false);
    }
  };

  // Handle keyboard shortcuts in edit mode
  const handleEditKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmitEdit();
    }
  };

  // Add a tag
  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed]);
      setNewTag('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

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
            <div className="mb-3 flex flex-wrap items-center gap-2 lg:hidden">
              <CategoryBadge category={discussion.category} size="sm" />
              {currentProjectName &&
                discussion.projectName !== currentProjectName && (
                  <ProjectBadge
                    projectName={discussion.projectName}
                    size="sm"
                  />
                )}
            </div>

            {/* Title - editable or static */}
            {isEditing ? (
              <div className="mb-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  disabled={discussionUpdating}
                  placeholder="Discussion title..."
                  className={`w-full rounded-ado border bg-surface px-3 py-2 text-xl font-bold text-content placeholder:text-content-disabled focus:outline-none focus:ring-1 ${
                    editErrors.title
                      ? 'border-state-error focus:border-state-error focus:ring-state-error'
                      : 'border-border focus:border-accent focus:ring-accent'
                  }`}
                  autoFocus
                />
                {editErrors.title && (
                  <p className="mt-1 text-xs text-state-error">
                    {editErrors.title}
                  </p>
                )}
              </div>
            ) : (
              <h1 className="mb-4 text-2xl font-bold text-content">
                {discussion.title}
              </h1>
            )}

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
                  {wasEdited && (
                    <span className="ml-1 text-xs text-content-disabled">
                      (edited)
                    </span>
                  )}
                </div>
              </div>

              {/* Vote button - hide in edit mode */}
              {!isEditing && (
                <VoteButton
                  count={discussion.voteCount}
                  hasVoted={hasVoted}
                  onVote={onVote}
                  disabled={voteDisabled}
                />
              )}

              {/* Edit button - only for author */}
              {canEdit && !isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="text-sm text-content-secondary transition-colors hover:text-content"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Discussion body */}
          <div className="mb-8 border-b border-border pb-8">
            {isEditing ? (
              <div className="space-y-4">
                {/* Body editor */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-content">
                    Body
                  </label>
                  <MarkdownEditor
                    value={editBody}
                    onChange={setEditBody}
                    disabled={discussionUpdating}
                    placeholder="Write your discussion content here..."
                    rows={10}
                    hasError={!!editErrors.body}
                  />
                  {editErrors.body && (
                    <p className="mt-1 text-xs text-state-error">
                      {editErrors.body}
                    </p>
                  )}
                </div>

                {/* Visibility */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-content">
                    Visibility
                  </label>
                  <div className="w-64">
                    <Select
                      options={VISIBILITY_OPTIONS}
                      value={editVisibility}
                      onChange={(e) =>
                        setEditVisibility(e.target.value as VisibilityScope)
                      }
                      disabled={discussionUpdating}
                    />
                  </div>
                  <p className="mt-1 text-xs text-content-disabled">
                    {editVisibility === VisibilityScope.Project
                      ? 'Only members of this project can see this discussion.'
                      : 'All members of the organization can see this discussion.'}
                  </p>
                </div>

                {/* Tags editor */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-content">
                    Tags
                  </label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {editTags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          disabled={discussionUpdating}
                          className="ml-0.5 text-content-disabled hover:text-state-error"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      disabled={discussionUpdating}
                      placeholder="Add a tag..."
                      className="flex-1 rounded-ado border border-border bg-surface px-3 py-1.5 text-sm text-content placeholder:text-content-disabled focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={discussionUpdating || !newTag.trim()}
                      className="rounded-ado border border-border px-3 py-1.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Save/Cancel buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSubmitEdit}
                    disabled={discussionUpdating}
                    className="rounded-ado bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    {discussionUpdating ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={discussionUpdating}
                    className="rounded-ado border border-border px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <span className="text-xs text-content-disabled">
                    Press Esc to cancel, Ctrl+Enter to save
                  </span>
                </div>
              </div>
            ) : (
              <MarkdownRenderer content={discussion.body} />
            )}
          </div>

          {/* Tags - visible on mobile only */}
          {discussion.tags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2 lg:hidden">
              {discussion.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary"
                >
                  {tag}
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

          {/* Project Origin Section - only shown for cross-project discussions */}
          {currentProjectName &&
            discussion.projectName !== currentProjectName && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">
                  Project
                </h3>
                <ProjectBadge projectName={discussion.projectName} size="md" />
              </div>
            )}

          {/* Tags Section */}
          {discussion.tags.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {discussion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary"
                  >
                    {tag}
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
