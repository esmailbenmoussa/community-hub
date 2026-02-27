import { useAtomValue, useSetAtom } from 'jotai';
import { AnimatePresence } from 'framer-motion';
import { Toast } from '@/components/atoms/Toast';
import { toastsAtom, removeToastAtom } from '@/store/toastAtoms';

/**
 * Container for displaying toast notifications
 * Renders in a fixed position at the top-right of the viewport
 */
export function ToastContainer() {
  const toasts = useAtomValue(toastsAtom);
  const removeToast = useSetAtom(removeToastAtom);

  return (
    <div
      className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onDismiss={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
