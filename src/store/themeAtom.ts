import { atom } from 'jotai';

export type Theme = 'light' | 'dark';

/**
 * Global theme state atom
 * Syncs with Azure DevOps host theme in production
 * Uses system preference in development mode
 */
export const themeAtom = atom<Theme>('light');
