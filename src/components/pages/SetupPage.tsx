/**
 * SetupPage
 * Page component for the setup wizard
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAptabase } from '@aptabase/react';
import { SetupWizard } from '@/components/organisms/SetupWizard';

export function SetupPage() {
  const navigate = useNavigate();
  const { trackEvent } = useAptabase();

  // Track page view
  useEffect(() => {
    trackEvent('page_viewed', { page: 'setup' });
  }, [trackEvent]);

  const handleComplete = () => {
    trackEvent('setup_completed');
    // Navigate to the main hub page
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface">
      <SetupWizard onComplete={handleComplete} />
    </div>
  );
}

export default SetupPage;
