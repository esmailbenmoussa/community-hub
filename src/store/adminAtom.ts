/**
 * Admin Settings Atom
 * Jotai atoms for managing admin list state globally.
 */

import { atom } from 'jotai';
import { AdminSettings, DEFAULT_ADMIN_SETTINGS } from '@/types';

/**
 * Atom for storing admin settings
 * Contains the list of admin users
 */
export const adminSettingsAtom = atom<AdminSettings>(DEFAULT_ADMIN_SETTINGS);

/**
 * Atom to track if admin settings have been loaded from storage
 */
export const adminSettingsLoadedAtom = atom<boolean>(false);

/**
 * Atom to track if the current user is an admin
 * This is computed when admin settings are loaded
 */
export const isCurrentUserAdminAtom = atom<boolean>(false);

/**
 * Atom to track if admin check is in progress
 */
export const adminCheckLoadingAtom = atom<boolean>(true);
