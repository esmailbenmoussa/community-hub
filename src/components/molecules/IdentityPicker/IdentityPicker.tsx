/**
 * IdentityPicker
 * A component for searching and selecting Azure DevOps users.
 * Features debounced search and dropdown selection.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { IdentitySearchResult } from '@/types';

interface IdentityPickerProps {
  /** Callback when a user is selected */
  onSelect: (user: IdentitySearchResult) => void;
  /** Function to search for users */
  searchUsers: (query: string) => Promise<IdentitySearchResult[]>;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** List of user IDs to exclude from results */
  excludeIds?: string[];
}

/**
 * IdentityPicker component
 */
export function IdentityPicker({
  onSelect,
  searchUsers,
  placeholder = 'Search for users...',
  disabled = false,
  excludeIds = [],
}: IdentityPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IdentitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchUsers(query);
        // Filter out excluded users
        const filteredResults = searchResults.filter(
          (user) => !excludeIds.includes(user.id)
        );
        setResults(filteredResults);
        setIsOpen(filteredResults.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('[IdentityPicker] Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchUsers, excludeIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle user selection
  const handleSelect = useCallback(
    (user: IdentitySearchResult) => {
      onSelect(user);
      setQuery('');
      setResults([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && results[highlightedIndex]) {
            handleSelect(results[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, results, highlightedIndex, handleSelect]
  );

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            query.length >= 2 && results.length > 0 && setIsOpen(true)
          }
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-ado border border-border bg-surface px-3 py-2 pl-9 text-sm text-content placeholder-content-disabled transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {/* Loading indicator */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="h-4 w-4 animate-spin text-content-secondary"
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
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-ado border border-border bg-surface shadow-lg"
        >
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-content-secondary">
              No users found
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((user, index) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(user)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                      index === highlightedIndex
                        ? 'bg-surface-hover'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    {/* Avatar */}
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.displayName}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* User info */}
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-medium text-content">
                        {user.displayName}
                      </div>
                      {user.uniqueName && (
                        <div className="truncate text-xs text-content-secondary">
                          {user.uniqueName}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default IdentityPicker;
