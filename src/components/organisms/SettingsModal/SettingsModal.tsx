/**
 * SettingsModal
 * Modal for extension settings including field mapping, cache, and about info.
 * Features a two-view system: main settings view and inline field mapping wizard.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom, useAtomValue } from 'jotai';
import { version } from '../../../../vss-extension.json';
import { validationService } from '@/services/validation.service';
import { categorySettingsService } from '@/services/categorySettings.service';
import { useFieldMapping } from '@/hooks/useFieldMapping';
import { FieldMappingWizard } from '@/components/organisms/FieldMappingWizard/FieldMappingWizard';
import { Select, SelectOption } from '@/components/atoms/Select';
import { CategorySettingsRow } from '@/components/molecules/CategorySettingsRow';
import {
  categorySettingsAtom,
  categorySettingsLoadedAtom,
  availableCategoriesAtom,
} from '@/store/categorySettingsAtom';
import {
  PAGE_SIZE_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_CATEGORIES,
  CategoryValue,
  CategorySettings,
  CategorySetting,
} from '@/types';
import { getCategorySetting } from '@/types/categorySettings';

/** View state for the modal */
type SettingsView = 'settings' | 'fieldMapping';

/** Setup data needed for field mapping */
interface SetupData {
  processId: string;
  witReferenceName: string;
}

interface SettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when settings that affect the main view are changed */
  onSettingsChange?: () => void;
}

/**
 * Inner component that renders the field mapping wizard with hook data
 */
function FieldMappingView({
  processId,
  witRefName,
  onSave,
  onCancel,
}: {
  processId: string;
  witRefName: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const {
    availableFields,
    currentMappings,
    validationResults,
    canSave,
    isLoading,
    isSaving,
    error,
    selectField,
    saveMapping,
  } = useFieldMapping({
    processId,
    witRefName,
  });

  const handleSave = useCallback(async () => {
    const success = await saveMapping();
    if (success) {
      onSave();
    }
  }, [saveMapping, onSave]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="border-brand mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-sm text-content-secondary">Loading fields...</p>
        </div>
      </div>
    );
  }

  return (
    <FieldMappingWizard
      availableFields={availableFields}
      currentMappings={currentMappings}
      validationResults={validationResults}
      onFieldSelect={selectField}
      onSave={handleSave}
      onCancel={onCancel}
      isSaving={isSaving}
      saveError={error}
      canSave={canSave}
    />
  );
}

/**
 * SettingsModal component
 */
