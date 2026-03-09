/**
 * Admin Service
 * Manages the admin list for Community Hub.
 * Admin settings are stored organization-scoped in Extension Data Service.
 */

import * as SDK from 'azure-devops-extension-sdk';
import {
  Admin,
  AdminSettings,
  DEFAULT_ADMIN_SETTINGS,
  IdentitySearchResult,
  EDS_COLLECTIONS,
} from '@/types';
import { isDevMode } from '@/utils/environment';

/**
 * Extension Data Service interface (from ADO SDK)
 */
interface IExtensionDataService {
  getExtensionDataManager(
    extensionId: string,
    accessToken: string
  ): Promise<IExtensionDataManager>;
}

interface IExtensionDataManager {
  getValue<T>(
    key: string,
    options?: { scopeType: string }
  ): Promise<T | undefined>;
  setValue<T>(
    key: string,
    value: T,
    options?: { scopeType: string }
  ): Promise<T>;
}

/**
 * Local storage key for dev mode
 */
const LOCAL_STORAGE_KEY = 'community-hub-admin-settings';

/**
 * Mock users for dev mode identity search
 */
const MOCK_USERS: IdentitySearchResult[] = [
  {
    id: 'user-1',
    displayName: 'John Doe',
    uniqueName: 'john.doe@example.com',
    imageUrl:
      'https://ui-avatars.com/api/?name=John+Doe&background=0078d4&color=fff',
  },
  {
    id: 'user-2',
    displayName: 'Jane Smith',
    uniqueName: 'jane.smith@example.com',
    imageUrl:
      'https://ui-avatars.com/api/?name=Jane+Smith&background=00bcf2&color=fff',
  },
  {
    id: 'user-3',
    displayName: 'Bob Wilson',
    uniqueName: 'bob.wilson@example.com',
    imageUrl:
      'https://ui-avatars.com/api/?name=Bob+Wilson&background=5c2d91&color=fff',
  },
  {
    id: 'user-4',
    displayName: 'Alice Johnson',
    uniqueName: 'alice.johnson@example.com',
    imageUrl:
      'https://ui-avatars.com/api/?name=Alice+Johnson&background=008272&color=fff',
  },
  {
    id: 'user-5',
    displayName: 'Charlie Brown',
    uniqueName: 'charlie.brown@example.com',
    imageUrl:
      'https://ui-avatars.com/api/?name=Charlie+Brown&background=e81123&color=fff',
  },
];

/**
 * Admin Service Class
 * Handles persistence and management of admin list
 */
class AdminService {
  private cachedSettings: AdminSettings | null = null;

  /**
   * Load admin settings from storage
   * Returns default empty settings if none are saved
   */
  async loadSettings(): Promise<AdminSettings> {
    // Return cached settings if available
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    if (isDevMode()) {
      console.log('[AdminService] Dev mode - loading from localStorage');
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const settings = { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
          this.cachedSettings = settings;
          return settings;
        } catch {
          console.warn('[AdminService] Failed to parse stored settings');
          return DEFAULT_ADMIN_SETTINGS;
        }
      }
      return DEFAULT_ADMIN_SETTINGS;
    }

