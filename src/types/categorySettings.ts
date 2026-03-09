/**
 * Category Settings Types
 * Type definitions for user-configurable category icons and colors.
 * Supports both default categories and custom categories from ADO picklists.
 */

import { Category, CategoryValue } from './discussion';

/**
 * Available icon names for categories
 */
export type IconName =
  | 'megaphone'
  | 'chat'
  | 'lightbulb'
  | 'question'
  | 'star'
  | 'heart'
  | 'flag'
  | 'bell'
  | 'bookmark'
  | 'tag'
  | 'code'
  | 'bug'
  | 'rocket'
  | 'shield'
  | 'users';

/**
 * Available color names for categories
 */
export type ColorName =
  | 'purple'
  | 'gray'
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'pink'
  | 'indigo'
  | 'teal';

/**
 * Configuration for a single category
 */
export interface CategorySetting {
  icon: IconName;
  color: ColorName;
  /** Whether the category is hidden from end-users (admin-only visibility) */
  hidden?: boolean;
}

/**
 * Settings for all categories (dynamic - supports any category string).
 * Uses CategoryValue (string) as key to support custom categories from ADO picklists.
 */
export type CategorySettings = Record<CategoryValue, CategorySetting>;

/**
 * Default fallback setting for categories without explicit configuration.
 * Used when a category is encountered that doesn't have stored settings.
 */
export const FALLBACK_CATEGORY_SETTING: CategorySetting = {
  icon: 'tag',
  color: 'gray',
  hidden: false,
};

/**
 * Default settings for the built-in categories.
 * These provide sensible defaults for the standard categories.
 */
export const BUILTIN_CATEGORY_SETTINGS: Record<Category, CategorySetting> = {
  [Category.Announcements]: {
    icon: 'megaphone',
    color: 'purple',
    hidden: false,
  },
  [Category.General]: { icon: 'chat', color: 'gray', hidden: false },
  [Category.Ideas]: { icon: 'lightbulb', color: 'blue', hidden: false },
  [Category.Help]: { icon: 'question', color: 'green', hidden: false },
};

/**
 * Default category settings - includes built-in categories.
 * Additional categories will use FALLBACK_CATEGORY_SETTING.
 */
export const DEFAULT_CATEGORY_SETTINGS: CategorySettings = {
  ...BUILTIN_CATEGORY_SETTINGS,
};

/**
 * Get the setting for a category, with fallback for unknown categories.
 * @param category The category to get settings for
 * @param settings The current category settings
 * @returns The category setting (from settings, built-in defaults, or fallback)
 */
export function getCategorySetting(
  category: CategoryValue,
  settings: CategorySettings
): CategorySetting {
  // First check if there's an explicit setting
  if (settings[category]) {
    return settings[category];
  }
  // Fall back to built-in defaults
  if (BUILTIN_CATEGORY_SETTINGS[category as Category]) {
    return BUILTIN_CATEGORY_SETTINGS[category as Category];
  }
  // Use generic fallback
  return FALLBACK_CATEGORY_SETTING;
}

/**
 * Merge category settings with defaults, ensuring all categories have settings.
 * @param categories List of all categories (from ADO picklist)
 * @param existingSettings Existing saved settings
 * @returns Complete settings for all categories
 */
export function buildCategorySettings(
  categories: CategoryValue[],
  existingSettings?: Partial<CategorySettings>
): CategorySettings {
  const result: CategorySettings = {};

  for (const category of categories) {
    result[category] =
      existingSettings?.[category] ??
      BUILTIN_CATEGORY_SETTINGS[category as Category] ??
      FALLBACK_CATEGORY_SETTING;
  }

  return result;
}
