/**
 * useCategories Hook
 * Provides access to dynamic categories from ADO picklist.
 * Falls back to default categories if picklist values are not available.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  CategoryValue,
  DEFAULT_CATEGORIES,
  CategorySettings,
  CategorySetting,
  getCategorySetting,
} from '@/types';
import {
  categorySettingsAtom,
  availableCategoriesAtom,
  categoriesLoadedAtom,
} from '@/store/categorySettingsAtom';
import { fieldMappingService } from '@/services/fieldMapping.service';
import { categorySettingsService } from '@/services/categorySettings.service';
import { validationService } from '@/services/validation.service';

/**
 * Return type for the useCategories hook
 */
export interface UseCategoriesResult {
  /** List of all available categories (from ADO picklist or defaults) - for admin use */
  categories: CategoryValue[];
  /** List of visible categories (excluding hidden ones) - for end-user UI */
  visibleCategories: CategoryValue[];
  /** Whether categories are currently loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error?: string;
  /** The default category to use (first visible category or 'General') */
  defaultCategory: CategoryValue;
  /** Whether categories have been loaded from field mapping */
  isFromPicklist: boolean;
  /** Get the setting for a specific category */
  getCategorySetting: (category: CategoryValue) => CategorySetting;
  /** Category settings map */
  categorySettings: CategorySettings;
  /** Refresh categories from field mapping */
  refresh: () => Promise<void>;
}

/**
 * Hook for accessing dynamic categories from ADO picklist.
 *
 * This hook:
 * 1. Attempts to load categories from the stored field mapping metadata
 * 2. If metadata is missing (legacy installation), attempts migration
 * 3. Falls back to default categories if no picklist values are available
 * 4. Provides category settings with fallback styling for unknown categories
 *
 * @returns Object with categories, loading state, and utility functions
 */
export function useCategories(): UseCategoriesResult {
  const [availableCategories, setAvailableCategories] = useAtom(
    availableCategoriesAtom
  );
  const [categoriesLoaded, setCategoriesLoaded] = useAtom(categoriesLoadedAtom);
  const categorySettings = useAtomValue(categorySettingsAtom);
  const setCategorySettings = useSetAtom(categorySettingsAtom);

  const [isLoading, setIsLoading] = useState(!categoriesLoaded);
  const [error, setError] = useState<string | undefined>();
  const [isFromPicklist, setIsFromPicklist] = useState(false);

  const loadCategories = useCallback(async () => {
    if (categoriesLoaded && availableCategories.length > 0) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      // Ensure field mapping is loaded first (populates the cache with field metadata)
      const storedMapping = await fieldMappingService.loadMapping();

      // Check if we need to migrate (mapping exists but no metadata)
      if (storedMapping && !fieldMappingService.hasFieldMetadata()) {
        console.log(
          '[useCategories] Field mapping exists but metadata is missing. Attempting migration...'
        );

        // Load setup status to get processId and witReferenceName for migration
        const setupStatus = await validationService.loadSetupStatus();
        if (setupStatus?.processId && setupStatus?.witReferenceName) {
          await fieldMappingService.migrateFieldMetadata(
            setupStatus.processId,
            setupStatus.witReferenceName
          );
        }
      }

      // Now try to get categories from field mapping service
      const picklistCategories = fieldMappingService.getCategoryOptions();

      if (picklistCategories && picklistCategories.length > 0) {
        // Use categories from ADO picklist
        setAvailableCategories(picklistCategories);
        setIsFromPicklist(true);

        // Load settings for these categories (with fallbacks)
        const settings =
          await categorySettingsService.getSettingsForCategories(
            picklistCategories
          );
        setCategorySettings(settings);

        console.log(
          '[useCategories] Loaded categories from picklist:',
          picklistCategories
        );
      } else {
        // Fall back to default categories
        setAvailableCategories([...DEFAULT_CATEGORIES]);
        setIsFromPicklist(false);

        console.log('[useCategories] Using default categories');
      }

      setCategoriesLoaded(true);
    } catch (err) {
      console.error('[useCategories] Error loading categories:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load categories'
      );
      // Fall back to defaults on error
      setAvailableCategories([...DEFAULT_CATEGORIES]);
      setIsFromPicklist(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    categoriesLoaded,
    availableCategories.length,
    setAvailableCategories,
    setCategoriesLoaded,
    setCategorySettings,
  ]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const refresh = useCallback(async () => {
    setCategoriesLoaded(false);
    setAvailableCategories([]);
    await loadCategories();
  }, [loadCategories, setCategoriesLoaded, setAvailableCategories]);

  // Get all categories (for admin use)
  const allCategories =
    availableCategories.length > 0
      ? availableCategories
      : [...DEFAULT_CATEGORIES];

  // Filter to only visible categories (for end-user UI)
  const visibleCategories = allCategories.filter((category) => {
    const setting = getCategorySetting(category, categorySettings);
    return !setting.hidden;
  });

  // Determine the default category (from visible categories only)
  const defaultCategory =
    visibleCategories.length > 0 ? visibleCategories[0] : 'General';

  // Getter for category setting with fallback
  const getCategorySettingFn = useCallback(
    (category: CategoryValue): CategorySetting => {
      return getCategorySetting(category, categorySettings);
    },
    [categorySettings]
  );

  return {
    categories: allCategories,
    visibleCategories,
    isLoading,
    error,
    defaultCategory,
    isFromPicklist,
    getCategorySetting: getCategorySettingFn,
    categorySettings,
    refresh,
  };
}

export default useCategories;
