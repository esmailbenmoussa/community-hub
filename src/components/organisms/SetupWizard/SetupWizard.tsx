/**
 * SetupWizard Component
 * Guides users through the setup validation process for Community Hub
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SetupStatus,
  ValidationCheckStatus,
  ValidationCheck,
  REQUIRED_DISCUSSION_FIELDS,
  DISCUSSION_WORK_ITEM_TYPE,
} from '@/types';
import { useSetup } from '@/hooks/useSetup';
import { useFieldMapping } from '@/hooks/useFieldMapping';
import { useAzureDevOps } from '@/hooks/useAzureDevOps';
import { FieldMappingWizard } from '@/components/organisms/FieldMappingWizard';

interface SetupWizardProps {
  /** Callback when setup is complete */
  onComplete?: () => void;
  /** Callback when user wants to skip (if allowed) */
  onSkip?: () => void;
}

/**
 * Status icon component
 */
function StatusIcon({ status }: { status: ValidationCheckStatus }) {
  switch (status) {
    case ValidationCheckStatus.Passed:
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-state-success-bg text-state-success">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      );
    case ValidationCheckStatus.Failed:
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-state-error-bg text-state-error">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      );
    case ValidationCheckStatus.Checking:
      return (
        <span className="flex h-6 w-6 items-center justify-center">
          <svg
            className="h-5 w-5 animate-spin text-accent"
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
        </span>
      );
    case ValidationCheckStatus.Warning:
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-state-warning-bg text-state-warning">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </span>
      );
    default:
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border text-content-secondary">
          <span className="h-2 w-2 rounded-full bg-content-disabled" />
        </span>
      );
  }
}

/**
 * Validation check row component
 */
