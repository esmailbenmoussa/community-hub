/**
 * AdminListManager
 * Component for managing the list of Community Hub admins.
 * Allows adding and removing admins with identity picker.
 */

import { useState, useCallback } from 'react';
import { IdentityPicker } from '@/components/molecules/IdentityPicker';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Admin, IdentitySearchResult } from '@/types';
import { TimeAgo } from '@/components/atoms/TimeAgo';

/**
 * Admin row component
 */
function AdminRow({
  admin,
  onRemove,
  isRemoving,
}: {
  admin: Admin;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-ado border border-border bg-surface p-3 transition-colors hover:bg-surface-hover">
      <div className="flex items-center gap-3">
        {/* Avatar - using initials */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium text-white">
          {admin.displayName.charAt(0).toUpperCase()}
        </div>
        {/* Info */}
        <div>
          <div className="font-medium text-content">{admin.displayName}</div>
          <div className="text-xs text-content-secondary">
            {admin.uniqueName && <span>{admin.uniqueName} &middot; </span>}
            Added <TimeAgo date={admin.addedAt} />
          </div>
        </div>
      </div>
      {/* Remove button */}
      <button
        onClick={() => onRemove(admin.id)}
        disabled={isRemoving}
        className="rounded-ado p-2 text-content-secondary transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        title="Remove admin"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="rounded-ado border border-dashed border-border bg-surface-secondary p-8 text-center">
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
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <p className="text-lg font-medium text-content">No admins configured</p>
      <p className="mt-1 text-sm text-content-secondary">
        Add admins to control who can access extension settings like cache
        clearing and field mapping.
      </p>
      <p className="mt-2 text-xs text-content-disabled">
        Note: When you add the first admin, you will be automatically added as
        well.
      </p>
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-ado border border-border bg-surface p-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-surface-secondary" />
            <div>
              <div className="h-4 w-32 animate-pulse rounded bg-surface-secondary" />
              <div className="mt-1 h-3 w-48 animate-pulse rounded bg-surface-secondary" />
            </div>
          </div>
          <div className="h-8 w-8 animate-pulse rounded bg-surface-secondary" />
        </div>
      ))}
    </div>
  );
}

/**
 * AdminListManager component
 */
export function AdminListManager() {
  const { admins, isLoading, error, addAdmin, removeAdmin, searchUsers } =
    useAdminSettings();

  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /**
   * Handle adding a new admin
   */
  const handleAddAdmin = useCallback(
    async (user: IdentitySearchResult) => {
      setIsAdding(true);
      setActionError(null);

      try {
        await addAdmin(user);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Failed to add admin'
        );
      } finally {
        setIsAdding(false);
      }
    },
    [addAdmin]
  );

  /**
   * Handle removing an admin
   */
  const handleRemoveAdmin = useCallback(
    async (userId: string) => {
      setIsRemoving(userId);
      setActionError(null);

      try {
        await removeAdmin(userId);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Failed to remove admin'
        );
      } finally {
        setIsRemoving(null);
      }
    },
    [removeAdmin]
  );

  // Get list of existing admin IDs to exclude from search
  const excludeIds = admins.map((admin) => admin.id);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-content">
          Community Hub Admins
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Admins can access extension settings like field mapping, category
          customization, and cache management. Users not in this list will only
          see basic display settings.
        </p>
      </div>

      {/* Error banner */}
      {(error || actionError) && (
        <div className="mb-4 rounded-ado border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error || actionError}
        </div>
      )}

      {/* Add admin section */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-content">
          Add Admin
        </label>
        <IdentityPicker
          onSelect={handleAddAdmin}
          searchUsers={searchUsers}
          placeholder="Search for users to add as admin..."
          disabled={isAdding}
          excludeIds={excludeIds}
        />
        {isAdding && (
          <p className="mt-2 text-xs text-content-secondary">Adding admin...</p>
        )}
      </div>

      {/* Admin list */}
      <div>
        <label className="mb-2 block text-sm font-medium text-content">
          Current Admins ({admins.length})
        </label>

        {isLoading ? (
          <LoadingSkeleton />
        ) : admins.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => (
              <AdminRow
                key={admin.id}
                admin={admin}
                onRemove={handleRemoveAdmin}
                isRemoving={isRemoving === admin.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      {admins.length > 0 && (
        <div className="mt-6 rounded-ado border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Admin permissions</p>
              <p className="mt-1">
                Admins can access: Field Mapping, Category Settings, and Cache
                Management. Non-admins will only see Display Settings and About
                information.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminListManager;
