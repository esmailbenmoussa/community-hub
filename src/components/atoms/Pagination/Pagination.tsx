/**
 * Pagination Component
 * GitHub-style pagination with page numbers and Previous/Next buttons
 */

import { useMemo } from 'react';

interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Whether pagination is disabled (e.g., while loading) */
  disabled?: boolean;
}

/**
 * Generate array of page numbers to display
 * Shows: 1 2 3 ... (current-1) current (current+1) ... (total-2) (total-1) total
 */
function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  if (currentPage <= 3) {
    // Near the start: show 1 2 3 4 ... last
    pages.push(2, 3, 4, 'ellipsis', totalPages);
  } else if (currentPage >= totalPages - 2) {
    // Near the end: show 1 ... (last-3) (last-2) (last-1) last
    pages.push(
      'ellipsis',
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    );
  } else {
    // In the middle: show 1 ... (current-1) current (current+1) ... last
    pages.push(
      'ellipsis',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis',
      totalPages
    );
  }

  return pages;
}

/**
 * Pagination component with GitHub-style page numbers
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const baseButtonClass =
    'px-3 py-1.5 text-sm font-medium rounded-ado transition-colors';
  const enabledButtonClass =
    'text-content-secondary hover:text-content hover:bg-surface-hover';
  const disabledButtonClass = 'text-content-disabled cursor-not-allowed';
  const activeButtonClass = 'bg-accent text-white';
  const pageButtonClass =
    'min-w-[32px] px-2 py-1.5 text-sm font-medium rounded-ado transition-colors';

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {/* Previous button */}
      <button
        onClick={() =>
          canGoPrevious && !disabled && onPageChange(currentPage - 1)
        }
        disabled={!canGoPrevious || disabled}
        className={`${baseButtonClass} ${
          canGoPrevious && !disabled ? enabledButtonClass : disabledButtonClass
        }`}
        aria-label="Go to previous page"
      >
        <span className="flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-1.5 text-sm text-content-disabled"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() =>
                page !== currentPage && !disabled && onPageChange(page)
              }
              disabled={disabled}
              className={`${pageButtonClass} ${
                page === currentPage
                  ? activeButtonClass
                  : disabled
                    ? disabledButtonClass
                    : enabledButtonClass
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => canGoNext && !disabled && onPageChange(currentPage + 1)}
        disabled={!canGoNext || disabled}
        className={`${baseButtonClass} ${
          canGoNext && !disabled ? enabledButtonClass : disabledButtonClass
        }`}
        aria-label="Go to next page"
      >
        <span className="flex items-center gap-1">
          Next
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </button>
    </nav>
  );
}

export default Pagination;
