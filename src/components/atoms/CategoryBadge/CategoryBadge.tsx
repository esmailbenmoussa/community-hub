import { useAtomValue } from 'jotai';
import { Category } from '@/types';
import { categorySettingsAtom } from '@/store/categorySettingsAtom';
import { ICON_PRESETS, COLOR_PRESETS } from '@/config/categoryPresets';

interface CategoryBadgeProps {
  /** The category to display */
  category: Category;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether the badge is clickable */
  onClick?: () => void;
}

/**
 * Category colors matching GitHub Discussions style
 */
export const CATEGORY_STYLES: Record<
  Category,
  { bg: string; text: string; border: string }
> = {
  [Category.Announcements]: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  [Category.General]: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
  [Category.Ideas]: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  [Category.Help]: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
};

/**
 * Category icons
 */
export const CATEGORY_ICONS: Record<Category, JSX.Element> = {
  [Category.Announcements]: (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
        clipRule="evenodd"
      />
    </svg>
  ),
  [Category.General]: (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  [Category.Ideas]: (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
    </svg>
  ),
  [Category.Help]: (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Category badge component styled like GitHub Discussions
 * Uses configurable icons and colors from the settings atom
 */
export function CategoryBadge({
  category,
  size = 'md',
  onClick,
}: CategoryBadgeProps) {
  // Get category settings from atom
  const categorySettings = useAtomValue(categorySettingsAtom);
  const setting = categorySettings[category];

  // Get styles from presets based on settings
  const colorStyles = COLOR_PRESETS[setting.color];
  const iconElement = ICON_PRESETS[setting.icon](
    size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'
  );

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        inline-flex items-center rounded-full border font-medium
        ${sizeClasses[size]}
        ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border}
        ${onClick ? 'cursor-pointer transition-opacity hover:opacity-80' : ''}
      `}
    >
      {iconElement}
      <span>{category}</span>
    </Component>
  );
}

export default CategoryBadge;
