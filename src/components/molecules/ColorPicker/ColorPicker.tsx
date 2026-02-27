/**
 * ColorPicker Component
 * Dropdown grid for selecting category colors from presets
 */

import { useState, useRef, useEffect } from 'react';
import { ColorName } from '@/types/categorySettings';
import {
  COLOR_DISPLAY_NAMES,
  COLOR_OPTIONS,
  COLOR_SWATCHES,
} from '@/config/categoryPresets';

interface ColorPickerProps {
  /** Currently selected color */
  value: ColorName;
  /** Callback when color is selected */
  onChange: (color: ColorName) => void;
  /** Optional className for the trigger button */
  className?: string;
}

/**
 * ColorPicker - A dropdown grid for selecting colors
 */
export function ColorPicker({
  value,
  onChange,
  className = '',
}: ColorPickerProps) {
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

  const handleSelect = (color: ColorName) => {
    onChange(color);
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
        <span className={`h-4 w-4 rounded-full ${COLOR_SWATCHES[value]}`} />
        <span className="min-w-[50px] text-left">
          {COLOR_DISPLAY_NAMES[value]}
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
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-ado border border-border bg-surface p-2 shadow-lg">
          <div className="mb-2 px-1 text-xs font-medium text-content-secondary">
            Select Color
          </div>
          <div className="grid grid-cols-5 gap-1">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleSelect(color)}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                  value === color ? 'ring-2 ring-accent ring-offset-2' : ''
                }`}
                title={COLOR_DISPLAY_NAMES[color]}
              >
                <span
                  className={`h-6 w-6 rounded-full ${COLOR_SWATCHES[color]}`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
