/**
 * OrgSettingsPage
 * Organization admin settings page for managing pinned discussions
 * Accessed via ?view=org query parameter
 */

import { useCallback, useEffect } from 'react';
import { useAptabase } from '@aptabase/react';
import { useOrgDiscussions } from '@/hooks/useOrgDiscussions';
import { useToast } from '@/hooks/useToast';
import { useAzureDevOps } from '@/hooks/useAzureDevOps';
import { Select, SelectOption } from '@/components/atoms/Select';
import { Pagination } from '@/components/atoms/Pagination';
import { CategoryBadge } from '@/components/atoms/CategoryBadge';
import { TimeAgo } from '@/components/atoms/TimeAgo';
import { Discussion } from '@/types';

/**
 * Pin toggle button component
 */
function PinToggle({
  isPinned,
  onClick,
  disabled,
}: {
  isPinned: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 rounded-ado px-3 py-1.5 text-sm font-medium transition-colors
        ${
          isPinned
            ? 'bg-accent text-white hover:bg-accent-hover'
            : 'border border-border bg-surface text-content-secondary hover:bg-surface-hover hover:text-content'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
      title={isPinned ? 'Unpin this discussion' : 'Pin this discussion'}
    >
      <svg
        className="h-4 w-4"
        fill={isPinned ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={isPinned ? 0 : 1.5}
          d={
            isPinned
              ? 'M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05l-3.667 3.667V19a1 1 0 11-2 0v-1.332l-3.667-3.666a1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z'
              : 'M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05l-3.667 3.667V19a1 1 0 11-2 0v-1.332l-3.667-3.666a1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z'
          }
        />
      </svg>
      {isPinned ? 'Pinned' : 'Pin'}
    </button>
  );
}

/**
 * Discussion row for the admin table
 */
function DiscussionTableRow({
  discussion,
  onTogglePin,
  isPinning,
}: {
  discussion: Discussion;
  onTogglePin: (id: number) => void;
  isPinning: boolean;
}) {
  return (
    <tr className="border-b border-border transition-colors hover:bg-surface-hover">
      {/* Pin toggle */}
      <td className="px-4 py-3">
        <PinToggle
          isPinned={discussion.isPinned}
          onClick={() => onTogglePin(discussion.id)}
          disabled={isPinning}
        />
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        <div className="max-w-md">
          <div className="line-clamp-1 font-medium text-content">
            {discussion.title}
          </div>
          <div className="mt-0.5 text-sm text-content-secondary">
            by {discussion.author.displayName}
          </div>
        </div>
      </td>

      {/* Project */}
      <td className="px-4 py-3 text-sm text-content-secondary">
        {discussion.projectName}
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <CategoryBadge category={discussion.category} size="sm" />
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-sm text-content-secondary">
        <TimeAgo date={discussion.createdDate} />
      </td>

      {/* Stats */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-content-secondary">
          <span className="flex items-center gap-1">
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
                d="M5 15l7-7 7 7"
              />
            </svg>
            {discussion.voteCount}
          </span>
          <span className="flex items-center gap-1">
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
      </td>
    </tr>
  );
}

/**
 * Loading skeleton for the table
 */
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="border-b border-border">
          <td className="px-4 py-3">
            <div className="h-8 w-20 animate-pulse rounded bg-surface-secondary" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-64 animate-pulse rounded bg-surface-secondary" />
            <div className="mt-1 h-4 w-32 animate-pulse rounded bg-surface-secondary" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-secondary" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-20 animate-pulse rounded bg-surface-secondary" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 animate-pulse rounded bg-surface-secondary" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 animate-pulse rounded bg-surface-secondary" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Empty state component
 */
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <tr>
      <td colSpan={6} className="px-4 py-12 text-center">
        <div className="text-content-secondary">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-content-disabled"
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
          <p className="text-lg font-medium">No discussions found</p>
          <p className="mt-1 text-sm">
            {hasFilter
              ? 'Try selecting a different project or removing the filter.'
              : 'Discussions will appear here once they are created.'}
          </p>
        </div>
      </td>
    </tr>
  );
}

/**
 * OrgSettingsPage Component
 */
export function OrgSettingsPage() {
  const { isReady, hostName } = useAzureDevOps();
  const { trackEvent } = useAptabase();
  const { showSuccess, showError } = useToast();

  const {
    discussions,
    projects,
    selectedProjectId,
    isLoading,
    isLoadingProjects,
    error,
    page,
    totalPages,
    totalCount,
    goToPage,
    setProjectFilter,
    togglePin,
  } = useOrgDiscussions({ autoFetch: true });

  // Track page view
  useEffect(() => {
    if (isReady) {
      trackEvent('page_viewed', { page: 'org_settings' });
    }
  }, [isReady, trackEvent]);

  // Build project options for dropdown
  const projectOptions: SelectOption[] = [
    { value: '', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  // Handle project filter change
  const handleProjectChange = useCallback(
    (e: { target: { value: string } }) => {
      const value = e.target.value;
      setProjectFilter(value || undefined);
    },
    [setProjectFilter]
  );

  // Handle pin toggle with toast notification
  const handleTogglePin = useCallback(
    async (discussionId: number) => {
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) return;

      const newPinned = !discussion.isPinned;

      try {
        await togglePin(discussionId);
        showSuccess(
          newPinned
            ? 'Discussion pinned successfully'
            : 'Discussion unpinned successfully'
        );
      } catch {
        showError('Failed to update pin status. Please try again.');
      }
    },
    [discussions, togglePin, showSuccess, showError]
  );

  // Loading state
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg
              className="h-8 w-8 animate-spin text-accent"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-content-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-bold text-content">
            Community Hub Settings
          </h1>
          <p className="text-sm text-content-secondary">{hostName}</p>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Section: Pinned Discussions */}
        <section>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-content">
              Manage Pinned Discussions
            </h2>
            <p className="mt-1 text-sm text-content-secondary">
              Pin important discussions to keep them at the top of the
              discussion list. Pinned discussions will be visible to all users
              in the organization.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                options={projectOptions}
                value={selectedProjectId || ''}
                onChange={handleProjectChange}
                placeholder="All Projects"
                className="w-48"
                disabled={isLoadingProjects}
              />
              {totalCount > 0 && (
                <span className="text-sm text-content-secondary">
                  {totalCount} discussion{totalCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-ado border border-red-300 bg-red-50 p-4 text-red-700">
              <p className="font-medium">Error loading discussions</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Discussion table */}
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full">
              <thead className="bg-surface-secondary">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-secondary">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-secondary">
                    Discussion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-secondary">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-secondary">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-secondary">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-secondary">
                    Stats
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableSkeleton />
                ) : discussions.length === 0 ? (
                  <EmptyState hasFilter={!!selectedProjectId} />
                ) : (
                  discussions.map((discussion) => (
                    <DiscussionTableRow
                      key={discussion.id}
                      discussion={discussion}
                      onTogglePin={handleTogglePin}
                      isPinning={isLoading}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={goToPage}
                disabled={isLoading}
              />
            </div>
          )}
        </section>

        {/* Placeholder for future settings sections */}
        {/* 
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-content">
            Category Settings
          </h2>
          <p className="mt-1 text-sm text-content-secondary">
            Configure which categories are available in your organization.
          </p>
          <div className="mt-4 rounded-lg border border-border bg-surface-secondary p-6 text-center text-content-secondary">
            Coming soon
          </div>
        </section>
        */}
      </main>
    </div>
  );
}

export default OrgSettingsPage;