function ValidationCheckRow({
  check,
  hostName,
}: {
  check: ValidationCheck;
  hostName?: string;
}) {
  const showProcessSettingsLink =
    check.id === 'process-template' &&
    check.status === ValidationCheckStatus.Failed &&
    hostName;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 py-2"
    >
      <StatusIcon status={check.status} />
      <div className="flex-1">
        <div className="font-medium text-content">{check.name}</div>
        <div className="text-sm text-content-secondary">
          {check.description}
        </div>
        {check.message && (
          <div
            className={`mt-1 text-sm ${
              check.status === ValidationCheckStatus.Failed
                ? 'text-state-error'
                : check.status === ValidationCheckStatus.Passed
                  ? 'text-state-success'
                  : 'text-content-secondary'
            }`}
          >
            {check.message}
          </div>
        )}
        {showProcessSettingsLink && (
          <a
            href={`https://dev.azure.com/${hostName}/_settings/process`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary mt-2 inline-flex items-center gap-1 text-sm hover:underline"
          >
            Open Process Settings
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
        {check.details && (
          <div className="mt-1 rounded bg-surface-secondary p-2 text-sm text-content-secondary">
            {check.details}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Setup instructions component
 */
function SetupInstructions() {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <h3 className="mb-3 font-semibold text-content">Setup Instructions</h3>
      <p className="mb-4 text-sm text-content-secondary">
        To use Community Hub, an administrator needs to configure the
        project&apos;s process template. Follow these steps:
      </p>

      <ol className="list-inside list-decimal space-y-3 text-sm text-content-secondary">
        <li>
          <strong className="text-content">Create an inherited process</strong>
          <p className="ml-5 mt-1">
            Go to Organization Settings → Process → Create inherited process
            from Agile, Scrum, or Basic.
          </p>
        </li>
        <li>
          <strong className="text-content">
            Add Discussion Work Item Type
          </strong>
          <p className="ml-5 mt-1">
            In your inherited process, click &quot;+ New work item type&quot;
            and name it &quot;{DISCUSSION_WORK_ITEM_TYPE}&quot;.
          </p>
        </li>
        <li>
          <strong className="text-content">Add required custom fields</strong>
          <p className="ml-5 mt-1">
            Add the following fields to the Discussion work item type:
          </p>
          <ul className="ml-5 mt-2 space-y-1">
            {REQUIRED_DISCUSSION_FIELDS.map((field) => (
              <li key={field.referenceName} className="flex items-center gap-2">
                <code className="rounded bg-surface-tertiary px-1 text-xs">
                  {field.referenceName}
                </code>
                <span className="text-content-disabled">-</span>
                <span>{field.description}</span>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <strong className="text-content">Apply process to project</strong>
          <p className="ml-5 mt-1">
            Go to Organization Settings → Process → Your process → Projects, and
            change this project to use your inherited process.
          </p>
        </li>
      </ol>
    </div>
  );
}

/**
 * SetupWizard main component
 */
export function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const { status, validationResult, isValidating, error, validate } =
    useSetup();
  const { hostName } = useAzureDevOps();

  // Track if we're showing the field mapping wizard
  const [showFieldMapping, setShowFieldMapping] = useState(false);

  // Get process info for field mapping
  const processId = validationResult?.processId || '';
  const witRefName = validationResult?.witReferenceName || '';

  // Field mapping hook (only active when we need field mapping)
  const fieldMapping = useFieldMapping({
    processId,
    witRefName,
  });

  // Auto-run validation on mount
  useEffect(() => {
    if (status === SetupStatus.Unknown) {
      validate();
    }
  }, [status, validate]);

  // Show field mapping wizard when status is NeedsFieldMapping
  useEffect(() => {
    if (status === SetupStatus.NeedsFieldMapping) {
      setShowFieldMapping(true);
    }
  }, [status]);

  // Call onComplete when setup is complete
  useEffect(() => {
    if (status === SetupStatus.Complete && onComplete) {
      onComplete();
    }
  }, [status, onComplete]);

  // Handle field mapping save
  const handleFieldMappingSave = async () => {
    const success = await fieldMapping.saveMapping();
    if (success) {
      setShowFieldMapping(false);
      // Re-run validation to confirm everything is set up
      await validate();
    }
  };

  // Handle field mapping cancel
  const handleFieldMappingCancel = () => {
    setShowFieldMapping(false);
    fieldMapping.reset();
  };

  // Render field mapping wizard if needed
  if (showFieldMapping && processId) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
              <svg
                className="h-8 w-8 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-content">
            Community Hub Setup
          </h1>
          <p className="mt-2 text-content-secondary">
            Configure field mapping to complete setup.
          </p>
        </div>

        {/* Loading state */}
        {fieldMapping.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="h-8 w-8 animate-spin text-accent"
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
            <span className="ml-3 text-content-secondary">
              Loading available fields...
            </span>
          </div>
        ) : (
          <FieldMappingWizard
            availableFields={fieldMapping.availableFields}
            currentMappings={fieldMapping.currentMappings}
            validationResults={fieldMapping.validationResults}
            onFieldSelect={fieldMapping.selectField}
            onSave={handleFieldMappingSave}
            onCancel={handleFieldMappingCancel}
            isSaving={fieldMapping.isSaving}
            saveError={fieldMapping.error}
            canSave={fieldMapping.canSave}
          />
        )}

        {/* Process info */}
        {validationResult?.processName && (
          <div className="mt-6 text-center text-sm text-content-disabled">
            Process: {validationResult.processName}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
            <svg
              className="h-8 w-8 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-content">Community Hub Setup</h1>
        <p className="mt-2 text-content-secondary">
          Let&apos;s make sure your project is configured correctly.
        </p>
      </div>

      {/* Status indicator */}
      <AnimatePresence mode="wait">
        {status === SetupStatus.Validating && (
          <motion.div
            key="validating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-lg border border-accent bg-accent-light p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5 animate-spin text-accent"
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
              <span className="font-medium text-accent">
                Validating configuration...
              </span>
            </div>
          </motion.div>
        )}

        {status === SetupStatus.Complete && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-lg border border-state-success bg-state-success-bg p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-6 w-6 text-state-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-state-success">
                Setup complete! Community Hub is ready to use.
              </span>
            </div>
          </motion.div>
        )}

        {status === SetupStatus.Incomplete && (
          <motion.div
            key="incomplete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-lg border border-state-warning bg-state-warning-bg p-4"
          >
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-state-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <span className="font-medium text-state-warning">
                  Configuration incomplete
                </span>
                <p className="mt-1 text-sm text-content-secondary">
                  Some required configuration is missing. Please follow the
                  setup instructions below.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {status === SetupStatus.NeedsFieldMapping && !showFieldMapping && (
          <motion.div
            key="needs-field-mapping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-lg border border-accent bg-accent-light p-4"
          >
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <span className="font-medium text-accent">
                  Field mapping required
                </span>
                <p className="mt-1 text-sm text-content-secondary">
                  Custom fields were found but could not be automatically
                  mapped. Please configure the field mapping to continue.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {status === SetupStatus.Error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-lg border border-state-error bg-state-error-bg p-4"
          >
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-state-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <span className="font-medium text-state-error">
                  Validation error
                </span>
                <p className="mt-1 text-sm text-content-secondary">
                  {error ||
                    'An error occurred while validating the configuration.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation checks */}
      {validationResult && (
        <div className="mb-6 rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-4 font-semibold text-content">Validation Checks</h2>
          <div className="space-y-1">
            {validationResult.checks.map((check) => (
              <ValidationCheckRow
                key={check.id}
                check={check}
                hostName={hostName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Setup instructions (show when incomplete) */}
      {status === SetupStatus.Incomplete && <SetupInstructions />}

      {/* Actions */}
      <div className="mt-6 flex justify-center gap-3">
        {(status === SetupStatus.Incomplete ||
          status === SetupStatus.Error) && (
          <button
            onClick={() => validate()}
            disabled={isValidating}
            className="rounded-ado bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isValidating ? 'Validating...' : 'Re-run Validation'}
          </button>
        )}

        {status === SetupStatus.NeedsFieldMapping && !showFieldMapping && (
          <button
            onClick={() => setShowFieldMapping(true)}
            className="rounded-ado bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Configure Field Mapping
          </button>
        )}

        {status === SetupStatus.Complete && onComplete && (
          <button
            onClick={onComplete}
            className="rounded-ado bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Get Started
          </button>
        )}

        {onSkip && status !== SetupStatus.Complete && (
          <button
            onClick={onSkip}
            className="rounded-ado border border-border bg-surface px-4 py-2 font-medium text-content-secondary transition-colors hover:bg-surface-hover"
          >
            Skip for now
          </button>
        )}
      </div>

      {/* Process info */}
      {validationResult?.processName && (
        <div className="mt-6 text-center text-sm text-content-disabled">
          Process: {validationResult.processName}
        </div>
      )}
    </div>
  );
}

export default SetupWizard;