export function SettingsModal({
  isOpen,
  onClose,
  onSettingsChange,
}: SettingsModalProps) {
  const [view, setView] = useState<SettingsView>('settings');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [loadingSetupData, setLoadingSetupData] = useState(false);
  const [setupDataError, setSetupDataError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_USER_PREFERENCES.pageSize);
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  // Category settings state
  const [globalCategorySettings, setGlobalCategorySettings] =
    useAtom(categorySettingsAtom);
  const [categorySettingsLoaded, setCategorySettingsLoaded] = useAtom(
    categorySettingsLoadedAtom
  );
  // Available categories from ADO picklist (or default to built-in categories)
  const availableCategories = useAtomValue(availableCategoriesAtom);
  const categoriesToShow =
    availableCategories.length > 0 ? availableCategories : DEFAULT_CATEGORIES;

  const [localCategorySettings, setLocalCategorySettings] =
    useState<CategorySettings>(globalCategorySettings);
  const [savingCategorySettings, setSavingCategorySettings] = useState(false);
  const [categorySettingsSaved, setCategorySettingsSaved] = useState(false);

  // Check if category settings have unsaved changes
  const hasCategoryChanges =
    JSON.stringify(localCategorySettings) !==
    JSON.stringify(globalCategorySettings);

  // Page size options for the dropdown
  const pageSizeOptions: SelectOption[] = PAGE_SIZE_OPTIONS.map((size) => ({
    value: String(size),
    label: String(size),
  }));

  // Load user preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingPreferences(true);
      validationService.loadUserPreferences().then((prefs) => {
        setPageSize(prefs.pageSize);
        setLoadingPreferences(false);
      });
    }
  }, [isOpen]);

  // Load category settings when modal opens (if not already loaded)
  useEffect(() => {
    if (isOpen && !categorySettingsLoaded) {
      categorySettingsService.loadSettings().then((settings) => {
        setGlobalCategorySettings(settings);
        setLocalCategorySettings(settings);
        setCategorySettingsLoaded(true);
      });
    } else if (isOpen) {
      // Sync local settings with global when modal opens
      setLocalCategorySettings(globalCategorySettings);
    }
  }, [
    isOpen,
    categorySettingsLoaded,
    globalCategorySettings,
    setGlobalCategorySettings,
    setCategorySettingsLoaded,
  ]);

  // Reset view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setView('settings');
      setSetupData(null);
      setSetupDataError(null);
      setCategorySettingsSaved(false);
    }
  }, [isOpen]);

  // Load setup data when entering field mapping view
  const loadSetupData = useCallback(async () => {
    setLoadingSetupData(true);
    setSetupDataError(null);

    try {
      const status = await validationService.loadSetupStatus();

      if (!status) {
        setSetupDataError(
          'No setup data found. Please run the setup wizard first.'
        );
        return;
      }

      if (!status.processId) {
        setSetupDataError(
          'Process ID not found. Please run the setup wizard again.'
        );
        return;
      }

      // Use stored witReferenceName, or fall back to default pattern
      const witRefName = status.witReferenceName || 'Custom.Discussion';

      setSetupData({
        processId: status.processId,
        witReferenceName: witRefName,
      });
      setView('fieldMapping');
    } catch (err) {
      console.error('[SettingsModal] Error loading setup data:', err);
      setSetupDataError(
        err instanceof Error ? err.message : 'Failed to load setup data'
      );
    } finally {
      setLoadingSetupData(false);
    }
  }, []);

  // Handle reconfigure button click
  const handleReconfigure = useCallback(() => {
    loadSetupData();
  }, [loadSetupData]);

  // Handle back to settings
  const handleBackToSettings = useCallback(() => {
    setView('settings');
    setSetupData(null);
    setSetupDataError(null);
  }, []);

  // Handle field mapping save success
  const handleFieldMappingSaved = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle clear cache
  const handleClearCache = useCallback(() => {
    // Clear extension-related localStorage items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('community-hub-') || key.startsWith('ado-extension-'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Show confirmation
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback(
    async (e: { target: { value: string } }) => {
      const newSize = parseInt(e.target.value, 10);
      setPageSize(newSize);

      try {
        await validationService.saveUserPreferences({ pageSize: newSize });
        onSettingsChange?.();
      } catch (err) {
        console.error('[SettingsModal] Error saving page size:', err);
      }
    },
    [onSettingsChange]
  );

  // Handle category setting change
  const handleCategorySettingChange = useCallback(
    (category: CategoryValue, setting: CategorySetting) => {
      setLocalCategorySettings((prev) => ({
        ...prev,
        [category]: setting,
      }));
      setCategorySettingsSaved(false);
    },
    []
  );

  // Handle save category settings
  const handleSaveCategorySettings = useCallback(async () => {
    setSavingCategorySettings(true);
    try {
      await categorySettingsService.saveSettings(localCategorySettings);
      setGlobalCategorySettings(localCategorySettings);
      setCategorySettingsSaved(true);
      setTimeout(() => setCategorySettingsSaved(false), 3000);
      onSettingsChange?.();
    } catch (err) {
      console.error('[SettingsModal] Error saving category settings:', err);
    } finally {
      setSavingCategorySettings(false);
    }
  }, [localCategorySettings, setGlobalCategorySettings, onSettingsChange]);

  // Dynamic modal width based on view
  const modalWidthClass = view === 'fieldMapping' ? 'max-w-3xl' : 'max-w-2xl';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed inset-0 z-50 m-auto flex max-h-[85vh] w-full flex-col ${modalWidthClass} rounded-ado bg-surface shadow-xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                {/* Back button (only in field mapping view) */}
                {view === 'fieldMapping' && (
                  <button
                    onClick={handleBackToSettings}
                    className="rounded-ado p-1 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
                    aria-label="Back to settings"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}
                <h2 className="text-lg font-semibold text-content">
                  {view === 'fieldMapping' ? 'Field Mapping' : 'Settings'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-ado p-1 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
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
            <AnimatePresence mode="wait">
              {view === 'settings' ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 space-y-6 overflow-y-auto p-6"
                >
                  {/* Field Mapping Section */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase text-content-disabled">
                      Field Mapping
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-content-secondary">
                        Reconfigure field mapping for discussions
                      </p>
                      <button
                        onClick={handleReconfigure}
                        disabled={loadingSetupData}
                        className="rounded-ado border border-border px-3 py-1.5 text-sm font-medium text-content transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingSetupData ? 'Loading...' : 'Reconfigure'}
                      </button>
                    </div>
                    {setupDataError && (
                      <p className="mt-2 text-xs text-red-600">
                        {setupDataError}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Display Section */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase text-content-disabled">
                      Display
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-content-secondary">
                        Discussions per page
                      </p>
                      {loadingPreferences ? (
                        <div className="h-9 w-20 animate-pulse rounded-ado bg-surface-tertiary" />
                      ) : (
                        <Select
                          options={pageSizeOptions}
                          value={String(pageSize)}
                          onChange={handlePageSizeChange}
                          className="w-20"
                        />
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Categories Section */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase text-content-disabled">
                      Categories
                    </h3>
                    <p className="mb-3 text-sm text-content-secondary">
                      Customize icons and colors for each category
                    </p>
                    <div className="space-y-2">
                      {categoriesToShow.map((category) => (
                        <CategorySettingsRow
                          key={category}
                          category={category}
                          setting={getCategorySetting(
                            category,
                            localCategorySettings
                          )}
                          onChange={(setting) =>
                            handleCategorySettingChange(category, setting)
                          }
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      {categorySettingsSaved && (
                        <span className="text-xs text-green-600">
                          Settings saved!
                        </span>
                      )}
                      <button
                        onClick={handleSaveCategorySettings}
                        disabled={!hasCategoryChanges || savingCategorySettings}
                        className="rounded-ado bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingCategorySettings
                          ? 'Saving...'
                          : 'Save Categories'}
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Data Section */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase text-content-disabled">
                      Data
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-content-secondary">
                          Clear cached data
                        </p>
                        {cacheCleared && (
                          <p className="mt-1 text-xs text-green-600">
                            Cache cleared!
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleClearCache}
                        className="rounded-ado border border-border px-3 py-1.5 text-sm font-medium text-content transition-colors hover:bg-surface-hover"
                      >
                        Clear Cache
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* About Section */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase text-content-disabled">
                      About
                    </h3>
                    <div>
                      <p className="text-sm font-medium text-content">
                        Community Hub Extension
                      </p>
                      <p className="text-xs text-content-secondary">
                        Version {version}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="fieldMapping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 overflow-y-auto p-6"
                >
                  {setupData ? (
                    <FieldMappingView
                      processId={setupData.processId}
                      witRefName={setupData.witReferenceName}
                      onSave={handleFieldMappingSaved}
                      onCancel={handleBackToSettings}
                    />
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-content-secondary">
                        Loading setup data...
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SettingsModal;
