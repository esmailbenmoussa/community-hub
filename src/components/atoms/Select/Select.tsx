import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  error?: ReactNode;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Custom dropdown select component
 * Styled to match Azure DevOps design patterns
 */
export const Select = ({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  className = '',
  placeholder,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || placeholder || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  const handleSelect = (selectedValue: string) => {
    if (onChange) {
      onChange({ target: { value: selectedValue } });
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        } else {
          setIsOpen(true);
          setHighlightedIndex(0);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-content">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          flex w-full items-center justify-between rounded-sm border bg-surface px-3 py-2 text-sm
          transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-content-secondary'}
          ${error ? 'border-state-error focus:border-state-error focus:ring-state-error' : 'border-border'}
        `}
      >
        <span
          className={`flex items-center gap-2 ${selectedOption ? 'text-content' : 'text-content-secondary'}`}
        >
          {selectedOption?.icon}
          {selectedLabel}
        </span>

        {/* Chevron SVG - rotates when open */}
        <svg
          className={`h-4 w-4 text-content-secondary transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Animated dropdown */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value}
                  ref={(el) => (optionsRef.current[index] = el)}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors
                    ${isSelected ? 'bg-accent-light font-medium text-content' : 'text-content'}
                    ${isHighlighted && !isSelected ? 'bg-surface-hover' : ''}
                    hover:bg-surface-hover
                  `}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <svg
                      className="h-4 w-4 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-state-error">{error}</p>}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-1 text-xs text-content-secondary">{helperText}</p>
      )}
    </div>
  );
};
