/**
 * Category Settings Types
 * Type definitions for user-configurable category icons and colors
 */

import { Category } from './discussion';

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
}

/**
 * Settings for all categories
 */
export type CategorySettings = Record<Category, CategorySetting>;

/**
 * Default category settings
 */
export const DEFAULT_CATEGORY_SETTINGS: CategorySettings = {
  [Category.Announcements]: { icon: 'megaphone', color: 'purple' },
  [Category.General]: { icon: 'chat', color: 'gray' },
  [Category.Ideas]: { icon: 'lightbulb', color: 'blue' },
  [Category.Help]: { icon: 'question', color: 'green' },
};
