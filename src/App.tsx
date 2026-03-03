import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAptabase } from '@aptabase/react';
import { HubPage } from './components/pages/HubPage';
import { SetupPage } from './components/pages/SetupPage';
import { DiscussionPage } from './components/pages/DiscussionPage';
import { OrgSettingsPage } from './components/pages/OrgSettingsPage';
import { ToastContainer } from './components/organisms/ToastContainer';
import { useTheme } from './hooks/useTheme';

/**
 * Check if we're in the organization admin view
 * The org admin hub uses ?view=org query parameter
 */
function isOrgAdminView(): boolean {
  return window.location.search.includes('view=org');
}

function App() {
  const { trackEvent } = useAptabase();
  const { isDark } = useTheme();

  // Track app startup
  useEffect(() => {
    trackEvent('app_started');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render org admin view if ?view=org is present
  if (isOrgAdminView()) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <OrgSettingsPage />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <BrowserRouter>
        <Routes>
          {/* Main hub page */}
          <Route path="/" element={<HubPage />} />

          {/* Setup wizard */}
          <Route path="/setup" element={<SetupPage />} />

          {/* Discussion detail */}
          <Route path="/discussion/:id" element={<DiscussionPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </div>
  );
}

export default App;
