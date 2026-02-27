/**
 * NewDiscussionModal
 * Modal for creating a new discussion
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateDiscussionInput } from '@/types';
import { discussionService } from '@/services/discussion.service';
import { NewDiscussionForm } from '@/components/organisms/NewDiscussionForm';

interface NewDiscussionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when discussion is created successfully */
  onSuccess?: (discussionId: number) => void;
}

/**
 * NewDiscussionModal component
 */
export function NewDiscussionModal({
  isOpen,
  onClose,
  onSuccess,
}: NewDiscussionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (input: CreateDiscussionInput) => {
      setIsSubmitting(true);
      setError(null);

      try {
        // Initialize service if needed
        await discussionService.initialize();

        // Create the discussion
        const discussion = await discussionService.create(input);

        // Reset state and close modal
        setIsSubmitting(false);
        setError(null);
        onClose();

        // Notify parent of success
        onSuccess?.(discussion.id);
      } catch (err) {
        console.error('Failed to create discussion:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to create discussion'
        );
        setIsSubmitting(false);
      }
    },
    [onClose, onSuccess]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 m-auto flex max-h-[85vh] w-full max-w-3xl flex-col rounded-ado bg-surface shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-content">
                Start a new discussion
              </h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-ado p-1 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content disabled:opacity-50"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
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
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Error banner */}
              {error && (
                <div className="mb-6 rounded-ado border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                  <p className="font-medium">Error creating discussion</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Form */}
              <NewDiscussionForm
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isSubmitting={isSubmitting}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NewDiscussionModal;
