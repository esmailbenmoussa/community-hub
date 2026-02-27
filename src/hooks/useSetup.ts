/**
 * useSetup Hook
 * Manages setup validation state and provides actions for the setup wizard
 */

import { useState, useCallback, useEffect } from 'react';
import { SetupStatus, ValidationResult } from '@/types';
import { validationService } from '@/services/validation.service';

interface UseSetupReturn {
  /** Current setup status */
  status: SetupStatus;
  /** Full validation result with all checks */
  validationResult: ValidationResult | null;
  /** Whether validation is currently running */
  isValidating: boolean;
  /** Error message if validation failed */
  error: string | null;
  /** Run validation */
  validate: () => Promise<void>;
  /** Reset to unknown state */
  reset: () => void;
}

/**
 * Hook for managing setup validation state
 */
export function useSetup(): UseSetupReturn {
  const [status, setStatus] = useState<SetupStatus>(SetupStatus.Unknown);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached setup status on mount
  useEffect(() => {
    const loadCachedStatus = async () => {
      try {
        const cached = await validationService.loadSetupStatus();
        if (cached) {
          setStatus(cached.status);
        }
      } catch (err) {
        console.error('[useSetup] Error loading cached status:', err);
      }
    };

    loadCachedStatus();
  }, []);

  const validate = useCallback(async () => {
    setIsValidating(true);
    setError(null);
    setStatus(SetupStatus.Validating);

    try {
      const result = await validationService.validate();
      setValidationResult(result);
      setStatus(result.status);

      // Save the result to Extension Data Service
      await validationService.saveSetupStatus(result);
    } catch (err) {
      setStatus(SetupStatus.Error);
      setError(err instanceof Error ? err.message : 'Validation failed');
      console.error('[useSetup] Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStatus(SetupStatus.Unknown);
    setValidationResult(null);
    setError(null);
  }, []);

  return {
    status,
    validationResult,
    isValidating,
    error,
    validate,
    reset,
  };
}
