/**
 * Admin Types
 * Type definitions for admin list management
 */

/**
 * Admin user entry in the admin list
 */
export interface Admin {
  /** Azure DevOps user ID (unique identifier) */
  id: string;
  /** Display name for UI */
  displayName: string;
  /** Email or unique username (for reference) */
  uniqueName?: string;
  /** Avatar URL */
  imageUrl?: string;
  /** When this admin was added */
  addedAt: string;
  /** User ID of who added this admin */
  addedBy: string;
}

/**
 * Admin settings stored in Extension Data Service
 * Organization-scoped to share across all projects
 */
export interface AdminSettings {
  /** List of admin users */
  admins: Admin[];
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Default empty admin settings
 */
export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  admins: [],
  updatedAt: new Date().toISOString(),
};

/**
 * Identity search result from Azure DevOps
 */
export interface IdentitySearchResult {
  id: string;
  displayName: string;
  uniqueName?: string;
  imageUrl?: string;
}
