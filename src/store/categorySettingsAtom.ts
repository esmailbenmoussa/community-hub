/**
 * Category Settings Atom
 * Jotai atom for managing category icon and color settings state
 */

import { atom } from 'jotai';
import { CategorySettings, DEFAULT_CATEGORY_SETTINGS } from '@/types';

/**
 * Atom for storing category settings (icons and colors)
 * Initialized with defaults, loaded from storage on app init
 */
export const categorySettingsAtom = atom<CategorySettings>(
  DEFAULT_CATEGORY_SETTINGS
);

/**
 * Atom to track if category settings have been loaded from storage
 */
export const categorySettingsLoadedAtom = atom<boolean>(false);
