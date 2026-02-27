import { atom } from 'jotai';
import { ToastType } from '@/components/atoms/Toast';

export interface ToastItem {
  /** Unique identifier */
  id: string;
  /** Toast type */
  type: ToastType;
  /** Message to display */
  message: string;
  /** Auto-dismiss duration in ms */
  duration: number;
}

/**
 * Atom for storing active toasts
 */
export const toastsAtom = atom<ToastItem[]>([]);

/**
 * Generate unique ID for toast
 */
let toastIdCounter = 0;
const generateToastId = (): string => {
  toastIdCounter += 1;
  return `toast-${Date.now()}-${toastIdCounter}`;
};

/**
 * Default durations for different toast types
 */
const defaultDurations: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 4000,
};

/**
 * Write atom to add a new toast
 */
export const addToastAtom = atom(
  null,
  (
    get,
    set,
    toast: { type: ToastType; message: string; duration?: number }
  ) => {
    const newToast: ToastItem = {
      id: generateToastId(),
      type: toast.type,
      message: toast.message,
      duration: toast.duration ?? defaultDurations[toast.type],
    };

    const currentToasts = get(toastsAtom);
    // Limit to 5 toasts max, remove oldest if necessary
    const updatedToasts =
      currentToasts.length >= 5
        ? [...currentToasts.slice(1), newToast]
        : [...currentToasts, newToast];

    set(toastsAtom, updatedToasts);
    return newToast.id;
  }
);

/**
 * Write atom to remove a toast by ID
 */
export const removeToastAtom = atom(null, (get, set, id: string) => {
  const currentToasts = get(toastsAtom);
  set(
    toastsAtom,
    currentToasts.filter((toast) => toast.id !== id)
  );
});
