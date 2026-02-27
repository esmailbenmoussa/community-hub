/**
 * Validation Service
 * Validates that the project has the required process template configuration
 * for Community Hub to function properly.
 *
 * The validation flow:
 * 1. Check process template (must be inherited or custom)
 * 2. Check Discussion Work Item Type exists
 * 3. Check field mapping (load existing, auto-match, or prompt for manual mapping)
 */

import * as SDK from 'azure-devops-extension-sdk';
import {
  SetupStatus,
  ValidationCheckStatus,
  ValidationCheck,
  ValidationResult,
  ProcessInfo,
  DISCUSSION_WORK_ITEM_TYPE,
  StoredSetupStatus,
  EDS_COLLECTIONS,
  FieldType,
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
} from '@/types';
import { REQUIRED_FIELD_PURPOSES } from '@/types/fieldMapping';
import { isDevMode } from '@/utils/environment';
import { fieldMappingService } from './fieldMapping.service';

/**
 * ADO Field Type enum values.
 * The ADO API sometimes returns numeric values instead of string names.
 */
const ADO_FIELD_TYPE_MAP: Record<number, FieldType> = {
  1: 'string',
  2: 'integer',
  3: 'dateTime',
  4: 'plainText',
  5: 'html',
  6: 'treePath',
  7: 'html', // history
  8: 'double',
  9: 'string', // guid
  10: 'boolean',
  11: 'identity',
  12: 'picklistString',
  13: 'picklistInteger',
  14: 'picklistDouble',
};

/**
 * ADO API response types for dynamic imports
 */
interface AdoProcessWorkItemType {
  name?: string;
  referenceName?: string;
  description?: string;
  color?: string;
  icon?: string;
  isDisabled?: boolean;
}

interface AdoProcessResponse {
  typeId?: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  customizationType?: number;
  parentProcessTypeId?: string;
}

/**
 * Validation check IDs - simplified to 3 main checks
 */
const VALIDATION_CHECKS = {
  PROCESS_TEMPLATE: 'process-template',
  WORK_ITEM_TYPE: 'work-item-type',
  FIELD_MAPPING: 'field-mapping',
} as const;

/**
 * Create initial validation checks
 */
function createInitialChecks(): ValidationCheck[] {
  return [
    {
      id: VALIDATION_CHECKS.PROCESS_TEMPLATE,
      name: 'Process Template',
      description: 'Project uses an inherited or custom process template',
      status: ValidationCheckStatus.Pending,
    },
    {
      id: VALIDATION_CHECKS.WORK_ITEM_TYPE,
      name: 'Discussion Work Item Type',
      description: `Work Item Type "${DISCUSSION_WORK_ITEM_TYPE}" exists in the process`,
      status: ValidationCheckStatus.Pending,
    },
    {
      id: VALIDATION_CHECKS.FIELD_MAPPING,
      name: 'Field Mapping',
      description:
        'Required fields are mapped to Discussion work item type fields',
      status: ValidationCheckStatus.Pending,
    },
  ];
}

/**
 * Update a check's status in the checks array
 */
function updateCheck(
  checks: ValidationCheck[],
  checkId: string,
  status: ValidationCheckStatus,
  message?: string,
  details?: string
): void {
  const check = checks.find((c) => c.id === checkId);
  if (check) {
    check.status = status;
    if (message) check.message = message;
    if (details) check.details = details;
  }
}

/**
 * Map ADO field type to our FieldType.
 * Handles both string type names and numeric enum values.
 */
