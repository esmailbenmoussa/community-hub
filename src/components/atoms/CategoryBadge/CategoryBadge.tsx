import { useAtomValue } from 'jotai';
import { CategoryValue } from '@/types';
import { getCategorySetting } from '@/types/categorySettings';
import { categorySettingsAtom } from '@/store/categorySettingsAtom';
import { ICON_PRESETS, COLOR_PRESETS } from '@/config/categoryPresets';

interface CategoryBadgeProps {
  /** The category to display (can be any string from ADO picklist) */
  category: CategoryValue;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether the badge is clickable */
  onClick?: () => void;
}

/**
 * Category badge component styled like GitHub Discussions.
 * Uses configurable icons and colors from the settings atom.
 * Supports both default categories and custom categories from ADO picklists.
 */
export function CategoryBadge({
  category,
  size = 'md',
  onClick,
}: CategoryBadgeProps) {
  // Get category settings from atom
  const categorySettings = useAtomValue(categorySettingsAtom);

  // Get setting for this category (with fallback for unknown categories)
  const setting = getCategorySetting(category, categorySettings);

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
