/**
 * TagInput Component
 * Reusable tag input with autocomplete dropdown for selecting/creating tags
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export interface TagInputProps {
  /** Currently selected tags */
  tags: string[];
  /** Callback when tags change */
  onChange: (tags: string[]) => void;
  /** Available tags for autocomplete */
  availableTags: string[];
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether tags are loading */
  isLoading?: boolean;
}

/**
 * TagInput component - tag input with autocomplete dropdown
 */
export function TagInput({
  tags,
  onChange,
  availableTags,
  maxTags = 5,
  disabled = false,
  placeholder = 'Add tags...',
  isLoading = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter available tags based on input and exclude already selected
  const getFilteredSuggestions = useCallback(() => {
    const normalizedInput = inputValue.toLowerCase().trim();
    const selectedSet = new Set(tags.map((t) => t.toLowerCase()));

    // Filter out already selected tags
    let filtered = availableTags.filter(
      (tag) => !selectedSet.has(tag.toLowerCase())
    );

    // If user has typed something, filter by input
    if (normalizedInput) {
      filtered = filtered.filter((tag) =>
        tag.toLowerCase().includes(normalizedInput)
      );
    }

    return filtered;
  }, [inputValue, tags, availableTags]);

  const suggestions = getFilteredSuggestions();

  // Check if current input would create a new tag
  const canCreateNewTag = useCallback(() => {
    const normalizedInput = inputValue.toLowerCase().trim();
    if (!normalizedInput) return false;

    // Check if exact match exists in available tags (case-insensitive)
    const exactMatchExists = availableTags.some(
      (tag) => tag.toLowerCase() === normalizedInput
    );

    // Check if already selected
    const alreadySelected = tags.some(
      (tag) => tag.toLowerCase() === normalizedInput
    );

    return !exactMatchExists && !alreadySelected;
  }, [inputValue, availableTags, tags]);

  const showCreateOption = canCreateNewTag();

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions.length, showCreateOption]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag) return;

    // Check if already at max
    if (tags.length >= maxTags) return;

    // Check if already selected
    if (tags.some((t) => t.toLowerCase() === normalizedTag)) return;

    onChange([...tags, normalizedTag]);
    setInputValue('');
    setHighlightedIndex(0);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalOptions = suggestions.length + (showCreateOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < totalOptions - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case 'Enter':
        e.preventDefault();
        if (!isOpen || totalOptions === 0) {
          // If dropdown closed or no options, try to add current input as new tag
          if (inputValue.trim()) {
            addTag(inputValue.trim());
          }
          return;
        }

        // If "Create new tag" option is highlighted
        if (showCreateOption && highlightedIndex === suggestions.length) {
          addTag(inputValue.trim());
        } else if (suggestions[highlightedIndex]) {
          addTag(suggestions[highlightedIndex]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setInputValue('');
        break;

      case 'Backspace':
        if (!inputValue && tags.length > 0) {
          // Remove last tag when backspace on empty input
          removeTag(tags[tags.length - 1]);
        }
        break;
    }
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  const handleCreateClick = () => {
    addTag(inputValue.trim());
    inputRef.current?.focus();
  };

  const isMaxReached = tags.length >= maxTags;

  return (
    <div ref={containerRef} className="relative">
      {/* Tag pills and input container */}
      <div
        className={`flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-ado border bg-surface px-2 py-1.5 ${
          disabled
            ? 'border-border opacity-50'
            : 'border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent'
        }`}
      >
        {/* Selected tags as pills */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-xs text-content-secondary"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 text-content-disabled hover:text-state-error"
                aria-label={`Remove tag ${tag}`}
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </span>
        ))}

        {/* Input field or max message */}
        {isMaxReached ? (
          <span className="px-1 text-xs text-content-disabled">
            Max {maxTags} tags
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="min-w-[120px] flex-1 bg-transparent text-sm text-content placeholder:text-content-disabled focus:outline-none"
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-content-disabled"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen &&
        !disabled &&
        !isMaxReached &&
        (suggestions.length > 0 || showCreateOption) && (
          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-ado border border-border bg-surface shadow-lg">
            {/* Existing tag suggestions */}
            {suggestions.map((tag, index) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSuggestionClick(tag)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === highlightedIndex
                    ? 'bg-surface-hover text-content'
                    : 'text-content-secondary hover:bg-surface-hover'
                }`}
              >
                {tag}
              </button>
            ))}

            {/* Create new tag option */}
            {showCreateOption && (
              <button
                type="button"
                onClick={handleCreateClick}
                onMouseEnter={() => setHighlightedIndex(suggestions.length)}
                className={`w-full border-t border-border px-3 py-2 text-left text-sm ${
                  highlightedIndex === suggestions.length
                    ? 'bg-surface-hover text-content'
                    : 'text-content-secondary hover:bg-surface-hover'
                }`}
              >
                <span className="text-accent">Create new tag:</span>{' '}
                <span className="font-medium">
                  {inputValue.trim().toLowerCase()}
                </span>
              </button>
            )}
          </div>
        )}

      {/* Empty state when focused but no tags exist yet */}
      {isOpen &&
        !disabled &&
        !isMaxReached &&
        suggestions.length === 0 &&
        !showCreateOption &&
        !inputValue && (
          <div className="absolute z-50 mt-1 w-full rounded-ado border border-border bg-surface p-3 shadow-lg">
            <p className="text-center text-sm text-content-disabled">
              {isLoading
                ? 'Loading tags...'
                : 'No tags available. Type to create one.'}
            </p>
          </div>
        )}
    </div>
  );
}

export default TagInput;
