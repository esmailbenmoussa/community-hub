import { useEffect } from 'react';
import { motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  /** Unique identifier */
  id: string;
  /** Toast type determines styling */
  type: ToastType;
  /** Message to display */
  message: string;
  /** Auto-dismiss duration in ms */
  duration: number;
  /** Callback when toast should be dismissed */
  onDismiss: (id: string) => void;
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-state-success-bg border-state-success text-state-success',
  error: 'bg-state-error-bg border-state-error text-state-error',
  warning: 'bg-state-warning-bg border-state-warning text-state-warning',
  info: 'bg-state-info-bg border-state-info text-state-info',
};

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

/**
 * Individual toast notification component
 */
export function Toast({ id, type, message, duration, onDismiss }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 rounded-ado border-l-4 px-4 py-3 shadow-ado ${toastStyles[type]}`}
      role="alert"
    >
      <span className="flex-shrink-0 text-lg font-bold">
        {toastIcons[type]}
      </span>
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
}
