/**
 * NavigationPanel
 * Displays category navigation links in a card panel
 */

import { useAtomValue } from 'jotai';
import { Category } from '@/types';
import { categorySettingsAtom } from '@/store/categorySettingsAtom';
import { ICON_PRESETS, COLOR_PRESETS } from '@/config/categoryPresets';

interface NavigationPanelProps {
  /** Currently selected category (undefined = all) */
  selectedCategory?: Category;
  /** Callback when category is clicked */
  onCategoryClick: (category?: Category) => void;
}

/**
 * NavigationPanel component - displays category navigation in a card panel
 * Uses configurable icons and colors from the settings atom
 */
export function NavigationPanel({
  selectedCategory,
  onCategoryClick,
}: NavigationPanelProps) {
  // Get category settings from atom
  const categorySettings = useAtomValue(categorySettingsAtom);

  return (
    <div className="p-4">
      {/* Navigation links */}
      <nav className="space-y-px">
        <button
          onClick={() => onCategoryClick(undefined)}
          className={`flex w-full items-center gap-2 rounded-ado px-3 py-2 text-left text-sm ${
            !selectedCategory
              ? 'bg-accent-light text-accent'
              : 'text-content-secondary hover:bg-surface-hover'
          }`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          All Discussions
        </button>

        <div className="py-2">
          <h4 className="px-3 text-xs font-semibold text-content-disabled">
            Categories
          </h4>
        </div>

        {Object.values(Category).map((category) => {
          const setting = categorySettings[category];
          const colorStyles = COLOR_PRESETS[setting.color];

          return (
            <button
              key={category}
              onClick={() => onCategoryClick(category)}
              className={`flex w-full items-center gap-2 rounded-ado px-3 py-2 text-left text-sm ${
                selectedCategory === category
                  ? 'bg-accent-light text-accent'
                  : 'text-content-secondary hover:bg-surface-hover'
              }`}
            >
              <span className={colorStyles.text}>
                {ICON_PRESETS[setting.icon]('h-4 w-4')}
              </span>
              {category}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default NavigationPanel;
