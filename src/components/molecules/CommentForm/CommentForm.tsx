/**
 * CommentForm
 * Form for submitting new comments
 */

import { useState } from 'react';
import { useAptabase } from '@aptabase/react';
import { User } from '@/types';
import { Avatar } from '@/components/atoms/Avatar';

interface CommentFormProps {
  /** Current user */
  currentUser?: User;
  /** Callback when comment is submitted */
  onSubmit: (text: string) => Promise<void>;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * CommentForm component - form for adding new comments
 */
export function CommentForm({
  currentUser,
  onSubmit,
  disabled = false,
  placeholder = 'Add a comment...',
}: CommentFormProps) {
  const { trackEvent } = useAptabase();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text);
      trackEvent('comment_submitted');
      setText('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Default user for display when no user is provided
  const displayUser: User = currentUser || {
    id: 'anonymous',
    displayName: 'You',
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      {/* Avatar */}
      <Avatar user={displayUser} size="sm" />

      {/* Input area */}
      <div className="flex-1">
        <div
          className={`rounded-ado border transition-colors ${
            isFocused
              ? 'border-accent ring-1 ring-accent'
              : 'border-border hover:border-content-secondary'
          }`}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSubmitting}
            placeholder={placeholder}
            className="w-full resize-none rounded-t-ado bg-surface px-3 py-2 text-sm text-content placeholder:text-content-disabled focus:outline-none disabled:opacity-50"
            rows={isFocused || text ? 3 : 1}
          />

          {/* Actions bar (visible when focused or has text) */}
          {(isFocused || text) && (
            <div className="flex items-center justify-between rounded-b-ado border-t border-border bg-surface-secondary px-3 py-2">
              <span className="text-xs text-content-disabled">
                Press ⌘ + Enter to submit
              </span>
              <button
                type="submit"
                disabled={disabled || isSubmitting || !text.trim()}
                className="rounded-ado bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

export default CommentForm;
