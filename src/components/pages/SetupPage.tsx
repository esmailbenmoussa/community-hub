/**
 * SetupPage
 * Page component for the setup wizard
 */

import { useNavigate } from 'react-router-dom';
import { SetupWizard } from '@/components/organisms/SetupWizard';

export function SetupPage() {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Navigate to the main hub page
    navigate('/');
  };

  const handleSkip = () => {
    // For now, just go to the main page
    // In production, you might want to store that user skipped setup
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface">
      <SetupWizard onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  );
}

export default SetupPage;
