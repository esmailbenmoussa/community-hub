/**
 * Category Settings Atom
 * Jotai atom for managing category icon and color settings state.
 * Supports dynamic categories from ADO picklists.
 */

import { atom } from 'jotai';
import { CategorySettings, DEFAULT_CATEGORY_SETTINGS } from '@/types';

/**
 * Atom for storing category settings (icons and colors).
 * Initialized with defaults for built-in categories.
 * Additional categories from ADO picklists are added dynamically
 * and use fallback settings until customized.
 */
export const categorySettingsAtom = atom<CategorySettings>(
  DEFAULT_CATEGORY_SETTINGS
);

/**
 * Atom to track if category settings have been loaded from storage
 */
export const categorySettingsLoadedAtom = atom<boolean>(false);

/**
 * Atom to store the list of available categories from ADO picklist.
 * This is populated when field mapping is loaded.
 * Falls back to default categories if not available.
 */
export const availableCategoriesAtom = atom<string[]>([]);

/**
 * Atom to track if categories have been loaded from field mapping
 */
export const categoriesLoadedAtom = atom<boolean>(false);
