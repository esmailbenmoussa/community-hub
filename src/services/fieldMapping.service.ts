/**
 * Field Mapping Service
 * Handles loading, saving, and managing the mapping between semantic field
 * purposes and actual Azure DevOps field reference names.
 *
 * This service enables the extension to work with ADO fields regardless of
 * their reference names, which can vary between organizations due to ADO's
 * field naming behavior (sometimes generating GUIDs or random numbers).
 */

import * as SDK from 'azure-devops-extension-sdk';
import {
  FieldPurpose,
  FieldMappingConfig,
  StoredFieldMapping,
  DiscoveredField,
  FieldValidationResult,
  AutoMatchResult,
  FIELD_REQUIREMENTS,
  DEFAULT_FIELD_PATTERNS,
  REQUIRED_FIELD_PURPOSES,
  ALL_FIELD_PURPOSES,
  FIELD_MAPPING_VERSION,
} from '@/types/fieldMapping';
import { EDS_COLLECTIONS, FieldType } from '@/types/setup';
import { isDevMode } from '@/utils/environment';
import { mockAvailableFields } from '@/mocks';

/**
 * Local storage key for dev mode persistence
 */
const DEV_STORAGE_KEY = 'community-hub-field-mapping';

/**
 * ADO Field Type enum values.
 * The ADO API sometimes returns numeric values instead of string names.
 * This map converts those numeric values to our FieldType strings.
 */
const ADO_FIELD_TYPE_MAP: Record<number, FieldType> = {
  1: 'string',
  2: 'integer',
  3: 'dateTime',
  4: 'plainText',
  5: 'html',
  6: 'treePath',
  7: 'html', // history - treat as html
  8: 'double',
  9: 'string', // guid - treat as string
  10: 'boolean',
  11: 'identity',
  12: 'picklistString',
  13: 'picklistInteger',
  14: 'picklistDouble',
};

/**
 * ADO API types for dynamic imports
 */
interface AdoProcessWorkItemTypeField {
  name?: string;
  referenceName?: string;
  type?: string | number; // ADO API can return numeric enum values
  description?: string;
  allowedValues?: string[];
  isPicklist?: boolean;
}

/**
 * Dynamically load ADO API clients (only in production)
 */
async function getAdoClients() {
  const { getClient } =
    await import('azure-devops-extension-api/Common/Client');
  const { WorkItemTrackingProcessRestClient } =
    await import('azure-devops-extension-api/WorkItemTrackingProcess');

  return {
    getClient,
    WorkItemTrackingProcessRestClient,
  };
}

/**
 * Extension Data Service interface (from ADO SDK)
 */
interface IExtensionDataService {
  getExtensionDataManager(
    extensionId: string,
    accessToken: string
  ): Promise<IExtensionDataManager>;
}

interface IExtensionDataManager {
  getValue<T>(
    key: string,
    options?: { scopeType: string }
  ): Promise<T | undefined>;
  setValue<T>(
    key: string,
    value: T,
    options?: { scopeType: string }
  ): Promise<T>;
}

/**
 * Field Mapping Service class
 */
export class FieldMappingService {
  private projectId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processClient: any = null;

  /** Cached mapping configuration */
  private cachedMapping: FieldMappingConfig | null = null;

  /**
   * Initialize the service with the current project context
   */
  async initialize(): Promise<void> {
    if (isDevMode()) {
      this.projectId = 'mock-project-id';
      console.log(
        '[FieldMappingService] Running in dev mode - using mock data'
      );
      return;
    }

    const webContext = SDK.getWebContext();
    this.projectId = webContext.project?.id || null;

    const { getClient, WorkItemTrackingProcessRestClient } =
      await getAdoClients();

    this.processClient = getClient(WorkItemTrackingProcessRestClient);
  }