function mapAdoFieldType(adoType?: string | number): FieldType {
  if (adoType === undefined || adoType === null) return 'string';

  // Handle numeric enum values
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
 * Dynamically load ADO API clients (only in production)
 */
async function getAdoClients() {
  const { getClient } =
    await import('azure-devops-extension-api/Common/Client');
  const { WorkItemTrackingProcessRestClient, CustomizationType } =
    await import('azure-devops-extension-api/WorkItemTrackingProcess');
  const { CoreRestClient } = await import('azure-devops-extension-api/Core');

  return {
    getClient,
    WorkItemTrackingProcessRestClient,
    CoreRestClient,
    CustomizationType,
  };
}

/**
 * Validation Service class
 */
export class ValidationService {
  private projectId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processClient: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private coreClient: any = null;

  /**
   * Initialize the service with the current project context
   */
  async initialize(): Promise<void> {
    if (isDevMode()) {
      console.log('[ValidationService] Running in dev mode - using mock data');
      return;
    }

    const webContext = SDK.getWebContext();
    this.projectId = webContext.project?.id || null;

    const { getClient, WorkItemTrackingProcessRestClient, CoreRestClient } =
      await getAdoClients();

    this.processClient = getClient(WorkItemTrackingProcessRestClient);
    this.coreClient = getClient(CoreRestClient);
  }

  /**
   * Get the process template for the current project
   */
  async getProjectProcess(): Promise<ProcessInfo | null> {
    if (isDevMode()) {
      return {
        id: 'mock-process-id',
        name: 'Mock Inherited Process',
        isDefault: false,
        type: 'inherited',
        parentProcessId: 'agile-base',
      };
    }

    if (!this.coreClient || !this.processClient || !this.projectId) {
      throw new Error('Service not initialized');
    }

    const { CustomizationType } = await getAdoClients();

    try {
      // Get project properties to find process template
      const project = await this.coreClient.getProject(this.projectId, true);

      // Get the process template ID from project capabilities
      const processTemplateId =
        project.capabilities?.['processTemplate']?.['templateTypeId'];

      if (!processTemplateId) {
        return null;
      }

      // Get process details
      const processes = await this.processClient.getListOfProcesses();
      const process = processes.find(
        (p: AdoProcessResponse) => p.typeId === processTemplateId
      );

      if (!process) {
        return null;
      }

      return {
        id: process.typeId || '',
        name: process.name || '',
        description: process.description,
        isDefault: process.isDefault || false,
        type:
          process.customizationType === CustomizationType.Inherited
            ? 'inherited'
            : process.customizationType === CustomizationType.Custom
              ? 'custom'
              : 'system',
        parentProcessId: process.parentProcessTypeId,
      };
    } catch (error) {
      console.error(
        '[ValidationService] Error getting project process:',
        error
      );
      throw error;
    }
  }

  /**
   * Check if Discussion Work Item Type exists in the process
   */
  async checkWorkItemTypeExists(
    processId: string
  ): Promise<AdoProcessWorkItemType | null> {
    if (isDevMode()) {
      return {
        name: DISCUSSION_WORK_ITEM_TYPE,
        referenceName: `Custom.${DISCUSSION_WORK_ITEM_TYPE}`,
        description: 'Community Hub discussion',
        color: '009CCC',
        icon: 'icon_chat',
        isDisabled: false,
      };
    }

    if (!this.processClient) {
      throw new Error('Service not initialized');
    }

    try {
      const workItemTypes =
        await this.processClient.getProcessWorkItemTypes(processId);
      return (
        workItemTypes.find(
          (wit: AdoProcessWorkItemType) =>
            wit.name === DISCUSSION_WORK_ITEM_TYPE
        ) || null
      );
    } catch (error) {
      console.error(
        '[ValidationService] Error checking work item type:',
        error
      );
      throw error;
    }
  }

  /**
   * Run full validation and return results
   */
  async validate(): Promise<ValidationResult> {
    const checks = createInitialChecks();

    let projectId = 'unknown';
    if (!isDevMode()) {
      const webContext = SDK.getWebContext();
      projectId = webContext.project?.id || 'unknown';
    } else {
      projectId = 'mock-project-id';
    }

    try {
      await this.initialize();
      await fieldMappingService.initialize();

      // Step 1: Check process template
      updateCheck(
        checks,
        VALIDATION_CHECKS.PROCESS_TEMPLATE,
        ValidationCheckStatus.Checking
      );

      const process = await this.getProjectProcess();

      if (!process) {
        updateCheck(
          checks,
          VALIDATION_CHECKS.PROCESS_TEMPLATE,
          ValidationCheckStatus.Failed,
          'Could not determine project process template'
        );
        return this.createResult(SetupStatus.Error, checks, projectId);
      }

      if (process.type === 'system') {
        updateCheck(
          checks,
          VALIDATION_CHECKS.PROCESS_TEMPLATE,
          ValidationCheckStatus.Failed,
          'Project uses a system process. An inherited process is required.',
          'Create an inherited process from Agile, Scrum, or Basic, then apply it to this project.'
        );
        updateCheck(
          checks,
          VALIDATION_CHECKS.WORK_ITEM_TYPE,
          ValidationCheckStatus.Failed,
          'Cannot check - process template issue'
        );
        updateCheck(
          checks,
          VALIDATION_CHECKS.FIELD_MAPPING,
          ValidationCheckStatus.Failed,
          'Cannot check - process template issue'
        );
        return this.createResult(
          SetupStatus.Incomplete,
          checks,
          projectId,
          process.id,
          process.name
        );
      }

      updateCheck(
        checks,
        VALIDATION_CHECKS.PROCESS_TEMPLATE,
        ValidationCheckStatus.Passed,
        `Using "${process.name}" (${process.type} process)`
      );

      // Step 2: Check Discussion Work Item Type exists
      updateCheck(
        checks,
        VALIDATION_CHECKS.WORK_ITEM_TYPE,
        ValidationCheckStatus.Checking
      );

      const discussionWIT = await this.checkWorkItemTypeExists(process.id);

      if (!discussionWIT) {
        updateCheck(
          checks,
          VALIDATION_CHECKS.WORK_ITEM_TYPE,
          ValidationCheckStatus.Failed,
          `Work Item Type "${DISCUSSION_WORK_ITEM_TYPE}" not found in process`,
          `Add a new Work Item Type named "${DISCUSSION_WORK_ITEM_TYPE}" to the "${process.name}" process.`
        );
        updateCheck(
          checks,
          VALIDATION_CHECKS.FIELD_MAPPING,
          ValidationCheckStatus.Failed,
          'Cannot check - Work Item Type not found'
        );
        return this.createResult(
          SetupStatus.Incomplete,
          checks,
          projectId,
          process.id,
          process.name
        );
      }

      updateCheck(
        checks,
        VALIDATION_CHECKS.WORK_ITEM_TYPE,
        ValidationCheckStatus.Passed,
        `Work Item Type "${DISCUSSION_WORK_ITEM_TYPE}" found`
      );

      // Step 3: Check field mapping
      updateCheck(
        checks,
        VALIDATION_CHECKS.FIELD_MAPPING,
        ValidationCheckStatus.Checking
      );

      const witRefName =
        discussionWIT.referenceName || `Custom.${DISCUSSION_WORK_ITEM_TYPE}`;

      // Try to load existing field mapping
      const existingMapping = await fieldMappingService.loadMapping();

      if (existingMapping && fieldMappingService.isConfigured()) {
        // We have a valid saved mapping
        updateCheck(
          checks,
          VALIDATION_CHECKS.FIELD_MAPPING,
          ValidationCheckStatus.Passed,
          'Field mapping configured',
          `${REQUIRED_FIELD_PURPOSES.length} required fields mapped`
        );
        return this.createResult(
          SetupStatus.Complete,
          checks,
          projectId,
          process.id,
          process.name,
          witRefName
        );
      }

      // No saved mapping - try auto-match
      const availableFields = await fieldMappingService.getAvailableFields(
        process.id,
        witRefName
      );

      if (availableFields.length === 0) {
        updateCheck(
          checks,
          VALIDATION_CHECKS.FIELD_MAPPING,
          ValidationCheckStatus.Failed,
          'No custom fields found on Discussion work item type',
          'Add custom fields to the Discussion work item type for Category, Visibility, etc.'
        );
        return this.createResult(
          SetupStatus.Incomplete,
          checks,
          projectId,
          process.id,
          process.name,
          witRefName
        );
      }

      const autoMatchResult =
        fieldMappingService.autoMatchFields(availableFields);

      if (autoMatchResult.allRequiredMatched) {
        // Auto-match succeeded for required fields
        // Don't auto-save - let the user review and confirm the mappings
        const matchedCount = Object.keys(autoMatchResult.matched).length;
        const unmatchedCount = autoMatchResult.unmatched.length;

        updateCheck(
          checks,
          VALIDATION_CHECKS.FIELD_MAPPING,
          ValidationCheckStatus.Warning,
          `Auto-matched ${matchedCount} field(s) - review required`,
          unmatchedCount > 0
            ? `${unmatchedCount} optional field(s) not matched. Please review and confirm the mapping.`
            : 'Please review and confirm the field mapping.'
        );

        // Return NeedsFieldMapping so user can review before saving
        return this.createResult(
          SetupStatus.NeedsFieldMapping,
          checks,
          projectId,
          process.id,
          process.name,
          witRefName
        );
      }

      // Auto-match failed for required fields - need manual mapping
      const missingRequired = autoMatchResult.unmatched.filter((purpose) =>
        REQUIRED_FIELD_PURPOSES.includes(purpose)
      );

      updateCheck(
        checks,
        VALIDATION_CHECKS.FIELD_MAPPING,
        ValidationCheckStatus.Warning,
        `Could not auto-match ${missingRequired.length} required field(s)`,
        `Manual field mapping required. Found ${availableFields.length} custom fields available.`
      );

      return this.createResult(
        SetupStatus.NeedsFieldMapping,
        checks,
        projectId,
        process.id,
        process.name,
        witRefName
      );
    } catch (error) {
      console.error('[ValidationService] Validation error:', error);

      // Mark any pending checks as failed
      checks.forEach((check) => {
        if (
          check.status === ValidationCheckStatus.Pending ||
          check.status === ValidationCheckStatus.Checking
        ) {
          check.status = ValidationCheckStatus.Failed;
          check.message = 'Validation error occurred';
        }
      });

      return this.createResult(SetupStatus.Error, checks, projectId);
    }
  }

  /**
   * Create a validation result object
   */
  private createResult(
    status: SetupStatus,
    checks: ValidationCheck[],
    projectId: string,
    processId?: string,
    processName?: string,
    witReferenceName?: string
  ): ValidationResult {
    return {
      status,
      checks,
      timestamp: new Date(),
      projectId,
      processId,
      processName,
      witReferenceName,
    };
  }

  /**
   * Save validation status to Extension Data Service
   */
  async saveSetupStatus(result: ValidationResult): Promise<void> {
    if (isDevMode()) {
      console.log('[ValidationService] Dev mode - skipping save to EDS');
      localStorage.setItem(
        'community-hub-setup-status',
        JSON.stringify({
          status: result.status,
          validatedAt: result.timestamp.toISOString(),
          processId: result.processId || '',
          processName: result.processName || '',
          projectId: result.projectId,
          witReferenceName: result.witReferenceName,
        })
      );
      return;
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

      const storedStatus: StoredSetupStatus = {
        status: result.status,
        validatedAt: result.timestamp.toISOString(),
        processId: result.processId || '',
        processName: result.processName || '',
        projectId: result.projectId,
        witReferenceName: result.witReferenceName,
      };

      await dataManager.setValue(
        `${EDS_COLLECTIONS.SetupStatus}-${result.projectId}`,
        storedStatus,
        { scopeType: 'Default' }
      );
    } catch (error) {
      console.error('[ValidationService] Error saving setup status:', error);
      throw error;
    }
  }

  /**
   * Load validation status from Extension Data Service
   */
  async loadSetupStatus(): Promise<StoredSetupStatus | null> {
    if (isDevMode()) {
      const stored = localStorage.getItem('community-hub-setup-status');
      return stored ? JSON.parse(stored) : null;
    }

    try {
      const webContext = SDK.getWebContext();
      const projectId = webContext.project?.id;

      if (!projectId) {
        return null;
      }

      const dataService = await SDK.getService<IExtensionDataService>(
        'ms.vss-features.extension-data-service'
      );
      const accessToken = await SDK.getAccessToken();
      const dataManager = await dataService.getExtensionDataManager(
        SDK.getExtensionContext().id,
        accessToken
      );

      const result = await dataManager.getValue<StoredSetupStatus>(
        `${EDS_COLLECTIONS.SetupStatus}-${projectId}`,
        { scopeType: 'Default' }
      );
      return result ?? null;
    } catch (error) {
      console.error('[ValidationService] Error loading setup status:', error);
      return null;
    }
  }

  /**
   * Save user preferences (user-scoped)
   */
  async saveUserPreferences(prefs: UserPreferences): Promise<void> {
    if (isDevMode()) {
      console.log('[ValidationService] Dev mode - saving user preferences');
      localStorage.setItem(
        'community-hub-user-preferences',
        JSON.stringify(prefs)
      );
      return;
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

      await dataManager.setValue(EDS_COLLECTIONS.UserPreferences, prefs, {
        scopeType: 'User',
      });
    } catch (error) {
      console.error(
        '[ValidationService] Error saving user preferences:',
        error
      );
      throw error;
    }
  }

  /**
   * Load user preferences (user-scoped)
   * Returns default preferences if not found
   */
  async loadUserPreferences(): Promise<UserPreferences> {
    if (isDevMode()) {
      const stored = localStorage.getItem('community-hub-user-preferences');
      if (stored) {
        try {
          return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(stored) };
        } catch {
          return DEFAULT_USER_PREFERENCES;
        }
      }
      return DEFAULT_USER_PREFERENCES;
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

      const result = await dataManager.getValue<UserPreferences>(
        EDS_COLLECTIONS.UserPreferences,
        { scopeType: 'User' }
      );

      return result
        ? { ...DEFAULT_USER_PREFERENCES, ...result }
        : DEFAULT_USER_PREFERENCES;
    } catch (error) {
      console.error(
        '[ValidationService] Error loading user preferences:',
        error
      );
      return DEFAULT_USER_PREFERENCES;
    }
  }
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

// Export mapAdoFieldType for use by other services if needed
export { mapAdoFieldType };

// Export singleton instance
export const validationService = new ValidationService();
