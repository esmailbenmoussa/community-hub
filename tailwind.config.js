/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Semantic theme-aware colors (use CSS variables)
        surface: 'var(--color-bg-primary)',
        'surface-secondary': 'var(--color-bg-secondary)',
        'surface-tertiary': 'var(--color-bg-tertiary)',
        'surface-hover': 'var(--color-bg-hover)',
        'surface-selected': 'var(--color-bg-selected)',

        content: 'var(--color-text-primary)',
        'content-secondary': 'var(--color-text-secondary)',
        'content-disabled': 'var(--color-text-disabled)',
        'content-inverse': 'var(--color-text-inverse)',

        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        divider: 'var(--color-divider)',

        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-dark': 'var(--color-accent-dark)',
        'accent-light': 'var(--color-accent-light)',

        // State colors
        'state-success': 'var(--color-success)',
        'state-success-bg': 'var(--color-success-bg)',
        'state-error': 'var(--color-error)',
        'state-error-bg': 'var(--color-error-bg)',
        'state-warning': 'var(--color-warning)',
        'state-warning-bg': 'var(--color-warning-bg)',
        'state-info': 'var(--color-info)',
        'state-info-bg': 'var(--color-info-bg)',

        // Legacy Azure DevOps colors (kept for backwards compatibility)
        'ado-blue': '#0078d4',
        'ado-blue-dark': '#106ebe',
        'ado-blue-light': '#deecf9',
        'ado-blue-hover': '#005a9e',

        'ado-gray': '#605e5c',
        'ado-gray-light': '#f3f2f1',
        'ado-gray-dark': '#323130',

        'ado-text-primary': '#323130',
        'ado-text-secondary': '#605e5c',
        'ado-text-disabled': '#a19f9d',

        'ado-border': '#e1dfdd',
        'ado-divider': '#edebe9',
        'ado-hover': '#f3f2f1',
        'ado-surface': '#ffffff',
        'ado-background': '#faf9f8',

        'ado-red': '#d13438',
        'ado-red-light': '#fde7e9',
        'ado-green': '#107c10',
        'ado-green-light': '#dff6dd',
        'ado-orange': '#ffaa44',
        'ado-orange-light': '#fff4ce',
        'ado-yellow': '#fce100',
        'ado-purple': '#8764b8',
        'ado-purple-light': '#e8e0f0',
      },
      boxShadow: {
        ado: 'var(--shadow-sm)',
        'ado-md': 'var(--shadow-md)',
        'ado-lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        ado: '2px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
