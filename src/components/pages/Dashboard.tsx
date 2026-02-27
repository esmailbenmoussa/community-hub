import { useToast } from '@/hooks/useToast';

/**
 * Main Dashboard page component
 * This is the entry point for the Azure DevOps extension
 */
export function Dashboard() {
  const { showSuccess, showInfo } = useToast();

  const handleTestToast = () => {
    showSuccess('Extension is working correctly!');
  };

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-content">
            Azure DevOps Extension
          </h1>
          <p className="mt-2 text-content-secondary">
            Your extension template is ready. Start building your features!
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Getting Started Card */}
          <section className="rounded-ado border border-border bg-surface-secondary p-6 shadow-ado">
            <h2 className="mb-4 text-lg font-medium text-content">
              Getting Started
            </h2>
            <ul className="space-y-3 text-content-secondary">
              <li className="flex items-start gap-2">
                <span className="text-state-success">✓</span>
                <span>React 18 with TypeScript configured</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-state-success">✓</span>
                <span>Tailwind CSS with Azure DevOps theme colors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-state-success">✓</span>
                <span>Jotai for state management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-state-success">✓</span>
                <span>Framer Motion for animations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-state-success">✓</span>
                <span>Azure DevOps SDK integration ready</span>
              </li>
            </ul>
          </section>

          {/* Test Section */}
          <section className="rounded-ado border border-border bg-surface-secondary p-6 shadow-ado">
            <h2 className="mb-4 text-lg font-medium text-content">
              Test Components
            </h2>
            <div className="flex gap-3">
              <button
                onClick={handleTestToast}
                className="rounded-ado bg-accent px-4 py-2 text-sm font-medium text-content-inverse transition-colors hover:bg-accent-hover"
              >
                Show Toast
              </button>
              <button
                onClick={() => showInfo('This is an info message')}
                className="rounded-ado border border-border bg-surface px-4 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-hover"
              >
                Show Info
              </button>
            </div>
          </section>

          {/* Next Steps */}
          <section className="rounded-ado border border-border bg-surface-secondary p-6 shadow-ado">
            <h2 className="mb-4 text-lg font-medium text-content">
              Next Steps
            </h2>
            <ol className="list-inside list-decimal space-y-2 text-content-secondary">
              <li>
                Update{' '}
                <code className="rounded bg-surface-tertiary px-1.5 py-0.5 text-sm">
                  vss-extension.json
                </code>{' '}
                with your extension details
              </li>
              <li>
                Build your components in the{' '}
                <code className="rounded bg-surface-tertiary px-1.5 py-0.5 text-sm">
                  src/components
                </code>{' '}
                directory
              </li>
              <li>Add Azure DevOps API calls using the SDK</li>
              <li>
                Run{' '}
                <code className="rounded bg-surface-tertiary px-1.5 py-0.5 text-sm">
                  npm run package
                </code>{' '}
                to create your extension
              </li>
            </ol>
          </section>
        </main>
      </div>
    </div>
  );
}
