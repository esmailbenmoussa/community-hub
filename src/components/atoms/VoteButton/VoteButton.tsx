import { motion } from 'framer-motion';

interface VoteButtonProps {
  /** Current vote count */
  count: number;
  /** Whether the current user has voted */
  hasVoted: boolean;
  /** Callback when vote button is clicked */
  onVote: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * Upvote button component styled like GitHub Discussions
 * Shows vote count with arrow indicator
 */
export function VoteButton({
  count,
  hasVoted,
  onVote,
  disabled = false,
  size = 'md',
}: VoteButtonProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  return (
    <motion.button
      type="button"
      onClick={onVote}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
      className={`
        inline-flex items-center rounded-md border font-medium transition-colors
        ${sizeClasses[size]}
        ${
          hasVoted
            ? 'border-accent bg-accent-light text-accent'
            : 'border-border bg-surface text-content-secondary hover:border-accent hover:text-accent'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      aria-label={hasVoted ? 'Remove vote' : 'Upvote'}
      aria-pressed={hasVoted}
    >
      {/* Triangle/Arrow up icon */}
      <svg
        className={`${iconSize[size]} ${hasVoted ? 'text-accent' : ''}`}
        fill={hasVoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>

      {/* Vote count */}
      <span className={hasVoted ? 'font-semibold' : ''}>{count}</span>
    </motion.button>
  );
}

export default VoteButton;
