/**
 * Category Settings Service
 * Manages loading and saving of project-wide category icon and color settings
 */

import * as SDK from 'azure-devops-extension-sdk';
import {
  CategorySettings,
  DEFAULT_CATEGORY_SETTINGS,
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
const LOCAL_STORAGE_KEY = 'community-hub-category-settings';

/**
 * Category Settings Service
 * Handles persistence of category icon and color configurations
 */
class CategorySettingsService {
  private cachedSettings: CategorySettings | null = null;

  /**
   * Load category settings from storage
   * Returns default settings if none are saved
   */
  async loadSettings(): Promise<CategorySettings> {
    // Return cached settings if available
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    if (isDevMode()) {
      console.log(
        '[CategorySettingsService] Dev mode - loading from localStorage'
      );
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const settings = { ...DEFAULT_CATEGORY_SETTINGS, ...parsed };
          this.cachedSettings = settings;
          return settings;
        } catch {
          console.warn(
            '[CategorySettingsService] Failed to parse stored settings'
          );
          return DEFAULT_CATEGORY_SETTINGS;
        }
      }
      return DEFAULT_CATEGORY_SETTINGS;
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

      const result = await dataManager.getValue<CategorySettings>(
        EDS_COLLECTIONS.CategorySettings,
        { scopeType: 'Default' } // Project-scoped
      );

      const settings = result
        ? { ...DEFAULT_CATEGORY_SETTINGS, ...result }
        : DEFAULT_CATEGORY_SETTINGS;

      this.cachedSettings = settings;
      return settings;
    } catch (error) {
      console.error('[CategorySettingsService] Error loading settings:', error);
      return DEFAULT_CATEGORY_SETTINGS;
    }
  }

  /**
   * Save category settings to storage (project-scoped)
   */
  async saveSettings(settings: CategorySettings): Promise<void> {
    if (isDevMode()) {
      console.log(
        '[CategorySettingsService] Dev mode - saving to localStorage'
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      this.cachedSettings = settings;
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

      await dataManager.setValue(EDS_COLLECTIONS.CategorySettings, settings, {
        scopeType: 'Default', // Project-scoped
      });

      this.cachedSettings = settings;
    } catch (error) {
      console.error('[CategorySettingsService] Error saving settings:', error);
      throw error;
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
export const categorySettingsService = new CategorySettingsService();
