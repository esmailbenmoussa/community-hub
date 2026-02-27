/**
 * CommentCard
 * Displays a single comment with author info, content, and actions
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Comment, User } from '@/types';
import { Avatar } from '@/components/atoms/Avatar';
import { TimeAgo } from '@/components/atoms/TimeAgo';

interface CommentCardProps {
  /** The comment to display */
  comment: Comment;
  /** Current user (to determine if they can edit/delete) */
  currentUser?: User;
  /** Callback when edit is submitted */
  onEdit?: (commentId: number, newText: string) => Promise<void>;
  /** Callback when delete is clicked */
  onDelete?: (commentId: number) => Promise<void>;
  /** Whether actions are disabled */
  actionsDisabled?: boolean;
}

/**
 * CommentCard component - displays a single comment
 */
export function CommentCard({
  comment,
  currentUser,
  onEdit,
  onDelete,
  actionsDisabled = false,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = currentUser?.id === comment.author.id;
  const canEdit = isAuthor && onEdit;
  const canDelete = isAuthor && onDelete;

  const handleEdit = async () => {
    if (!onEdit || !editText.trim() || editText === comment.text) {
      setIsEditing(false);
      setEditText(comment.text);
      return;
    }

    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editText);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this comment?'
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onDelete(comment.id);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(comment.text);
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleEdit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <Avatar user={comment.author} size="sm" showTooltip />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-content">
            {comment.author.displayName}
          </span>
          <TimeAgo date={comment.createdDate} className="text-xs" />
          {comment.modifiedDate &&
            comment.modifiedDate > comment.createdDate && (
              <span className="text-xs text-content-disabled">(edited)</span>
            )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              className="w-full resize-none rounded-ado border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-disabled focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={isSubmitting || !editText.trim()}
                className="rounded-ado bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.text);
                }}
                disabled={isSubmitting}
                className="rounded-ado border border-border px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words text-sm text-content">
            {comment.text}
          </div>
        )}

        {/* Actions */}
        {!isEditing && (canEdit || canDelete) && (
          <div className="mt-2 flex items-center gap-3">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                disabled={actionsDisabled}
                className="text-xs text-content-secondary transition-colors hover:text-content disabled:opacity-50"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={actionsDisabled || isSubmitting}
                className="text-xs text-content-secondary transition-colors hover:text-state-error disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default CommentCard;
