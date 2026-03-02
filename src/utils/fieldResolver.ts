/**
 * Field Resolver Utility
 * Resolves semantic field purposes to actual ADO field reference names.
 *
 * This utility bridges the gap between:
 * - Hardcoded field names (DISCUSSION_FIELDS) used throughout the codebase
 * - Dynamic field mappings stored by the field mapping service
 *
 * It ensures WIQL queries only reference fields that actually exist in the
 * user's Azure DevOps process template, preventing TF51005 errors.
 */

import { FieldPurpose, REQUIRED_FIELD_PURPOSES } from '@/types/fieldMapping';
import { DISCUSSION_FIELDS } from '@/types/discussion';
import { fieldMappingService } from '@/services/fieldMapping.service';

/**
 * Resolved field reference names.
 * Required fields are always present (guaranteed by setup).
 * Optional fields may be undefined if not mapped.
 */
export interface ResolvedFields {
  /** Discussion category field (required) */
  Category: string;
  /** Visibility scope field (required) */
  Visibility: string;
  /** Target projects for cross-project visibility (optional) */
  TargetProjects?: string;
  /** Vote count field (optional) */
  VoteCount?: string;
  /** Is pinned field (optional) */
  IsPinned?: string;
}

/**
 * Capabilities available based on which fields are mapped.
 * This helps UI components and services gracefully degrade
 * when optional fields are not available.
 */
export interface FieldCapabilities {
  /** Whether cross-project visibility features are available */
  crossProjectEnabled: boolean;
  /** Whether voting/sorting by votes is available */
  votingEnabled: boolean;
  /** Whether pinning discussions is available */
  pinningEnabled: boolean;
}

/**
 * Complete field resolution result including both field names and capabilities.
 */
