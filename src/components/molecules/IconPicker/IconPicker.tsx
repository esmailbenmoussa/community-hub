/**
 * IconPicker Component
 * Dropdown grid for selecting category icons from presets
 */

import { useState, useRef, useEffect } from 'react';
import { IconName } from '@/types/categorySettings';
import {
  ICON_PRESETS,
  ICON_DISPLAY_NAMES,
  ICON_OPTIONS,
} from '@/config/categoryPresets';

interface IconPickerProps {
  /** Currently selected icon */
  value: IconName;
  /** Callback when icon is selected */
  onChange: (icon: IconName) => void;
  /** Optional className for the trigger button */
  className?: string;
}

/**
 * IconPicker - A dropdown grid for selecting icons
 */
export function IconPicker({
  value,
  onChange,
  className = '',
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (icon: IconName) => {
    onChange(icon);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-ado border border-border bg-surface px-3 py-1.5 text-sm text-content hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <span className="flex h-5 w-5 items-center justify-center">
          {ICON_PRESETS[value]('h-4 w-4')}
        </span>
        <span className="min-w-[60px] text-left">
          {ICON_DISPLAY_NAMES[value]}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-ado border border-border bg-surface p-2 shadow-lg">
          <div className="mb-2 px-1 text-xs font-medium text-content-secondary">
            Select Icon
          </div>
          <div className="grid grid-cols-5 gap-1">
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleSelect(icon)}
                className={`flex h-10 w-10 items-center justify-center rounded-ado transition-colors ${
                  value === icon
                    ? 'bg-accent text-white'
                    : 'text-content hover:bg-surface-hover'
                }`}
                title={ICON_DISPLAY_NAMES[icon]}
              >
                {ICON_PRESETS[icon]('h-5 w-5')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default IconPicker;
