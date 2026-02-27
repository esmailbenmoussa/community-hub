import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { addToastAtom, removeToastAtom } from '@/store/toastAtoms';
import { ToastType } from '@/components/atoms/Toast';

interface UseToastReturn {
  /** Show a success toast */
  showSuccess: (message: string, duration?: number) => void;
  /** Show an error toast */
  showError: (message: string, duration?: number) => void;
  /** Show a warning toast */
  showWarning: (message: string, duration?: number) => void;
  /** Show an info toast */
  showInfo: (message: string, duration?: number) => void;
  /** Show a toast with custom type */
  showToast: (type: ToastType, message: string, duration?: number) => void;
  /** Dismiss a toast by ID */
  dismissToast: (id: string) => void;
}

/**
 * Hook for displaying toast notifications
 *
 * @example
 * const { showSuccess, showError } = useToast();
 * showSuccess('Changes saved!');
 * showError('Failed to save changes. Please try again.');
 */
export const useToast = (): UseToastReturn => {
  const addToast = useSetAtom(addToastAtom);
  const removeToast = useSetAtom(removeToastAtom);

  const showToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      addToast({ type, message, duration });
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast('success', message, duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast('error', message, duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast('warning', message, duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast('info', message, duration);
    },
    [showToast]
  );

  const dismissToast = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    dismissToast,
  };
};