  /**
   * Load saved field mapping from Extension Data Service
   */
  async loadMapping(): Promise<StoredFieldMapping | null> {
    if (isDevMode()) {
      const stored = localStorage.getItem(DEV_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as StoredFieldMapping;
          this.cachedMapping = parsed.config;
          return parsed;
        } catch {
          return null;
        }
      }
      return null;
    }

    if (!this.projectId) {
      throw new Error('Service not initialized');
    }

    try {
      const dataService = await SDK.getService<IExtensionDataService>(
        'ms.vss-features.extension-data-service'
      );
      const accessToken = await SDK.getAccessToken();
      const dataManager = await dataService.getExtensionDataManager(
        SDK.getExtensionContext().id,
        accessToken
      );

      const result = await dataManager.getValue<StoredFieldMapping>(
        `${EDS_COLLECTIONS.FieldMapping}-${this.projectId}`,
        { scopeType: 'Default' }
      );

      if (result) {
        this.cachedMapping = result.config;
      }

      return result ?? null;
    } catch (error) {
      console.error(
        '[FieldMappingService] Error loading field mapping:',
        error
      );
      return null;
    }
  }

  /**
   * Save field mapping to Extension Data Service
   */
  async saveMapping(
    config: FieldMappingConfig,
    processId: string
  ): Promise<void> {
    if (isDevMode()) {
      const stored: StoredFieldMapping = {
        config,
        projectId: 'mock-project-id',
        processId,
        savedAt: new Date().toISOString(),
        version: FIELD_MAPPING_VERSION,
      };
      localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(stored));
      this.cachedMapping = config;
      console.log('[FieldMappingService] Dev mode - saved to localStorage');
      return;
    }

    if (!this.projectId) {
      throw new Error('Service not initialized');
    }

    try {
      const dataService = await SDK.getService<IExtensionDataService>(
        'ms.vss-features.extension-data-service'
      );
      const accessToken = await SDK.getAccessToken();
      const dataManager = await dataService.getExtensionDataManager(
        SDK.getExtensionContext().id,
        accessToken
      );

      const stored: StoredFieldMapping = {
        config,
        projectId: this.projectId,
        processId,
        savedAt: new Date().toISOString(),
        version: FIELD_MAPPING_VERSION,
      };

      await dataManager.setValue(
        `${EDS_COLLECTIONS.FieldMapping}-${this.projectId}`,
        stored,
        { scopeType: 'Default' }
      );

      this.cachedMapping = config;
      console.log('[FieldMappingService] Saved field mapping to EDS');
    } catch (error) {
      console.error('[FieldMappingService] Error saving field mapping:', error);
      throw error;
    }
  }

  /**
   * Get available fields from the Discussion Work Item Type.
   * These are the fields that can be mapped to semantic purposes.
   */
  async getAvailableFields(
    processId: string,
    witRefName: string
  ): Promise<DiscoveredField[]> {
    if (isDevMode()) {
      return mockAvailableFields;
    }

    if (!this.processClient) {
      throw new Error('Service not initialized');
    }

    try {
      const fields: AdoProcessWorkItemTypeField[] =
        await this.processClient.getAllWorkItemTypeFields(
          processId,
          witRefName
        );

      const customFields = fields.filter((f) =>
        f.referenceName?.startsWith('Custom.')
      );

      // Debug logging to diagnose field type issues
      console.log(
        '[FieldMappingService] Raw ADO fields:',
        customFields.map((f) => ({
          name: f.name,
          referenceName: f.referenceName,
          type: f.type,
          typeOfType: typeof f.type,
          isPicklist: f.isPicklist,
        }))
      );

      return customFields.map((f) => {
        const fieldType = this.mapAdoFieldType(f.type);
        console.log(
          `[FieldMappingService] Field "${f.name}" (${f.referenceName}): ADO type=${f.type} (${typeof f.type}) -> mapped to "${fieldType}"`
        );
        return {
          name: f.name || '',
          referenceName: f.referenceName || '',
          type: fieldType,
          isPicklist:
            f.isPicklist ||
            fieldType === 'picklistString' ||
            fieldType === 'picklistInteger' ||
            fieldType === 'picklistDouble',
          allowedValues: f.allowedValues,
          description: f.description,
        };
      });
    } catch (error) {
      console.error(
        '[FieldMappingService] Error getting available fields:',
        error
      );
      throw error;
    }
  }

  /**
   * Validate that a field is appropriate for a given purpose.
   */
  validateFieldSelection(
    field: DiscoveredField,
    purpose: FieldPurpose
  ): FieldValidationResult {
    const requirement = FIELD_REQUIREMENTS[purpose];

    if (!requirement) {
      return { valid: false, error: `Unknown field purpose: ${purpose}` };
    }

    // Check type compatibility
    const typeMatches = requirement.expectedTypes.some((expectedType) =>
      this.isTypeCompatible(field.type, expectedType)
    );

    if (!typeMatches) {
      return {
        valid: false,
        error: `Field "${field.name}" has type "${field.type}", but ${requirement.displayName} requires one of: ${requirement.expectedTypes.join(', ')}`,
      };
    }

    // Check picklist values if applicable
    if (
      requirement.suggestedValues &&
      field.isPicklist &&
      field.allowedValues
    ) {
      const missingValues = requirement.suggestedValues.filter(
        (v) => !field.allowedValues!.includes(v)
      );
      if (missingValues.length > 0) {
        return {
          valid: true,
          warning: `Field "${field.name}" is missing some suggested values: ${missingValues.join(', ')}. The extension may not function correctly.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Attempt to auto-match available fields to their purposes using known patterns.
   */
  autoMatchFields(availableFields: DiscoveredField[]): AutoMatchResult {
    const matched: Partial<Record<FieldPurpose, string>> = {};
    const unmatched: FieldPurpose[] = [];

    for (const purpose of ALL_FIELD_PURPOSES) {
      const patterns = DEFAULT_FIELD_PATTERNS[purpose];
      let foundField: DiscoveredField | undefined;

      // Try each pattern in order
      for (const pattern of patterns) {
        foundField = availableFields.find(
          (f) => f.referenceName.toLowerCase() === pattern.toLowerCase()
        );
        if (foundField) {
          break;
        }
      }

      if (foundField) {
        // Validate the found field
        const validation = this.validateFieldSelection(foundField, purpose);
        if (validation.valid) {
          matched[purpose] = foundField.referenceName;
        } else {
          // Field exists but doesn't pass validation
          unmatched.push(purpose);
        }
      } else {
        unmatched.push(purpose);
      }
    }

    // Check if all required fields were matched
    const allRequiredMatched = REQUIRED_FIELD_PURPOSES.every(
      (purpose) => matched[purpose] !== undefined
    );

    return {
      matched,
      unmatched,
      allRequiredMatched,
    };
  }

  /**
   * Get the mapped field reference name for a purpose.
   * Returns null if the purpose is not mapped.
   */
  getMappedFieldName(purpose: FieldPurpose): string | null {
    if (!this.cachedMapping) {
      return null;
    }
    return this.cachedMapping.mappings[purpose] || null;
  }

  /**
   * Get the complete field mapping.
   * Throws if not configured.
   */
  getFieldMap(): Record<FieldPurpose, string> {
    if (!this.cachedMapping) {
      throw new Error('Field mapping not configured. Run setup first.');
    }

    // Verify all required fields are mapped
    for (const purpose of REQUIRED_FIELD_PURPOSES) {
      if (!this.cachedMapping.mappings[purpose]) {
        throw new Error(
          `Required field "${FIELD_REQUIREMENTS[purpose].displayName}" is not mapped. Run setup to configure field mapping.`
        );
      }
    }

    // Return complete mapping (required fields guaranteed, others may be undefined)
    const result: Record<FieldPurpose, string> = {} as Record<
      FieldPurpose,
      string
    >;
    for (const purpose of ALL_FIELD_PURPOSES) {
      const mapped = this.cachedMapping.mappings[purpose];
      if (mapped) {
        result[purpose] = mapped;
      }
    }

    return result;
  }

  /**
   * Check if the field mapping is configured (at minimum, required fields are mapped).
   */
  isConfigured(): boolean {
    if (!this.cachedMapping) {
      return false;
    }

    return REQUIRED_FIELD_PURPOSES.every(
      (purpose) => this.cachedMapping!.mappings[purpose] !== undefined
    );
  }

  /**
   * Get the field mapping safely without throwing.
   * Returns null if not configured, otherwise returns partial mapping.
   * Use this for graceful degradation scenarios.
   */
  getFieldMapSafe(): Partial<Record<FieldPurpose, string>> | null {
    if (!this.cachedMapping) {
      return null;
    }

    const result: Partial<Record<FieldPurpose, string>> = {};
    for (const purpose of ALL_FIELD_PURPOSES) {
      const mapped = this.cachedMapping.mappings[purpose];
      if (mapped) {
        result[purpose] = mapped;
      }
    }

    return result;
  }

  /**
   * Get a specific field reference name by purpose.
   * Returns undefined if not mapped.
   */
  getFieldReference(purpose: FieldPurpose): string | undefined {
    return this.cachedMapping?.mappings[purpose];
  }

  /**
   * Clear the cached mapping (useful for re-running setup).
   */
  clearCache(): void {
    this.cachedMapping = null;
  }

  /**
   * Map ADO field type to our FieldType.
   * Handles both string type names and numeric enum values from ADO API.
   */
  private mapAdoFieldType(adoType?: string | number): FieldType {
    if (adoType === undefined || adoType === null) return 'string';

    // Handle numeric enum values (ADO API sometimes returns these)
    if (typeof adoType === 'number') {
      return ADO_FIELD_TYPE_MAP[adoType] || 'string';
    }

    // Try parsing as number first (API might return "1" as string)
    const numericValue = parseInt(adoType, 10);
    if (!isNaN(numericValue) && ADO_FIELD_TYPE_MAP[numericValue]) {
      return ADO_FIELD_TYPE_MAP[numericValue];
    }

    // Handle string type names
    const type = adoType.toLowerCase();

    if (type.includes('pickliststring')) return 'picklistString';
    if (type.includes('picklistinteger')) return 'picklistInteger';
    if (type.includes('picklistdouble')) return 'picklistDouble';
    if (type.includes('integer')) return 'integer';
    if (type.includes('double')) return 'double';
    if (type.includes('datetime')) return 'dateTime';
    if (type.includes('boolean')) return 'boolean';
    if (type.includes('html')) return 'html';
    if (type.includes('plaintext')) return 'plainText';
    if (type.includes('treepath')) return 'treePath';
    if (type.includes('identity')) return 'identity';

    return 'string';
  }

  /**
   * Check if two field types are compatible
   */
  private isTypeCompatible(
    actualType: FieldType,
    expectedType: FieldType
  ): boolean {
    if (actualType === expectedType) {
      return true;
    }

    // Special compatibility rules
    const compatibilityMap: Record<FieldType, FieldType[]> = {
      string: ['string', 'picklistString'],
      picklistString: ['string', 'picklistString'],
      html: ['html', 'string', 'plainText'],
      plainText: ['plainText', 'string', 'html'],
      integer: ['integer', 'picklistInteger'],
      picklistInteger: ['integer', 'picklistInteger'],
      double: ['double', 'picklistDouble'],
      picklistDouble: ['double', 'picklistDouble'],
      boolean: ['boolean'],
      dateTime: ['dateTime'],
      treePath: ['treePath'],
      identity: ['identity'],
    };

    const compatible = compatibilityMap[actualType];
    return compatible ? compatible.includes(expectedType) : false;
  }
}

// Export singleton instance
export const fieldMappingService = new FieldMappingService();
