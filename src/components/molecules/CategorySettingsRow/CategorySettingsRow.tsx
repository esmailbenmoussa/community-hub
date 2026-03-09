/**
 * CategorySettingsRow Component
 * A row for configuring a single category's icon, color, and visibility
 */

import { CategoryValue } from '@/types';
import { CategorySetting } from '@/types/categorySettings';
import { IconPicker } from '@/components/molecules/IconPicker';
import { ColorPicker } from '@/components/molecules/ColorPicker';
import { ICON_PRESETS, COLOR_PRESETS } from '@/config/categoryPresets';

interface CategorySettingsRowProps {
  /** The category being configured (can be any string from ADO picklist) */
  category: CategoryValue;
  /** Current settings for this category */
  setting: CategorySetting;
  /** Callback when settings change */
  onChange: (setting: CategorySetting) => void;
  /** Whether hiding this category is disabled (e.g., last visible category) */
  disableHide?: boolean;
}

/**
 * Eye icon for visible state
 */
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

/**
 * Eye-off icon for hidden state
 */
function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

/**
 * CategorySettingsRow - Row component for configuring a category
 */
export function CategorySettingsRow({
  category,
  setting,
  onChange,
  disableHide = false,
}: CategorySettingsRowProps) {
  const colorStyles = COLOR_PRESETS[setting.color];
  const isHidden = setting.hidden ?? false;

  const handleToggleVisibility = () => {
    if (disableHide && !isHidden) {
      // Can't hide the last visible category
      return;
    }
    onChange({ ...setting, hidden: !isHidden });
  };

  return (
    <div
      className={`flex items-center gap-4 rounded-ado bg-surface-secondary p-3 transition-opacity ${
        isHidden ? 'opacity-50' : ''
      }`}
    >
      {/* Category name with preview */}
      <div className="flex min-w-[140px] items-center gap-2">
        <span className={colorStyles.text}>
          {ICON_PRESETS[setting.icon]('h-4 w-4')}
        </span>
        <span
          className={`text-sm font-medium ${isHidden ? 'text-content-secondary line-through' : 'text-content'}`}
        >
          {category}
        </span>
      </div>

      {/* Icon picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-content-secondary">Icon:</span>
        <IconPicker
          value={setting.icon}
          onChange={(icon) => onChange({ ...setting, icon })}
        />
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-content-secondary">Color:</span>
        <ColorPicker
          value={setting.color}
          onChange={(color) => onChange({ ...setting, color })}
        />
      </div>

      {/* Visibility toggle */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleVisibility}
          disabled={disableHide && !isHidden}
          className={`rounded-ado p-1.5 transition-colors ${
            isHidden
              ? 'text-content-disabled hover:bg-surface-hover hover:text-content-secondary'
              : 'text-content-secondary hover:bg-surface-hover hover:text-content'
          } ${disableHide && !isHidden ? 'cursor-not-allowed opacity-50' : ''}`}
          title={
            disableHide && !isHidden
              ? 'At least one category must be visible'
              : isHidden
                ? 'Show category to end-users'
                : 'Hide category from end-users'
          }
          aria-label={isHidden ? 'Show category' : 'Hide category'}
        >
          {isHidden ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default CategorySettingsRow;
