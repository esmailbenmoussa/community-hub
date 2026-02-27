/**
 * HubPage
 * Main Community Hub page showing discussions list
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSetAtom } from 'jotai';
import {
  SetupStatus,
  SortOption,
  Category,
  DEFAULT_USER_PREFERENCES,
} from '@/types';
import { validationService } from '@/services/validation.service';
import { categorySettingsService } from '@/services/categorySettings.service';
import { useAzureDevOps } from '@/hooks/useAzureDevOps';
import { useDiscussions } from '@/hooks/useDiscussions';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { DiscussionList } from '@/components/organisms/DiscussionList';
import { Leaderboard } from '@/components/organisms/Leaderboard';
import { NavigationPanel } from '@/components/organisms/NavigationPanel';
import { SettingsModal } from '@/components/organisms/SettingsModal';
import { NewDiscussionModal } from '@/components/organisms/NewDiscussionModal';
import { Select, SelectOption } from '@/components/atoms/Select';
import {
  categorySettingsAtom,
  categorySettingsLoadedAtom,
} from '@/store/categorySettingsAtom';
import { version } from '../../../package.json';

export function HubPage() {
  const navigate = useNavigate();
  const { isReady, projectName, hostName, user } = useAzureDevOps();
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeaderboardDrawer, setShowLeaderboardDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [pageSize, setPageSize] = useState(DEFAULT_USER_PREFERENCES.pageSize);

  // Category settings atom setters
  const setCategorySettings = useSetAtom(categorySettingsAtom);
  const setCategorySettingsLoaded = useSetAtom(categorySettingsLoadedAtom);

  // Get discussions data
  const {
    discussions,
    votedIds,
    isLoading,
    error,
    page,
    totalPages,
    filters,
    goToPage,
    setCategory,
    setSort,
    toggleVote,
  } = useDiscussions({
    autoFetch: setupComplete,
    pageSize,
  });

  // Get leaderboard data
  const { leaderboard, isLoading: isLeaderboardLoading } = useLeaderboard({
    autoFetch: setupComplete,
  });

  // Sort options for the dropdown
  const sortOptions: SelectOption[] = [
    { value: SortOption.Newest, label: 'Newest' },
    { value: SortOption.TopVoted, label: 'Top voted' },
    { value: SortOption.MostActive, label: 'Most active' },
  ];

  // Check setup status on mount
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const status = await validationService.loadSetupStatus();
        if (!status || status.status !== SetupStatus.Complete) {
          // Redirect to setup page
          navigate('/setup');
        } else {
          setSetupComplete(true);
        }
      } catch (err) {
        console.error('Error checking setup status:', err);
        // If we can't check, redirect to setup
        navigate('/setup');
      } finally {
        setIsCheckingSetup(false);
      }
    };

    if (isReady) {
      checkSetup();
    }
  }, [isReady, navigate]);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await validationService.loadUserPreferences();
        setPageSize(prefs.pageSize);
      } catch (err) {
        console.error('Error loading user preferences:', err);
      }
    };

    if (isReady) {
      loadPreferences();
    }
  }, [isReady]);

  // Load category settings on mount
  useEffect(() => {
    const loadCategorySettings = async () => {
      try {
        const settings = await categorySettingsService.loadSettings();
        setCategorySettings(settings);
        setCategorySettingsLoaded(true);
      } catch (err) {
        console.error('Error loading category settings:', err);
      }
    };

    if (isReady) {
      loadCategorySettings();
    }
  }, [isReady, setCategorySettings, setCategorySettingsLoaded]);

  // Handle settings change (reload preferences and refresh)
  const handleSettingsChange = useCallback(async () => {
    try {
      const prefs = await validationService.loadUserPreferences();
      setPageSize(prefs.pageSize);
      // Refresh will happen automatically when pageSize changes due to useDiscussions dependency
    } catch (err) {
      console.error('Error reloading preferences:', err);
    }
  }, []);

  // Handle discussion click
  const handleDiscussionClick = useCallback(
    (discussionId: number) => {
      navigate(`/discussion/${discussionId}`);
    },
    [navigate]
  );

  // Handle new discussion button
  const handleNewDiscussion = useCallback(() => {
    setShowNewDiscussionModal(true);
  }, []);

  // Handle new discussion success
  const handleNewDiscussionSuccess = useCallback(
    (discussionId: number) => {
      navigate(`/discussion/${discussionId}`);
    },
    [navigate]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (e: { target: { value: string } }) => {
      setSort(e.target.value as SortOption);
    },
    [setSort]
  );

  // Filter discussions by search query (client-side for now)
  const filteredDiscussions = searchQuery
    ? discussions.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : discussions;

  // Sidebar category click handler
  const handleSidebarCategoryClick = useCallback(
    (category?: Category) => {
      setCategory(category);
    },
    [setCategory]
  );

  if (!isReady || isCheckingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
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
          </div>
          <p className="text-content-secondary">Loading Community Hub...</p>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    return null; // Will redirect to setup
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      {/* Header */}
      <header className="bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-content">Community Hub</h1>
            <p className="text-sm text-content-secondary">
              {projectName} · {hostName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                {user.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm text-content-secondary">
                  {user.displayName}
                </span>
              </div>
            )}
            <button
              onClick={handleNewDiscussion}
              className="rounded-ado bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              New Discussion
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 gap-6 overflow-y-auto p-6">
        {/* Left Panel - Navigation (hidden on smaller screens) */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <NavigationPanel
            selectedCategory={filters.category}
            onCategoryClick={handleSidebarCategoryClick}
          />
        </aside>

        {/* Center - Main content column with footer */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Discussion list */}
          <main className="flex-1">
            {/* Error banner */}
            {error && (
              <div className="mb-4 rounded-ado border border-red-300 bg-red-50 p-4 text-red-700">
                <p className="font-medium">Error loading discussions</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Filters and search */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select
                  options={sortOptions}
                  value={filters.sort}
                  onChange={handleSortChange}
                  placeholder="Sort by"
                  className="w-36"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 rounded-ado border border-border bg-surface px-3 py-2 pl-9 text-sm text-content placeholder:text-content-disabled focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-disabled"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="rounded-ado p-2 text-content-secondary hover:bg-surface-hover"
                  title="Settings"
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Discussion list */}
            <DiscussionList
              discussions={filteredDiscussions}
              votedIds={votedIds}
              onVote={toggleVote}
              onDiscussionClick={handleDiscussionClick}
              isLoading={isLoading}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              emptyMessage="No discussions yet. Be the first to start a conversation!"
            />
          </main>

          {/* Footer */}
          <footer className="py-4">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <div className="flex items-center gap-2">
                <span>Community Hub v{version}</span>
                <span>·</span>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-content hover:underline"
                >
                  Marketplace
                </a>
              </div>
              <span>© {new Date().getFullYear()} Repryl</span>
            </div>
          </footer>
        </div>

        {/* Right Panel - Leaderboard (hidden on smaller screens) */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <Leaderboard entries={leaderboard} isLoading={isLeaderboardLoading} />
        </aside>
      </div>

      {/* Mobile Leaderboard Toggle Button (shown on smaller screens) */}
      <button
        onClick={() => setShowLeaderboardDrawer(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-accent-hover lg:hidden"
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Leaderboard
      </button>

      {/* Slide-over Drawer for Mobile Leaderboard */}
      <AnimatePresence>
        {showLeaderboardDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaderboardDrawer(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-80 bg-surface shadow-xl lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-lg font-semibold text-content">
                  Leaderboard
                </h2>
                <button
                  onClick={() => setShowLeaderboardDrawer(false)}
                  className="rounded-ado p-1 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
                >
                  <svg
                    className="h-6 w-6"
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
              {/* Drawer Content */}
              <div className="p-4">
                <Leaderboard
                  entries={leaderboard}
                  isLoading={isLeaderboardLoading}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSettingsChange={handleSettingsChange}
      />

      {/* New Discussion Modal */}
      <NewDiscussionModal
        isOpen={showNewDiscussionModal}
        onClose={() => setShowNewDiscussionModal(false)}
        onSuccess={handleNewDiscussionSuccess}
      />
    </div>
  );
}

export default HubPage;
