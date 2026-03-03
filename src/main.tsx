import React from 'react';
import ReactDOM from 'react-dom/client';
import { AptabaseProvider } from '@aptabase/react';
import App from './App';
import './styles/index.css';
import { isDevMode } from '@/utils/environment';
import { initializeServices } from '@/services';

// Injected by Vite from vss-extension.json
declare const __APP_VERSION__: string;

// Aptabase analytics key (https://aptabase.com)
const APTABASE_KEY = 'A-EU-6044748787';

// Render the app
const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <AptabaseProvider
          appKey={APTABASE_KEY}
          options={{ appVersion: __APP_VERSION__ }}
        >
          <App />
        </AptabaseProvider>
      </React.StrictMode>
    );
  }
};

// Bootstrap the application
// 1. Initialize SDK (production only) - must happen before services
// 2. Initialize services (mock or real based on environment)
// 3. Render the app
async function bootstrap() {
  try {
    if (isDevMode()) {
      console.log('Running in DEV MODE with mock services');
      console.log('   Mock data will be used instead of Azure DevOps APIs');
      await initializeServices();
      renderApp();
    } else {
      // Production: Initialize SDK first (required for ADO API calls)
      // Dynamic import to ensure AMD modules are properly handled
      const SDK = await import('azure-devops-extension-sdk');

      // Wait for SDK init with a timeout fallback
      // Enable applyTheme to sync with ADO host theme
      const sdkInitPromise = SDK.init({ applyTheme: true });
      const initTimeout = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn('SDK init timed out after 3 seconds, continuing anyway');
          resolve();
        }, 3000);
      });

      await Promise.race([sdkInitPromise, initTimeout]);
      console.log('[Bootstrap] SDK initialized');

      // Now load services (which depend on SDK being ready)
      await initializeServices();
      console.log('[Bootstrap] Services initialized, rendering app...');
      renderApp();
    }
  } catch (error) {
    console.error('Bootstrap failed:', error);
    // Still try to render the app on error
    renderApp();
  }
}

// Start the application
bootstrap();
