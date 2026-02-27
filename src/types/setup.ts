/**
 * Setup and Validation Types
 * Type definitions for the setup wizard and validation process
 */

// ============================================
// Validation Status Types
// ============================================

/**
 * Overall setup status
 */
export enum SetupStatus {
  /** Setup has not been checked yet */
  Unknown = 'unknown',
  /** Setup validation is in progress */
  Validating = 'validating',
  /** Setup is incomplete - requires admin action */
  Incomplete = 'incomplete',
  /** Process/WIT setup is complete but field mapping is needed */
  NeedsFieldMapping = 'needs-field-mapping',
  /** Setup is complete and valid */
  Complete = 'complete',
  /** Validation failed due to an error */
  Error = 'error',
}

/**
 * Individual validation check status
 */
export enum ValidationCheckStatus {
  Pending = 'pending',
  Checking = 'checking',
  Passed = 'passed',
  Failed = 'failed',
  Warning = 'warning',
}

/**
 * Individual validation check result
 */
export interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  status: ValidationCheckStatus;
  message?: string;
  details?: string;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  status: SetupStatus;
  checks: ValidationCheck[];
  timestamp: Date;
  projectId: string;
  processId?: string;
  processName?: string;
  /** The discovered Work Item Type reference name (e.g., "YourOrg.Discussion") */
  witReferenceName?: string;
}

// ============================================
// Process Template Types
// ============================================

/**
 * Process template information
 */
export interface ProcessInfo {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  type: 'system' | 'inherited' | 'custom';
  parentProcessId?: string;
}

/**
 * Work Item Type information
 */
export interface WorkItemTypeInfo {
  name: string;
  referenceName: string;
  description?: string;
  color: string;
  icon?: string;
  isDisabled: boolean;
}

/**
 * Field definition information
 */
export interface FieldInfo {
  name: string;
  referenceName: string;
  type: FieldType;
  isRequired: boolean;
  isPicklist: boolean;
  allowedValues?: string[];
  defaultValue?: string | number | boolean;
}

/**
 * Supported field types
 */
export type FieldType =
  | 'string'
  | 'integer'
  | 'double'
  | 'dateTime'
  | 'boolean'
  | 'html'
  | 'plainText'
  | 'treePath'
  | 'identity'
  | 'picklistString'
  | 'picklistInteger'
  | 'picklistDouble';

// ============================================
// Required Fields Configuration
// ============================================

/**
 * Required field definition for validation
 */
export interface RequiredFieldDefinition {
  referenceName: string;
  displayName: string;
  expectedType: FieldType | FieldType[];
  isRequired: boolean;
  allowedValues?: string[];
  description: string;
}

/**
 * Required fields for Discussion Work Item Type
 */
export const REQUIRED_DISCUSSION_FIELDS: RequiredFieldDefinition[] = [
  {
    referenceName: 'Custom.Category',
    displayName: 'Category',
    expectedType: ['string', 'picklistString'],
    isRequired: true,
    allowedValues: ['Announcements', 'General', 'Ideas', 'Help'],
    description: 'Discussion category (Announcements, General, Ideas, Help)',
  },
  {
    referenceName: 'Custom.Visibility',
    displayName: 'Visibility',
    expectedType: ['string', 'picklistString'],
    isRequired: true,
    allowedValues: ['Project', 'Organization', 'CrossProject'],
    description: 'Visibility scope for the discussion',
  },
  {
    referenceName: 'Custom.TargetProjects',
    displayName: 'Target Projects',
    expectedType: ['string', 'html', 'plainText'],
    isRequired: false,
    description: 'JSON array of project IDs for cross-project visibility',
  },
  {
    referenceName: 'Custom.VoteCount',
    displayName: 'Vote Count',
    expectedType: 'integer',
    isRequired: false,
    description: 'Cached count of upvotes',
  },
  {
    referenceName: 'Custom.IsPinned',
    displayName: 'Is Pinned',
    expectedType: 'boolean',
    isRequired: false,
    description: 'Whether the discussion is pinned to the top',
  },
  {
    referenceName: 'Custom.Labels',
    displayName: 'Labels',
    expectedType: ['string', 'html', 'plainText'],
    isRequired: false,
    description: 'JSON array of label names assigned to the discussion',
  },
];

// ============================================
// Setup Wizard Types
// ============================================

/**
 * Setup wizard step
 */
export interface SetupWizardStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  isOptional: boolean;
}

/**
 * Setup wizard state
 */
export interface SetupWizardState {
  currentStepIndex: number;
  steps: SetupWizardStep[];
  validationResult: ValidationResult | null;
  isValidating: boolean;
  error: string | null;
}

// ============================================
// Extension Data Service Types
// ============================================

/**
 * Setup status stored in Extension Data Service
 */
export interface StoredSetupStatus {
  status: SetupStatus;
  validatedAt: string;
  processId: string;
  processName: string;
  projectId: string;
  /** Work Item Type reference name (e.g., Custom.Discussion) */
  witReferenceName?: string;
}

/**
 * Extension Data Service collection names
 */
export const EDS_COLLECTIONS = {
  /** Project-scoped setup status */
  SetupStatus: 'community-hub-setup',
  /** Project-scoped labels */
  Labels: 'community-hub-labels',
  /** User-scoped votes */
  UserVotes: 'community-hub-votes',
  /** User-scoped preferences */
  UserPreferences: 'community-hub-preferences',
  /** Project-scoped field mapping configuration */
  FieldMapping: 'community-hub-field-mapping',
  /** Project-scoped category settings (icons and colors) */
  CategorySettings: 'community-hub-category-settings',
} as const;

// ============================================
// User Preferences Types
// ============================================

/**
 * User preferences (user-scoped)
 */
export interface UserPreferences {
  /** Number of discussions per page */
  pageSize: number;
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  pageSize: 25,
};

/**
 * Available page size options
 */
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