export interface FieldResolution {
  /** Resolved field reference names */
  fields: ResolvedFields;
  /** Available capabilities based on mapped fields */
  capabilities: FieldCapabilities;
  /** Whether all required fields are mapped */
  isValid: boolean;
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Default field names used as fallback when no mapping exists.
 * This provides backward compatibility for existing installations.
 */
const DEFAULT_FIELDS: ResolvedFields = {
  Category: DISCUSSION_FIELDS.Category,
  Visibility: DISCUSSION_FIELDS.Visibility,
  TargetProjects: DISCUSSION_FIELDS.TargetProjects,
  VoteCount: DISCUSSION_FIELDS.VoteCount,
  IsPinned: DISCUSSION_FIELDS.IsPinned,
};

/**
 * Resolve field names from the field mapping service.
 *
 * @param useDefaults - If true, fall back to hardcoded defaults when no mapping exists.
 *                      Set to false for strict mode that requires explicit mapping.
 * @returns Field resolution result with resolved names and capabilities
 */
export async function resolveFields(
  useDefaults: boolean = true
): Promise<FieldResolution> {
  try {
    // Try to load stored field mapping
    const storedMapping = await fieldMappingService.loadMapping();

    if (!storedMapping || !storedMapping.config.mappings) {
      // No mapping exists
      if (useDefaults) {
        console.log(
          '[FieldResolver] No mapping found, using default field names'
        );
        return createResolution(DEFAULT_FIELDS);
      } else {
        return {
          fields: { Category: '', Visibility: '' },
          capabilities: {
            crossProjectEnabled: false,
            votingEnabled: false,
            pinningEnabled: false,
          },
          isValid: false,
          error: 'Field mapping not configured. Please run setup.',
        };
      }
    }

    const mappings = storedMapping.config.mappings;

    // Resolve each field purpose to its reference name
    const resolved: ResolvedFields = {
      Category:
        mappings[FieldPurpose.Category] ||
        (useDefaults ? DEFAULT_FIELDS.Category : ''),
      Visibility:
        mappings[FieldPurpose.Visibility] ||
        (useDefaults ? DEFAULT_FIELDS.Visibility : ''),
      TargetProjects: mappings[FieldPurpose.TargetProjects],
      VoteCount: mappings[FieldPurpose.VoteCount],
      IsPinned: mappings[FieldPurpose.IsPinned],
    };

    // Validate required fields
    const missingRequired: string[] = [];
    if (!resolved.Category) missingRequired.push('Category');
    if (!resolved.Visibility) missingRequired.push('Visibility');

    if (missingRequired.length > 0 && !useDefaults) {
      return {
        fields: resolved,
        capabilities: {
          crossProjectEnabled: false,
          votingEnabled: false,
          pinningEnabled: false,
        },
        isValid: false,
        error: `Missing required field mappings: ${missingRequired.join(', ')}`,
      };
    }

    // Apply defaults for missing required fields if useDefaults is true
    if (useDefaults) {
      if (!resolved.Category) resolved.Category = DEFAULT_FIELDS.Category;
      if (!resolved.Visibility) resolved.Visibility = DEFAULT_FIELDS.Visibility;
    }

    return createResolution(resolved);
  } catch (error) {
    console.error('[FieldResolver] Error resolving fields:', error);

    if (useDefaults) {
      console.log('[FieldResolver] Using default fields due to error');
      return createResolution(DEFAULT_FIELDS);
    }

    return {
      fields: { Category: '', Visibility: '' },
      capabilities: {
        crossProjectEnabled: false,
        votingEnabled: false,
        pinningEnabled: false,
      },
      isValid: false,
      error:
        error instanceof Error ? error.message : 'Failed to resolve fields',
    };
  }
}

/**
 * Synchronously get resolved fields from the cached mapping.
 * Use this when you know the mapping has already been loaded.
 *
 * @param useDefaults - If true, fall back to hardcoded defaults
 * @returns Field resolution result
 */
export function resolveFieldsSync(
  useDefaults: boolean = true
): FieldResolution {
  try {
    // Check if field mapping service is configured (has cached mapping)
    if (!fieldMappingService.isConfigured()) {
      if (useDefaults) {
        return createResolution(DEFAULT_FIELDS);
      }
      return {
        fields: { Category: '', Visibility: '' },
        capabilities: {
          crossProjectEnabled: false,
          votingEnabled: false,
          pinningEnabled: false,
        },
        isValid: false,
        error: 'Field mapping not configured',
      };
    }

    // Get the field map from cached mapping
    const fieldMap = fieldMappingService.getFieldMap();

    const resolved: ResolvedFields = {
      Category: fieldMap[FieldPurpose.Category] || DEFAULT_FIELDS.Category,
      Visibility:
        fieldMap[FieldPurpose.Visibility] || DEFAULT_FIELDS.Visibility,
      TargetProjects: fieldMap[FieldPurpose.TargetProjects],
      VoteCount: fieldMap[FieldPurpose.VoteCount],
      IsPinned: fieldMap[FieldPurpose.IsPinned],
    };

    return createResolution(resolved);
  } catch (error) {
    console.warn('[FieldResolver] Sync resolution failed:', error);
    if (useDefaults) {
      return createResolution(DEFAULT_FIELDS);
    }
    return {
      fields: { Category: '', Visibility: '' },
      capabilities: {
        crossProjectEnabled: false,
        votingEnabled: false,
        pinningEnabled: false,
      },
      isValid: false,
      error:
        error instanceof Error ? error.message : 'Failed to resolve fields',
    };
  }
}

/**
 * Create a field resolution result from resolved fields.
 */
function createResolution(fields: ResolvedFields): FieldResolution {
  return {
    fields,
    capabilities: {
      crossProjectEnabled: !!fields.TargetProjects,
      votingEnabled: !!fields.VoteCount,
      pinningEnabled: !!fields.IsPinned,
    },
    isValid: !!fields.Category && !!fields.Visibility,
  };
}

/**
 * Check if a specific field purpose is mapped and available.
 *
 * @param purpose - The field purpose to check
 * @returns True if the field is mapped
 */
export function isFieldMapped(purpose: FieldPurpose): boolean {
  try {
    if (!fieldMappingService.isConfigured()) {
      // When not configured, assume defaults are available
      return true;
    }
    const fieldMap = fieldMappingService.getFieldMap();
    return !!fieldMap[purpose];
  } catch {
    // If required field check fails, optional fields may still not be mapped
    return REQUIRED_FIELD_PURPOSES.includes(purpose);
  }
}

/**
 * Get field capabilities based on current mapping.
 * Useful for UI components to conditionally render features.
 */
export function getFieldCapabilities(): FieldCapabilities {
  const resolution = resolveFieldsSync(true);
  return resolution.capabilities;
}