    try {
      const dataService = await SDK.getService<IExtensionDataService>(
        'ms.vss-features.extension-data-service'
      );
      const accessToken = await SDK.getAccessToken();
      const dataManager = await dataService.getExtensionDataManager(
        SDK.getExtensionContext().id,
        accessToken
      );

      // Organization-scoped storage (shared across all projects)
      const result = await dataManager.getValue<AdminSettings>(
        EDS_COLLECTIONS.AdminSettings,
        { scopeType: 'Default' }
      );

      const settings = result
        ? { ...DEFAULT_ADMIN_SETTINGS, ...result }
        : DEFAULT_ADMIN_SETTINGS;

      this.cachedSettings = settings;
      return settings;
    } catch (error) {
      console.error('[AdminService] Error loading settings:', error);
      return DEFAULT_ADMIN_SETTINGS;
    }
  }

  /**
   * Save admin settings to storage (organization-scoped)
   */
  async saveSettings(settings: AdminSettings): Promise<void> {
    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    if (isDevMode()) {
      console.log('[AdminService] Dev mode - saving to localStorage');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSettings));
      this.cachedSettings = updatedSettings;
      return;
    }

    try {
      const dataService = await SDK.getService<IExtensionDataService>(
        'ms.vss-features.extension-data-service'
      );
      const accessToken = await SDK.getAccessToken();
      const dataManager = await dataService.getExtensionDataManager(
        SDK.getExtensionContext().id,
        accessToken
      );

      await dataManager.setValue(
        EDS_COLLECTIONS.AdminSettings,
        updatedSettings,
        {
          scopeType: 'Default', // Organization-scoped
        }
      );

      this.cachedSettings = updatedSettings;
    } catch (error) {
      console.error('[AdminService] Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Check if a user is an admin
   * @param userId The Azure DevOps user ID to check
   */
  async isAdmin(userId: string): Promise<boolean> {
    const settings = await this.loadSettings();
    return settings.admins.some((admin) => admin.id === userId);
  }

  /**
   * Add a user as an admin
   * @param user The user to add
   * @param addedById The ID of the user adding this admin
   * @param autoAddSelf If true and this is the first admin, also add the current user
   */
  async addAdmin(
    user: IdentitySearchResult,
    addedById: string,
    autoAddSelf: boolean = false
  ): Promise<AdminSettings> {
    const settings = await this.loadSettings();

    // Check if user is already an admin
    if (settings.admins.some((admin) => admin.id === user.id)) {
      return settings;
    }

    const newAdmin: Admin = {
      id: user.id,
      displayName: user.displayName,
      uniqueName: user.uniqueName,
      imageUrl: user.imageUrl,
      addedAt: new Date().toISOString(),
      addedBy: addedById,
    };

    const updatedAdmins = [...settings.admins];

    // If this is the first admin and autoAddSelf is true,
    // and the user being added is not the current user, add current user first
    if (autoAddSelf && settings.admins.length === 0 && user.id !== addedById) {
      // Get current user info
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        const selfAdmin: Admin = {
          id: currentUser.id,
          displayName: currentUser.displayName,
          uniqueName: currentUser.uniqueName,
          imageUrl: currentUser.imageUrl,
          addedAt: new Date().toISOString(),
          addedBy: addedById,
        };
        updatedAdmins.push(selfAdmin);
      }
    }

    updatedAdmins.push(newAdmin);

    const updatedSettings: AdminSettings = {
      ...settings,
      admins: updatedAdmins,
    };

    await this.saveSettings(updatedSettings);
    return updatedSettings;
  }

  /**
   * Remove a user from admins
   * @param userId The user ID to remove
   */
  async removeAdmin(userId: string): Promise<AdminSettings> {
    const settings = await this.loadSettings();

    const updatedSettings: AdminSettings = {
      ...settings,
      admins: settings.admins.filter((admin) => admin.id !== userId),
    };

    await this.saveSettings(updatedSettings);
    return updatedSettings;
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<IdentitySearchResult | null> {
    if (isDevMode()) {
      // Return mock current user
      return {
        id: 'dev-user-id',
        displayName: 'Dev User',
        uniqueName: 'dev.user@example.com',
        imageUrl:
          'https://ui-avatars.com/api/?name=Dev+User&background=0078d4&color=fff',
      };
    }

    try {
      const user = SDK.getUser();
      return {
        id: user.id,
        displayName: user.displayName || user.name || 'Unknown User',
        uniqueName: user.name,
        imageUrl: user.imageUrl,
      };
    } catch (error) {
      console.error('[AdminService] Error getting current user:', error);
      return null;
    }
  }

  /**
   * Search for users/identities in Azure DevOps
   * @param query Search query string
   */
  async searchUsers(query: string): Promise<IdentitySearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    if (isDevMode()) {
      console.log('[AdminService] Dev mode - searching mock users');
      const lowerQuery = query.toLowerCase();
      return MOCK_USERS.filter(
        (user) =>
          user.displayName.toLowerCase().includes(lowerQuery) ||
          user.uniqueName?.toLowerCase().includes(lowerQuery)
      );
    }

    try {
      // Use the Identity Picker API to search for users (server-side filtering)
      const accessToken = await SDK.getAccessToken();
      const host = SDK.getHost();
      const orgUrl = `https://dev.azure.com/${host.name}`;

      const response = await fetch(
        `${orgUrl}/_apis/identitypicker/identities?api-version=7.1-preview.1`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            identityTypes: ['user'],
            operationScopes: ['ims', 'source'],
            options: {
              MinResults: 5,
              MaxResults: 10,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error(
          '[AdminService] Error searching users:',
          response.statusText
        );
        return [];
      }

      const data = await response.json();
      const users: IdentitySearchResult[] = [];

      // Identity Picker returns results in a different format
      // Results are in data.results[0].identities array
      const identities = data.results?.[0]?.identities || [];

      for (const identity of identities) {
        // Skip non-user identities (groups, etc.)
        if (identity.entityType !== 'User') {
          continue;
        }

        users.push({
          id: identity.localId || identity.originId || identity.entityId,
          displayName: identity.displayName || '',
          uniqueName: identity.signInAddress || identity.mail || '',
          imageUrl: identity.image,
        });
      }

      return users;
    } catch (error) {
      console.error('[AdminService] Error searching users:', error);
      return [];
    }
  }

  /**
   * Clear cached settings (useful for testing or forcing reload)
   */
  clearCache(): void {
    this.cachedSettings = null;
  }
}

// Export singleton instance
export const adminService = new AdminService();
