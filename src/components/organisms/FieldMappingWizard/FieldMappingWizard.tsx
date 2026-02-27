/**
 * FieldMappingWizard Component
 * Allows admins to manually map ADO fields to their semantic purposes
 * when auto-matching fails or when re-configuring field mappings.
 */

import { motion } from 'framer-motion';
import { FieldMappingRow } from '@/components/molecules/FieldMappingRow';
import {
  FieldPurpose,
  DiscoveredField,
  ALL_FIELD_PURPOSES,
  REQUIRED_FIELD_PURPOSES,
  FieldValidationResult,
} from '@/types/fieldMapping';

interface FieldMappingWizardProps {
  /** Available fields from the Discussion Work Item Type */
  availableFields: DiscoveredField[];
  /** Current mapping selections (purpose -> field reference name) */
  currentMappings: Partial<Record<FieldPurpose, string>>;
  /** Validation results for each purpose */
  validationResults: Partial<Record<FieldPurpose, FieldValidationResult>>;
  /** Callback when a field selection changes */
  onFieldSelect: (purpose: FieldPurpose, fieldRef: string) => void;
  /** Callback when user clicks Save */
  onSave: () => void;
  /** Callback when user clicks Cancel */
  onCancel?: () => void;
  /** Whether the wizard is in a saving state */
  isSaving?: boolean;
  /** Error message from save attempt */
  saveError?: string | null;
  /** Whether all required fields are validly mapped */
  canSave: boolean;
}

/**
 * FieldMappingWizard main component
 */
export function FieldMappingWizard({
  availableFields,
  currentMappings,
  validationResults,
  onFieldSelect,
  onSave,
  onCancel,
  isSaving = false,
  saveError,
  canSave,
}: FieldMappingWizardProps) {
  // Count mapped fields
  const requiredMapped = REQUIRED_FIELD_PURPOSES.filter(
    (p) => currentMappings[p] && validationResults[p]?.valid !== false
  ).length;
  const optionalMapped = ALL_FIELD_PURPOSES.filter(
    (p) =>
      !REQUIRED_FIELD_PURPOSES.includes(p) &&
      currentMappings[p] &&
      validationResults[p]?.valid !== false
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-content">
          Configure Field Mapping
        </h2>
        <p className="mt-2 text-sm text-content-secondary">
          Community Hub needs to know which Azure DevOps fields to use for each
          purpose. Map the fields below to enable discussions in this project.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-6 rounded-lg border border-border bg-surface-secondary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-content">
                {requiredMapped}/{REQUIRED_FIELD_PURPOSES.length}
              </div>
              <div className="text-xs text-content-secondary">
                Required fields
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-content-secondary">
                {optionalMapped}/
                {ALL_FIELD_PURPOSES.length - REQUIRED_FIELD_PURPOSES.length}
              </div>
              <div className="text-xs text-content-secondary">
                Optional fields
              </div>
            </div>
          </div>
          {canSave && (
            <div className="flex items-center gap-2 text-state-success">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Ready to save</span>
            </div>
          )}
        </div>
      </div>

      {/* Field mapping rows */}
      <div className="space-y-3">
        {ALL_FIELD_PURPOSES.map((purpose) => (
          <FieldMappingRow
            key={purpose}
            purpose={purpose}
            availableFields={availableFields}
            selectedFieldRef={currentMappings[purpose] || ''}
            onFieldSelect={onFieldSelect}
            validationResult={validationResults[purpose]}
            isMapped={
              !!currentMappings[purpose] &&
              validationResults[purpose]?.valid !== false
            }
            disabled={isSaving}
          />
        ))}
      </div>

      {/* Error message */}
      {saveError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-ado border border-state-error bg-state-error-bg p-3 text-sm text-state-error"
        >
          {saveError}
        </motion.div>
      )}

      {/* Help text */}
      <div className="mt-6 rounded-lg border border-border bg-surface-secondary p-4">
        <h3 className="mb-2 text-sm font-medium text-content">
          About Field Mapping
        </h3>
        <ul className="space-y-1 text-sm text-content-secondary">
          <li>
            <strong className="text-content">Required fields</strong> must be
            mapped for Community Hub to function.
          </li>
          <li>
            <strong className="text-content">Optional fields</strong> enhance
            functionality but can be skipped.
          </li>
          <li>
            Only custom fields from your Discussion work item type are shown.
          </li>
          <li>You can reconfigure this mapping later from the Hub settings.</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-ado border border-border bg-surface px-4 py-2 font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="rounded-ado bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default FieldMappingWizard;
