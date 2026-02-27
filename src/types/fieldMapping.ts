/**
 * Field Mapping Types
 * Types and constants for the user-selectable field mapping feature.
 *
 * Since Azure DevOps can generate custom field reference names with random
 * numbers/GUIDs (e.g., `Custom.12345678` instead of `Custom.Category`),
 * we need a way for admins to map ADO fields to their semantic purposes.
 */

import { FieldType } from './setup';

// ============================================
// Enums and Constants
// ============================================

/**
 * Semantic purposes for fields in the Discussion Work Item Type.
 * These represent what each field is used for, regardless of its actual
 * reference name in Azure DevOps.
 */
export enum FieldPurpose {
  /** Discussion category (Announcements, General, Ideas, Help) */
  Category = 'Category',
  /** Visibility scope (Project, Organization, CrossProject) */
  Visibility = 'Visibility',
  /** JSON array of project IDs for cross-project visibility */
  TargetProjects = 'TargetProjects',
  /** Cached count of upvotes */
  VoteCount = 'VoteCount',
  /** Whether the discussion is pinned to the top */
  IsPinned = 'IsPinned',
}

/**
 * All field purposes as an array for iteration
 */
export const ALL_FIELD_PURPOSES: FieldPurpose[] = [
  FieldPurpose.Category,
  FieldPurpose.Visibility,
  FieldPurpose.TargetProjects,
  FieldPurpose.VoteCount,
  FieldPurpose.IsPinned,
];

/**
 * Required field purposes that must be mapped for the extension to function.
 * Other fields are optional and enhance functionality.
 */
export const REQUIRED_FIELD_PURPOSES: FieldPurpose[] = [
  FieldPurpose.Category,
  FieldPurpose.Visibility,
];

// ============================================
// Field Discovery Types
// ============================================

/**
 * A field discovered from the Discussion Work Item Type in Azure DevOps.
 * This represents fields available for mapping.
 */
export interface DiscoveredField {
  /** Display name of the field */
  name: string;
  /** Reference name (e.g., "Custom.Category" or "Custom.12345678") */
  referenceName: string;
  /** Field type */
  type: FieldType;
  /** Whether this is a picklist field */
  isPicklist: boolean;
  /** Allowed values if this is a picklist */
  allowedValues?: string[];
  /** Field description */
  description?: string;
}

// ============================================
// Field Requirements
// ============================================

/**
 * Requirements for a field to be valid for a specific purpose.
 */
export interface FieldRequirement {
  /** The semantic purpose this requirement is for */
  purpose: FieldPurpose;
  /** Display name for UI */
  displayName: string;
  /** Description of what this field is used for */
  description: string;
  /** Acceptable field types */
  expectedTypes: FieldType[];
  /** Whether this field must be mapped for the extension to function */
  isRequired: boolean;
  /** Expected allowed values for picklist fields (optional validation) */
  suggestedValues?: string[];
}

/**
 * Requirements for each field purpose.
 * Defines what types of ADO fields can be mapped to each purpose.
 */
export const FIELD_REQUIREMENTS: Record<FieldPurpose, FieldRequirement> = {
  [FieldPurpose.Category]: {
    purpose: FieldPurpose.Category,
    displayName: 'Category',
    description: 'Discussion category (Announcements, General, Ideas, Help)',
    expectedTypes: ['string', 'picklistString'],
    isRequired: true,
    suggestedValues: ['Announcements', 'General', 'Ideas', 'Help'],
  },
  [FieldPurpose.Visibility]: {
    purpose: FieldPurpose.Visibility,
    displayName: 'Visibility',
    description: 'Visibility scope for the discussion',
    expectedTypes: ['string', 'picklistString'],
    isRequired: true,
    suggestedValues: ['Project', 'Organization', 'CrossProject'],
  },
  [FieldPurpose.TargetProjects]: {
    purpose: FieldPurpose.TargetProjects,
    displayName: 'Target Projects',
    description: 'JSON array of project IDs for cross-project visibility',
    expectedTypes: ['string', 'html', 'plainText'],
    isRequired: false,
  },
  [FieldPurpose.VoteCount]: {
    purpose: FieldPurpose.VoteCount,
    displayName: 'Vote Count',
    description: 'Cached count of upvotes',
    expectedTypes: ['integer'],
    isRequired: false,
  },
  [FieldPurpose.IsPinned]: {
    purpose: FieldPurpose.IsPinned,
    displayName: 'Is Pinned',
    description: 'Whether the discussion is pinned to the top',
    expectedTypes: ['boolean'],
    isRequired: false,
  },
};

// ============================================
// Default Field Patterns for Auto-Matching
// ============================================

/**
 * Default reference name patterns to try for auto-matching.
 * If a field with this exact reference name exists, it will be automatically
 * mapped to the corresponding purpose.
 */
export const DEFAULT_FIELD_PATTERNS: Record<FieldPurpose, string[]> = {
  [FieldPurpose.Category]: ['Custom.Category', 'Custom.DiscussionCategory'],
  [FieldPurpose.Visibility]: [
    'Custom.Visibility',
    'Custom.DiscussionVisibility',
  ],
  [FieldPurpose.TargetProjects]: [
    'Custom.TargetProjects',
    'Custom.CrossProjectTargets',
  ],
  [FieldPurpose.VoteCount]: ['Custom.VoteCount', 'Custom.Votes'],
  [FieldPurpose.IsPinned]: ['Custom.IsPinned', 'Custom.Pinned'],
};

// ============================================
// Field Mapping Configuration Types
// ============================================

/**
 * A single mapping entry from a purpose to a field reference name.
 */
export interface FieldMappingEntry {
  /** The semantic purpose */
  purpose: FieldPurpose;
  /** The ADO field reference name mapped to this purpose */
  fieldReferenceName: string;
  /** Whether this mapping has been validated against the field's type */
  validated: boolean;
}

/**
 * Complete field mapping configuration.
 * Maps each semantic purpose to an ADO field reference name.
 */
export interface FieldMappingConfig {
  /** Map of purpose to field reference name */
  mappings: Partial<Record<FieldPurpose, string>>;
}

/**
 * Stored field mapping with metadata.
 * This is what gets persisted to the Extension Data Service.
 */
export interface StoredFieldMapping {
  /** The field mapping configuration */
  config: FieldMappingConfig;
  /** Project ID this mapping belongs to */
  projectId: string;
  /** Process ID this mapping was created for */
  processId: string;
  /** Timestamp when the mapping was saved */
  savedAt: string;
  /** Schema version for future migrations */
  version: number;
}

/**
 * Current schema version for stored field mappings.
 */
export const FIELD_MAPPING_VERSION = 1;

// ============================================
// Auto-Match Result Types
// ============================================

/**
 * Result of attempting to auto-match fields.
 */
export interface AutoMatchResult {
  /** Successfully matched purposes and their field reference names */
  matched: Partial<Record<FieldPurpose, string>>;
  /** Purposes that could not be auto-matched */
  unmatched: FieldPurpose[];
  /** Whether all required fields were matched */
  allRequiredMatched: boolean;
}

/**
 * Result of validating a field selection for a purpose.
 */
export interface FieldValidationResult {
  /** Whether the field is valid for the purpose */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Warning message (valid but not ideal) */
  warning?: string;
}
