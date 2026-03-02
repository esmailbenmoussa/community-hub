/**
 * useFieldMapping Hook
 * Manages state for the field mapping wizard, including:
 * - Loading available fields
 * - Tracking current selections
 * - Validating selections
 * - Saving the final mapping
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FieldPurpose,
  DiscoveredField,
  FieldMappingConfig,
  FieldValidationResult,
  REQUIRED_FIELD_PURPOSES,
} from '@/types/fieldMapping';
import { fieldMappingService } from '@/services/fieldMapping.service';

interface UseFieldMappingOptions {
  /** Process ID to load fields from */
  processId: string;
  /** Discussion Work Item Type reference name */
  witRefName: string;
  /** Initial mappings from auto-match (optional) */
  initialMappings?: Partial<Record<FieldPurpose, string>>;
}

interface UseFieldMappingReturn {
  /** Available fields from the Discussion WIT */
  availableFields: DiscoveredField[];
  /** Current mapping selections */
  currentMappings: Partial<Record<FieldPurpose, string>>;
  /** Validation results for each purpose */
  validationResults: Partial<Record<FieldPurpose, FieldValidationResult>>;
  /** Whether all required fields are validly mapped */
  canSave: boolean;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Error from loading or saving */
  error: string | null;
  /** Update a field selection */
  selectField: (purpose: FieldPurpose, fieldRef: string) => void;
  /** Save the current mapping */
  saveMapping: () => Promise<boolean>;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Hook for managing field mapping state
 */
export function useFieldMapping({
  processId,
  witRefName,
  initialMappings = {},
}: UseFieldMappingOptions): UseFieldMappingReturn {
  const [availableFields, setAvailableFields] = useState<DiscoveredField[]>([]);
  const [currentMappings, setCurrentMappings] =
    useState<Partial<Record<FieldPurpose, string>>>(initialMappings);
  const [validationResults, setValidationResults] = useState<
    Partial<Record<FieldPurpose, FieldValidationResult>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store initialMappings in a ref to avoid dependency issues
  const initialMappingsRef = useRef(initialMappings);

  // Load available fields on mount
  useEffect(() => {
    async function loadFields() {
      setIsLoading(true);
      setError(null);

      try {
        await fieldMappingService.initialize();
        const fields = await fieldMappingService.getAvailableFields(
          processId,
          witRefName
        );
        setAvailableFields(fields);

        const initMappings = initialMappingsRef.current;

        // Helper function to validate mappings and set state
        const validateAndSetMappings = (
          mappings: Partial<Record<FieldPurpose, string>>
        ) => {
          setCurrentMappings(mappings);
          const validations: Partial<
            Record<FieldPurpose, FieldValidationResult>
          > = {};
          for (const [purpose, fieldRef] of Object.entries(mappings)) {
            const field = fields.find((f) => f.referenceName === fieldRef);
            if (field) {
              validations[purpose as FieldPurpose] =
                fieldMappingService.validateFieldSelection(
                  field,
                  purpose as FieldPurpose
                );
            }
          }
          setValidationResults(validations);
        };

        // First, try to load saved mapping from storage (takes precedence)
        const savedMapping = await fieldMappingService.loadMapping();

        if (
          savedMapping?.config?.mappings &&
          Object.keys(savedMapping.config.mappings).length > 0
        ) {
          // Use saved mapping
          console.log(
            '[useFieldMapping] Loaded saved mapping:',
            savedMapping.config.mappings
          );
          validateAndSetMappings(savedMapping.config.mappings);
        } else if (Object.keys(initMappings).length === 0) {
          // No saved mapping and no initial mappings - run auto-match
          const autoMatch = fieldMappingService.autoMatchFields(fields);
          console.log(
            '[useFieldMapping] Auto-matched fields:',
            autoMatch.matched
          );
          validateAndSetMappings(autoMatch.matched);
        } else {
          // Use provided initial mappings
          console.log(
            '[useFieldMapping] Using initial mappings:',
            initMappings
          );
          validateAndSetMappings(initMappings);
        }
      } catch (err) {
        console.error('[useFieldMapping] Error loading fields:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load available fields'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadFields();
  }, [processId, witRefName]);

  // Handle field selection
  const selectField = useCallback(
    (purpose: FieldPurpose, fieldRef: string) => {
      setCurrentMappings((prev) => {
        const updated = { ...prev };
        if (fieldRef === '') {
          delete updated[purpose];
        } else {
          updated[purpose] = fieldRef;
        }
        return updated;
      });

      // Validate the selection
      if (fieldRef === '') {
        setValidationResults((prev) => {
          const updated = { ...prev };
          delete updated[purpose];
          return updated;
        });
      } else {
        const field = availableFields.find((f) => f.referenceName === fieldRef);
        if (field) {
          const validation = fieldMappingService.validateFieldSelection(
            field,
            purpose
          );
          setValidationResults((prev) => ({
            ...prev,
            [purpose]: validation,
          }));
        }
      }
    },
    [availableFields]
  );

  // Check if we can save:
  // 1. All required fields must be mapped and valid
  // 2. Any optional field that IS mapped must also be valid (no errors allowed)
  const canSave =
    // Required fields: must be mapped and valid
    REQUIRED_FIELD_PURPOSES.every((purpose) => {
      const fieldRef = currentMappings[purpose];
      if (!fieldRef) return false;
      const validation = validationResults[purpose];
      return validation?.valid !== false;
    }) &&
    // All mapped fields (including optional): must not have validation errors
    Object.entries(currentMappings).every(([purpose, fieldRef]) => {
      if (!fieldRef) return true; // unmapped is ok
      const validation = validationResults[purpose as FieldPurpose];
      return validation?.valid !== false;
    });

  // Save the mapping
  const saveMapping = useCallback(async (): Promise<boolean> => {
    if (!canSave) {
      setError('Cannot save: required fields are not properly mapped');
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const config: FieldMappingConfig = {
        mappings: currentMappings,
      };

      await fieldMappingService.saveMapping(config, processId);
      return true;
    } catch (err) {
      console.error('[useFieldMapping] Error saving mapping:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to save field mapping'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [canSave, currentMappings, processId]);

  // Reset to initial state
  const reset = useCallback(() => {
    setCurrentMappings(initialMappings);
    setValidationResults({});
    setError(null);
  }, [initialMappings]);

  return {
    availableFields,
    currentMappings,
    validationResults,
    canSave,
    isLoading,
    isSaving,
    error,
    selectField,
    saveMapping,
    reset,
  };
}

export default useFieldMapping;
