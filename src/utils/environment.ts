/// <reference types="vite/client" />
/**
 * Environment detection utilities
 */

/**
 * Check if running in development mode (local dev server)
 * Returns true when running `npm run dev` locally
 */
export const isDevMode = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Check if running in production mode
 */
export const isProdMode = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Get the current environment name
 */
export const getEnvironment = (): 'development' | 'production' => {
  return isDevMode() ? 'development' : 'production';
};
