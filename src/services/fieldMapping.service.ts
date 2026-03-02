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
  FieldMetadata,
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
 * ADO Field Type enum values (from FieldType enum in ADO API).
 * The ADO API returns numeric values for field types.
 * This map converts those numeric values to our FieldType strings.
 *
 * Based on: https://learn.microsoft.com/en-us/rest/api/azure/devops/processes/fields
 * FieldType enum:
 *   String = 1, Integer = 2, DateTime = 3, PlainText = 5, Html = 7,
 *   TreePath = 8, History = 9, Double = 10, Guid = 11, Boolean = 12,
 *   Identity = 13, PicklistInteger = 14, PicklistString = 15, PicklistDouble = 16
 */
const ADO_FIELD_TYPE_MAP: Record<number, FieldType> = {
  1: 'string',
  2: 'integer',
  3: 'dateTime',
  5: 'plainText',
  7: 'html',
  8: 'treePath',
  9: 'html', // history - treat as html
  10: 'double',
  11: 'string', // guid - treat as string
  12: 'boolean',
  13: 'identity',
  14: 'picklistInteger',
  15: 'picklistString',
  16: 'picklistDouble',
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
 * Response type from WorkItemTrackingRestClient.getField()
 */
interface WitFieldInfo {
  name?: string;
  referenceName?: string;
  type?: string | number;
  isPicklist?: boolean;
  isPicklistSuggested?: boolean;
  picklistId?: string;
  description?: string;
}

/**
 * Response type from ProcessRestClient.getList()
 */
interface PicklistResponse {
  id?: string;
  name?: string;
  type?: string;
  items?: string[];
  isSuggested?: boolean;
}

/**
 * Dynamically load ADO API clients (only in production)
 */
async function getAdoClients() {
  const { getClient } =
    await import('azure-devops-extension-api/Common/Client');
  const { WorkItemTrackingProcessRestClient } =
    await import('azure-devops-extension-api/WorkItemTrackingProcess');
  const { WorkItemTrackingRestClient } =
    await import('azure-devops-extension-api/WorkItemTracking');

  return {
    getClient,
    WorkItemTrackingProcessRestClient,
    WorkItemTrackingRestClient,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private witClient: any = null;

  /** Cached mapping configuration */
  private cachedMapping: FieldMappingConfig | null = null;

  /** Cached field metadata (including picklist allowed values) */
  private cachedFieldMetadata: Partial<
    Record<FieldPurpose, FieldMetadata>
  > | null = null;

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

    const {
      getClient,
      WorkItemTrackingProcessRestClient,
      WorkItemTrackingRestClient,
    } = await getAdoClients();

    this.processClient = getClient(WorkItemTrackingProcessRestClient);
    this.witClient = getClient(WorkItemTrackingRestClient);
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
          this.cachedFieldMetadata = parsed.fieldMetadata ?? null;
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
        this.cachedFieldMetadata = result.fieldMetadata ?? null;
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
   * @param config The field mapping configuration
   * @param processId The process ID
   * @param availableFields Optional discovered fields to extract metadata from
   */
  async saveMapping(
    config: FieldMappingConfig,
    processId: string,
    availableFields?: DiscoveredField[]
  ): Promise<void> {
    // Build field metadata from available fields
    const fieldMetadata = this.buildFieldMetadata(config, availableFields);

    if (isDevMode()) {
      const stored: StoredFieldMapping = {
        config,
        projectId: 'mock-project-id',
        processId,
        savedAt: new Date().toISOString(),
        version: FIELD_MAPPING_VERSION,
        fieldMetadata,
      };
      localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(stored));
      this.cachedMapping = config;
      this.cachedFieldMetadata = fieldMetadata ?? null;
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
        fieldMetadata,
      };

      await dataManager.setValue(
        `${EDS_COLLECTIONS.FieldMapping}-${this.projectId}`,
        stored,
        { scopeType: 'Default' }
      );

      this.cachedMapping = config;
      this.cachedFieldMetadata = fieldMetadata ?? null;
      console.log('[FieldMappingService] Saved field mapping to EDS');
    } catch (error) {
      console.error('[FieldMappingService] Error saving field mapping:', error);
      throw error;
    }
  }

  /**
   * Build field metadata from discovered fields based on the mapping config.
   * Extracts allowedValues for picklist fields.
   */
  private buildFieldMetadata(
    config: FieldMappingConfig,
    availableFields?: DiscoveredField[]
  ): Partial<Record<FieldPurpose, FieldMetadata>> | undefined {
    if (!availableFields || availableFields.length === 0) {
      return undefined;
    }

    const metadata: Partial<Record<FieldPurpose, FieldMetadata>> = {};

    for (const purpose of ALL_FIELD_PURPOSES) {
      const fieldRefName = config.mappings[purpose];
      if (!fieldRefName) continue;

      const field = availableFields.find(
        (f) => f.referenceName === fieldRefName
      );
      if (!field) continue;

      // Only store metadata for picklist fields with allowed values
      if (
        field.isPicklist &&
        field.allowedValues &&
        field.allowedValues.length > 0
      ) {
        metadata[purpose] = {
          allowedValues: field.allowedValues,
          displayName: field.name,
        };
      }
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  /**
   * Get available fields from the Discussion Work Item Type.
   * These are the fields that can be mapped to semantic purposes.
   *
   * Note: The Process API (getAllWorkItemTypeFields) does NOT reliably identify picklist fields
   * or return their allowedValues. We use a two-step approach:
   * 1. Get field list from Process API (getAllWorkItemTypeFields)
   * 2. For each Custom field, use WIT API (getField) to check if it's a picklist and get picklistId
   * 3. For picklist fields, use Process API (getList) to get the actual allowed values
   */
  async getAvailableFields(
    processId: string,
    witRefName: string
  ): Promise<DiscoveredField[]> {
    if (isDevMode()) {
      return mockAvailableFields;
    }

    if (!this.processClient || !this.witClient) {
      throw new Error('Service not initialized');
    }

    try {
      // Step 1: Get all fields from Process API
      const fields: AdoProcessWorkItemTypeField[] =
        await this.processClient.getAllWorkItemTypeFields(
          processId,
          witRefName
        );

      // Filter to Custom fields only
      const customFields = fields.filter((f) =>
        f.referenceName?.startsWith('Custom.')
      );

      console.log(
        `[FieldMappingService] Found ${customFields.length} custom fields. Checking for picklists...`
      );

      // Step 2: Map fields and use WIT API to detect picklists
      const discoveredFields: DiscoveredField[] = [];

      for (const f of customFields) {
        const fieldType = this.mapAdoFieldType(f.type);
        let isPicklist = false;
        let allowedValues: string[] | undefined = f.allowedValues;

        // Use WIT API to check if field is a picklist and get picklistId
        try {
          const witFieldInfo: WitFieldInfo = await this.witClient.getField(
            f.referenceName
          );

          console.log(
            `[FieldMappingService] WIT API response for ${f.name}:`,
            JSON.stringify(
              {
                isPicklist: witFieldInfo.isPicklist,
                picklistId: witFieldInfo.picklistId,
              },
              null,
              2
            )
          );

          isPicklist = witFieldInfo.isPicklist === true;

          // If it's a picklist and we have a picklistId, fetch the actual values
          if (isPicklist && witFieldInfo.picklistId) {
            try {
              const picklist: PicklistResponse =
                await this.processClient.getList(witFieldInfo.picklistId);

              console.log(
                `[FieldMappingService] Picklist response for ${f.name}:`,
                JSON.stringify(picklist, null, 2)
              );

              if (picklist.items && picklist.items.length > 0) {
                allowedValues = picklist.items;
                console.log(
                  `[FieldMappingService] Got ${allowedValues.length} allowed values for ${f.name}:`,
                  allowedValues
                );
              }
            } catch (picklistErr) {
              console.warn(
                `[FieldMappingService] Failed to get picklist for ${f.name}:`,
                picklistErr
              );
            }
          }
        } catch (witErr) {
          console.warn(
            `[FieldMappingService] Failed to get WIT field info for ${f.name}:`,
            witErr
          );
          // Fall back to type-based detection
          isPicklist =
            fieldType === 'picklistString' ||
            fieldType === 'picklistInteger' ||
            fieldType === 'picklistDouble';
        }

        discoveredFields.push({
          name: f.name || '',
          referenceName: f.referenceName || '',
          type: isPicklist ? 'picklistString' : fieldType, // Override type if we know it's a picklist
          isPicklist,
          allowedValues,
          description: f.description,
        });
      }

      console.log(
        '[FieldMappingService] Final discovered fields:',
        discoveredFields.map((f) => ({
          name: f.name,
          type: f.type,
          isPicklist: f.isPicklist,
          allowedValuesCount: f.allowedValues?.length ?? 0,
        }))
      );

      return discoveredFields;
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
   * Migrate existing field mapping to include field metadata.
   * This is needed for installations that saved field mappings before
   * the fieldMetadata feature was added.
   *
   * @param processId - The process ID to fetch fields from
   * @param witRefName - The Work Item Type reference name
   * @returns true if migration was performed, false if not needed
   */
  async migrateFieldMetadata(
    processId: string,
    witRefName: string
  ): Promise<boolean> {
    // Check if we have a mapping but no metadata
    if (!this.cachedMapping) {
      console.log('[FieldMappingService] No mapping to migrate');
      return false;
    }

    if (this.hasFieldMetadata()) {
      console.log('[FieldMappingService] Field metadata already exists');
      return false;
    }

    console.log(
      '[FieldMappingService] Migrating field mapping to include metadata...'
    );

    try {
      // Fetch available fields from ADO
      const availableFields = await this.getAvailableFields(
        processId,
        witRefName
      );

      // Build and store metadata
      const metadata = this.buildFieldMetadata(
        this.cachedMapping,
        availableFields
      );

      if (metadata && Object.keys(metadata).length > 0) {
        // Re-save the mapping with the new metadata
        await this.saveMapping(this.cachedMapping, processId, availableFields);
        console.log(
          '[FieldMappingService] Migration complete. Field metadata saved.'
        );
        return true;
      } else {
        console.log(
          '[FieldMappingService] No picklist fields found to migrate'
        );
        return false;
      }
    } catch (error) {
      console.error('[FieldMappingService] Migration failed:', error);
      return false;
    }
  }

  /**
   * Clear the cached mapping (useful for re-running setup).
   */
  clearCache(): void {
    this.cachedMapping = null;
    this.cachedFieldMetadata = null;
  }

  /**
   * Get the allowed values for a specific field purpose (e.g., Category).
   * Returns undefined if the field is not a picklist or has no stored values.
   */
  getFieldAllowedValues(purpose: FieldPurpose): string[] | undefined {
    return this.cachedFieldMetadata?.[purpose]?.allowedValues;
  }

  /**
   * Get category options from the stored field metadata.
   * Returns the allowed values from the ADO picklist, or undefined if not available.
   */
  getCategoryOptions(): string[] | undefined {
    return this.getFieldAllowedValues(FieldPurpose.Category);
  }

  /**
   * Get the cached field metadata.
   * Returns null if not loaded.
   */
  getFieldMetadata(): Partial<Record<FieldPurpose, FieldMetadata>> | null {
    return this.cachedFieldMetadata;
  }

  /**
   * Check if field metadata is available (i.e., picklist values are cached).
   */
  hasFieldMetadata(): boolean {
    return (
      this.cachedFieldMetadata !== null &&
      Object.keys(this.cachedFieldMetadata).length > 0
    );
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
