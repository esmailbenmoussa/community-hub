import { useState, useEffect } from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import type { IUserContext } from 'azure-devops-extension-sdk';
import type { AzureDevOpsContext } from '@/types';
import { isDevMode } from '@/utils/environment';
import { mockUser, mockHostName, mockProjectName } from '@/mocks';

/**
 * Hook to access Azure DevOps SDK context
 * Provides user info, host info, and SDK ready state
 * In dev mode, returns mock context immediately
 */
export const useAzureDevOps = (): AzureDevOpsContext => {
  const [isReady, setIsReady] = useState(isDevMode()); // Ready immediately in dev mode
  const [user, setUser] = useState<IUserContext | null>(
    isDevMode() ? (mockUser as IUserContext) : null
  );
  const [hostName, setHostName] = useState<string>(
    isDevMode() ? mockHostName : ''
  );
  const [projectName, setProjectName] = useState<string>(
    isDevMode() ? mockProjectName : ''
  );

  useEffect(() => {
    // Skip SDK initialization in dev mode
    if (isDevMode()) {
      console.log('[Dev] Using mock Azure DevOps context');
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      try {
        // Wait for SDK to be ready (with timeout)
        const readyPromise = SDK.ready();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('SDK ready timeout')), 5000);
        });

        await Promise.race([readyPromise, timeoutPromise]);

        if (!isMounted) return;

        // Get user context
        try {
          const userContext = SDK.getUser();
          setUser(userContext);
        } catch (e) {
          console.warn('Could not get user context:', e);
        }

        // Get host context
        try {
          const hostContext = SDK.getHost();
          setHostName(hostContext.name);
        } catch (e) {
          console.warn('Could not get host context:', e);
        }

        // Get project name from web context
        try {
          const webContext = SDK.getWebContext();
          setProjectName(webContext.project?.name || '');
        } catch (e) {
          console.warn('Could not get project context:', e);
        }

        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Error initializing Azure DevOps context:', error);
        if (isMounted) {
          setIsReady(true); // Still set ready to allow app to render
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isReady,
    user,
    hostName,
    projectName,
  };
};
