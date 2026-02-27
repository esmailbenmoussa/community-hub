/**
 * ReactionPicker
 * A dropdown picker for selecting emoji reactions (GitHub-style)
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentReactionType } from '@/types';

/**
 * Emoji mapping for reaction types
 */
export const REACTION_EMOJI: Record<CommentReactionType, string> = {
  [CommentReactionType.Like]: '👍',
  [CommentReactionType.Heart]: '❤️',
  [CommentReactionType.Hooray]: '🎉',
  [CommentReactionType.Smile]: '😄',
  [CommentReactionType.Confused]: '😕',
};

/**
 * Labels for reaction types (for accessibility/tooltips)
 */
export const REACTION_LABELS: Record<CommentReactionType, string> = {
  [CommentReactionType.Like]: 'Like',
  [CommentReactionType.Heart]: 'Heart',
  [CommentReactionType.Hooray]: 'Hooray',
  [CommentReactionType.Smile]: 'Smile',
  [CommentReactionType.Confused]: 'Confused',
};

interface ReactionPickerProps {
  /** Callback when a reaction is selected */
  onSelect: (type: CommentReactionType) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Custom trigger element (defaults to emoji button) */
  trigger?: React.ReactNode;
  /** CSS class for the container */
  className?: string;
}

/**
 * ReactionPicker component - dropdown for selecting emoji reactions
 */
export function ReactionPicker({
  onSelect,
  disabled = false,
  trigger,
  className = '',
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (type: CommentReactionType) => {
    onSelect(type);
    setIsOpen(false);
  };

  const reactionTypes = Object.values(CommentReactionType);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex h-6 w-6 items-center justify-center rounded text-content-secondary transition-colors hover:bg-surface-hover hover:text-content disabled:cursor-not-allowed disabled:opacity-50"
        title="Add reaction"
        aria-label="Add reaction"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger || (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>

      {/* Dropdown picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 z-50 mt-1 flex gap-1 rounded-ado border border-border bg-surface p-1 shadow-lg"
            role="menu"
            aria-orientation="horizontal"
          >
            {reactionTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                className="flex h-8 w-8 items-center justify-center rounded transition-all hover:scale-110 hover:bg-surface-hover"
                role="menuitem"
                title={REACTION_LABELS[type]}
                aria-label={`React with ${REACTION_LABELS[type]}`}
              >
                <span className="text-lg">{REACTION_EMOJI[type]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReactionPicker;
