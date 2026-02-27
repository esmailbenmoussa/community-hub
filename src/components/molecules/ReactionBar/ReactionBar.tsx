/**
 * ReactionBar
 * Displays existing reactions with counts and an add reaction button
 */

import { motion } from 'framer-motion';
import { CommentReaction, CommentReactionType } from '@/types';
import {
  ReactionPicker,
  REACTION_EMOJI,
  REACTION_LABELS,
} from '@/components/atoms/ReactionPicker';

interface ReactionBarProps {
  /** List of reactions on the comment */
  reactions?: CommentReaction[];
  /** Callback when a reaction is toggled */
  onToggleReaction: (type: CommentReactionType) => void;
  /** Whether actions are disabled */
  disabled?: boolean;
  /** CSS class for the container */
  className?: string;
}

/**
 * ReactionBar component - displays reactions with counts and add button
 */
export function ReactionBar({
  reactions = [],
  onToggleReaction,
  disabled = false,
  className = '',
}: ReactionBarProps) {
  // Sort reactions by count (highest first)
  const sortedReactions = [...reactions].sort((a, b) => b.count - a.count);

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {/* Existing reactions */}
      {sortedReactions.map((reaction) => (
        <motion.button
          key={reaction.type}
          onClick={() => !disabled && onToggleReaction(reaction.type)}
          disabled={disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            reaction.isCurrentUserEngaged
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'hover:border-border-hover border-border bg-surface-hover text-content-secondary'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          title={`${REACTION_LABELS[reaction.type]} (${reaction.count})`}
          aria-label={`${reaction.isCurrentUserEngaged ? 'Remove' : 'Add'} ${REACTION_LABELS[reaction.type]} reaction. ${reaction.count} people reacted.`}
          aria-pressed={reaction.isCurrentUserEngaged}
        >
          <span className="text-sm">{REACTION_EMOJI[reaction.type]}</span>
          <span className="font-medium">{reaction.count}</span>
        </motion.button>
      ))}

      {/* Add reaction button */}
      <ReactionPicker
        onSelect={onToggleReaction}
        disabled={disabled}
        className="ml-0.5"
      />
    </div>
  );
}

export default ReactionBar;
