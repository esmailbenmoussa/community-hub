/**
 * useAdminSettings Hook
 * Custom hook for managing admin settings and checking admin status.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { adminService } from '@/services/admin.service';
import {
  adminSettingsAtom,
  adminSettingsLoadedAtom,
  isCurrentUserAdminAtom,
  adminCheckLoadingAtom,
} from '@/store/adminAtom';
import { IdentitySearchResult, Admin } from '@/types';

interface UseAdminSettingsReturn {
  /** List of current admins */
  admins: Admin[];
  /** Whether admin settings are loading */
  isLoading: boolean;
  /** Whether the current user is an admin */
  isCurrentUserAdmin: boolean;
  /** Whether admin check is in progress */
  isCheckingAdmin: boolean;
  /** Error message if any */
  error: string | null;
  /** Add a new admin */
  addAdmin: (user: IdentitySearchResult) => Promise<void>;
  /** Remove an admin */
  removeAdmin: (userId: string) => Promise<void>;
  /** Search for users to add as admin */
  searchUsers: (query: string) => Promise<IdentitySearchResult[]>;
  /** Refresh admin settings from storage */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing admin settings
 */
export function useAdminSettings(): UseAdminSettingsReturn {
  const [adminSettings, setAdminSettings] = useAtom(adminSettingsAtom);
  const [adminSettingsLoaded, setAdminSettingsLoaded] = useAtom(
    adminSettingsLoadedAtom
  );
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useAtom(
    isCurrentUserAdminAtom
  );
  const [isCheckingAdmin, setIsCheckingAdmin] = useAtom(adminCheckLoadingAtom);

  const [isLoading, setIsLoading] = useState(!adminSettingsLoaded);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load admin settings from storage
   */
  const loadAdminSettings = useCallback(async () => {
    setIsLoading(true);
    setIsCheckingAdmin(true);
    setError(null);

    try {
      const settings = await adminService.loadSettings();
      setAdminSettings(settings);
      setAdminSettingsLoaded(true);

      // Check if current user is admin
      const currentUser = await adminService.getCurrentUser();
      if (currentUser) {
        const isAdmin = settings.admins.some(
          (admin) => admin.id === currentUser.id
        );
        setIsCurrentUserAdmin(isAdmin);
      } else {
        setIsCurrentUserAdmin(false);
      }
    } catch (err) {
      console.error('[useAdminSettings] Error loading settings:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load admin settings'
      );
    } finally {
      setIsLoading(false);
      setIsCheckingAdmin(false);
    }
  }, [
    setAdminSettings,
    setAdminSettingsLoaded,
    setIsCurrentUserAdmin,
    setIsCheckingAdmin,
  ]);

  // Load admin settings on mount
  useEffect(() => {
    if (!adminSettingsLoaded) {
      loadAdminSettings();
    }
  }, [adminSettingsLoaded, loadAdminSettings]);

  /**
   * Add a new admin
   */
  const addAdmin = useCallback(
    async (user: IdentitySearchResult) => {
      setError(null);

      try {
        const currentUser = await adminService.getCurrentUser();
        if (!currentUser) {
          throw new Error('Could not get current user');
        }

        // Auto-add self as first admin if list is empty
        const autoAddSelf = adminSettings.admins.length === 0;
        const updatedSettings = await adminService.addAdmin(
          user,
          currentUser.id,
          autoAddSelf
        );

        setAdminSettings(updatedSettings);

        // Re-check if current user is now admin
        const isAdmin = updatedSettings.admins.some(
          (admin) => admin.id === currentUser.id
        );
        setIsCurrentUserAdmin(isAdmin);
      } catch (err) {
        console.error('[useAdminSettings] Error adding admin:', err);
        setError(err instanceof Error ? err.message : 'Failed to add admin');
        throw err;
      }
    },
    [adminSettings.admins.length, setAdminSettings, setIsCurrentUserAdmin]
  );

  /**
   * Remove an admin
   */
  const removeAdmin = useCallback(
    async (userId: string) => {
      setError(null);

      try {
        const updatedSettings = await adminService.removeAdmin(userId);
        setAdminSettings(updatedSettings);

        // Re-check if current user is still admin
        const currentUser = await adminService.getCurrentUser();
        if (currentUser) {
          const isAdmin = updatedSettings.admins.some(
            (admin) => admin.id === currentUser.id
          );
          setIsCurrentUserAdmin(isAdmin);
        }
      } catch (err) {
        console.error('[useAdminSettings] Error removing admin:', err);
        setError(err instanceof Error ? err.message : 'Failed to remove admin');
        throw err;
      }
    },
    [setAdminSettings, setIsCurrentUserAdmin]
  );

  /**
   * Search for users
   */
  const searchUsers = useCallback(
    async (query: string): Promise<IdentitySearchResult[]> => {
      try {
        return await adminService.searchUsers(query);
      } catch (err) {
        console.error('[useAdminSettings] Error searching users:', err);
        return [];
      }
    },
    []
  );

  /**
   * Refresh admin settings
   */
  const refresh = useCallback(async () => {
    adminService.clearCache();
    setAdminSettingsLoaded(false);
    await loadAdminSettings();
  }, [loadAdminSettings, setAdminSettingsLoaded]);

  return {
    admins: adminSettings.admins,
    isLoading,
    isCurrentUserAdmin,
    isCheckingAdmin,
    error,
    addAdmin,
    removeAdmin,
    searchUsers,
    refresh,
  };
}
