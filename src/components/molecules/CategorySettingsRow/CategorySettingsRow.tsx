/**
 * CategorySettingsRow Component
 * A row for configuring a single category's icon and color
 */

import { Category } from '@/types';
import { CategorySetting } from '@/types/categorySettings';
import { IconPicker } from '@/components/molecules/IconPicker';
import { ColorPicker } from '@/components/molecules/ColorPicker';
import { ICON_PRESETS, COLOR_PRESETS } from '@/config/categoryPresets';

interface CategorySettingsRowProps {
  /** The category being configured */
  category: Category;
  /** Current settings for this category */
  setting: CategorySetting;
  /** Callback when settings change */
  onChange: (setting: CategorySetting) => void;
}

/**
 * CategorySettingsRow - Row component for configuring a category
 */
export function CategorySettingsRow({
  category,
  setting,
  onChange,
}: CategorySettingsRowProps) {
  const colorStyles = COLOR_PRESETS[setting.color];

  return (
    <div className="flex items-center gap-4 rounded-ado bg-surface-secondary p-3">
      {/* Category name with preview */}
      <div className="flex min-w-[140px] items-center gap-2">
        <span className={colorStyles.text}>
          {ICON_PRESETS[setting.icon]('h-4 w-4')}
        </span>
        <span className="text-sm font-medium text-content">{category}</span>
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
    </div>
  );
}

export default CategorySettingsRow;
