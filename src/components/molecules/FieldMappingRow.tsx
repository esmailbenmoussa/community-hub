/**
 * FieldMappingRow Component
 * A single row in the field mapping wizard that shows:
 * - Field purpose label (e.g., "Category")
 * - Description
 * - Required/Optional badge
 * - Dropdown to select the ADO field
 * - Validation status indicator
 */

import { Select, SelectOption } from '@/components/atoms/Select';
import {
  FieldPurpose,
  DiscoveredField,
  FIELD_REQUIREMENTS,
  FieldValidationResult,
} from '@/types/fieldMapping';
import { FieldType } from '@/types/setup';

/**
 * Human-readable labels for field types
 */
const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  string: 'String',
  integer: 'Integer',
  double: 'Double',
  dateTime: 'Date/Time',
  boolean: 'Boolean',
  plainText: 'Plain Text',
  html: 'HTML',
  treePath: 'Tree Path',
  identity: 'Identity',
  picklistString: 'Picklist (String)',
  picklistInteger: 'Picklist (Integer)',
  picklistDouble: 'Picklist (Double)',
};

/**
 * Format an array of expected field types into a human-readable string.
 * e.g., ['string', 'picklistString'] -> "String or Picklist (String)"
 */
function formatExpectedTypes(types: FieldType[]): string {
  if (types.length === 0) return 'Any';
  if (types.length === 1) return FIELD_TYPE_LABELS[types[0]] || types[0];

  const labels = types.map((t) => FIELD_TYPE_LABELS[t] || t);

  // Join with commas and "or" for the last item
  if (labels.length === 2) {
    return `${labels[0]} or ${labels[1]}`;
  }

  const lastLabel = labels.pop();
  return `${labels.join(', ')}, or ${lastLabel}`;
}

interface FieldMappingRowProps {
  /** The semantic purpose to map */
  purpose: FieldPurpose;
  /** Available fields from the Discussion WIT */
  availableFields: DiscoveredField[];
  /** Currently selected field reference name (empty string if not selected) */
  selectedFieldRef: string;
  /** Callback when selection changes */
  onFieldSelect: (purpose: FieldPurpose, fieldRef: string) => void;
  /** Validation result for the current selection */
  validationResult?: FieldValidationResult;
  /** Whether this field is already mapped (for showing checkmark) */
  isMapped: boolean;
  /** Whether the row is disabled */
  disabled?: boolean;
}

/**
 * Status indicator component
 */
function StatusIndicator({
  validation,
  isMapped,
  isRequired,
  hasSelection,
}: {
  validation?: FieldValidationResult;
  isMapped: boolean;
  isRequired: boolean;
  hasSelection: boolean;
}) {
  // No selection yet
  if (!hasSelection) {
    if (isRequired) {
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-state-warning-bg text-state-warning">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      );
    }
    return (
      <span className="h-5 w-5 rounded-full border-2 border-border-strong" />
    );
  }

  // Has selection - check validation
  if (validation?.valid === false) {
    return (
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full bg-state-error-bg text-state-error"
        title={validation.error}
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  if (validation?.warning) {
    return (
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full bg-state-warning-bg text-state-warning"
        title={validation.warning}
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  // Valid selection
  if (isMapped || (validation?.valid && hasSelection)) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-state-success-bg text-state-success">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="h-5 w-5 rounded-full border-2 border-border-strong" />
  );
}

/**
 * FieldMappingRow component
 */
export function FieldMappingRow({
  purpose,
  availableFields,
  selectedFieldRef,
  onFieldSelect,
  validationResult,
  isMapped,
  disabled = false,
}: FieldMappingRowProps) {
  const requirement = FIELD_REQUIREMENTS[purpose];

  // Build dropdown options from available fields
  const options: SelectOption[] = availableFields.map((field) => ({
    label: field.name,
    value: field.referenceName,
  }));

  const hasSelection = selectedFieldRef !== '';

  return (
    <div className="flex items-start gap-4 rounded-ado border border-border bg-surface p-3 transition-colors hover:bg-surface-secondary">
      {/* Status indicator */}
      <div className="flex-shrink-0 pt-0.5">
        <StatusIndicator
          validation={validationResult}
          isMapped={isMapped}
          isRequired={requirement.isRequired}
          hasSelection={hasSelection}
        />
      </div>

      {/* Field info */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-content">
            {requirement.displayName}
          </span>
          {requirement.isRequired ? (
            <span className="rounded bg-state-error-bg px-1.5 py-0.5 text-xs font-medium text-state-error">
              Required
            </span>
          ) : (
            <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-xs font-medium text-content-secondary">
              Optional
            </span>
          )}
        </div>
        <p className="text-sm text-content-secondary">
          {requirement.description}
        </p>

        {/* Help text: expected type and suggested values */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-content-disabled">
          <span>
            <span className="font-medium">Type:</span>{' '}
            {formatExpectedTypes(requirement.expectedTypes)}
          </span>
          {requirement.suggestedValues &&
            requirement.suggestedValues.length > 0 && (
              <span>
                <span className="font-medium">Values:</span>{' '}
                {requirement.suggestedValues.join(', ')}
              </span>
            )}
        </div>

        {/* Validation error/warning message */}
        {validationResult?.error && (
          <p className="text-xs text-state-error">{validationResult.error}</p>
        )}
        {validationResult?.warning && (
          <p className="text-xs text-state-warning">
            {validationResult.warning}
          </p>
        )}
      </div>

      {/* Field selector */}
      <div className="w-56 flex-shrink-0">
        <Select
          options={options}
          value={selectedFieldRef}
          onChange={(e) => onFieldSelect(purpose, e.target.value)}
          placeholder="Select field..."
          disabled={disabled}
          error={validationResult?.valid === false ? ' ' : undefined}
        />
      </div>
    </div>
  );
}

export default FieldMappingRow;
