import { useMemo } from 'react';

interface TimeAgoProps {
  /** Date to display relative time for */
  date: Date | string;
  /** Whether to show full date on hover */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Time intervals in seconds
 */
const INTERVALS = [
  { label: 'year', seconds: 31536000 },
  { label: 'month', seconds: 2592000 },
  { label: 'week', seconds: 604800 },
  { label: 'day', seconds: 86400 },
  { label: 'hour', seconds: 3600 },
  { label: 'minute', seconds: 60 },
  { label: 'second', seconds: 1 },
] as const;

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 5) {
    return 'just now';
  }

  for (const interval of INTERVALS) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return count === 1
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }

  return 'just now';
}

/**
 * Format a date for tooltip display
 */
function formatFullDate(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * TimeAgo component for displaying relative timestamps
 * Shows "2 hours ago", "3 days ago", etc.
 */
export function TimeAgo({
  date,
  showTooltip = true,
  className = '',
}: TimeAgoProps) {
  const dateObj = useMemo(
    () => (typeof date === 'string' ? new Date(date) : date),
    [date]
  );

  const relativeTime = useMemo(() => formatTimeAgo(dateObj), [dateObj]);
  const fullDate = useMemo(() => formatFullDate(dateObj), [dateObj]);

  return (
    <time
      dateTime={dateObj.toISOString()}
      title={showTooltip ? fullDate : undefined}
      className={`text-content-secondary ${className}`}
    >
      {relativeTime}
    </time>
  );
}

export default TimeAgo;
