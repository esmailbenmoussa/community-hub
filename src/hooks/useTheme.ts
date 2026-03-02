import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { themeAtom, type Theme } from '@/store/themeAtom';
import { isDevMode } from '@/utils/environment';

/**
 * Parse a color string (hex or rgb) into RGB components
 */
const parseColor = (
  color: string
): { r: number; g: number; b: number } | null => {
  // Handle hex colors
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return null;
};

/**
 * Detect if the current theme is dark by reading the computed --background-color
 * CSS variable from the document root. This is the most reliable method since
 * SDK.getPageContext().globalization.theme always returns "Default".
 */
const detectThemeFromCSS = (): boolean => {
  const root = document.documentElement;
  const bgColor = getComputedStyle(root)
    .getPropertyValue('--background-color')
    .trim();

  if (bgColor) {
    const rgb = parseColor(bgColor);
    if (rgb) {
      const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      return luminance < 0.5;
    }
  }

  return false;
};

/**
 * Determines if theme data represents a dark theme by analyzing color values.
 * Searches for background-related CSS variables and checks their luminance.
 */
const isDarkTheme = (themeData: Record<string, string>): boolean => {
  // Patterns to exclude - these are accent/status colors, not page backgrounds
  const excludePatterns = [
    /status/i,
    /info/i,
    /communication/i,
    /error/i,
    /warning/i,
    /success/i,
    /accent/i,
    /hover/i,
    /selected/i,
    /focus/i,
    /link/i,
    /button/i,
    /icon/i,
  ];

  // Priority list of key patterns that indicate the main page background color
  const backgroundKeyPatterns = [
    /^background-color$/i,
    /^backgroundColor$/i,
    /^(body|root|page|main|app|content|surface)[-_]?background/i,
    /^neutral[-_]?0$/i,
    /^palette[-_]?neutral[-_]?0$/i,
  ];

  // Find the best matching background color
  for (const pattern of backgroundKeyPatterns) {
    for (const [key, value] of Object.entries(themeData)) {
      // Skip keys that are likely accent/status backgrounds
      if (excludePatterns.some((p) => p.test(key))) continue;

      if (pattern.test(key) && value) {
        const rgb = parseColor(value);
        if (rgb) {
          const luminance =
            (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
          return luminance < 0.5;
        }
      }
    }
  }

  // Fallback: read from computed styles if no matching key found in themeData
  return detectThemeFromCSS();
};

/**
 * Hook to manage theme state and sync with Azure DevOps host theme
 * In production: Detects ADO theme from CSS variables and listens for theme changes
 * In development: Uses system preference (prefers-color-scheme)
 */
export const useTheme = () => {
  const [theme, setTheme] = useAtom(themeAtom);

  useEffect(() => {
    if (isDevMode()) {
      // In dev mode, check system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: light)'
      ).matches;
      setTheme(prefersDark ? 'dark' : 'light');

      // Listen for system theme changes in dev mode
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Production: Detect initial theme from CSS variables
    // Note: SDK.getPageContext().globalization.theme is unreliable (always returns "Default")
    // So we read the --background-color CSS variable that the SDK applies to :root
    const detectInitialTheme = async () => {
      try {
        const SDK = await import('azure-devops-extension-sdk');
        await SDK.ready(); // Ensure SDK has applied theme CSS variables

        const isDark = detectThemeFromCSS();
        setTheme(isDark ? 'dark' : 'light');
      } catch {
        setTheme('light');
      }
    };

    detectInitialTheme();

    // Listen for theme changes from ADO host
    // The SDK dispatches 'themeApplied' event when theme changes
    const handleThemeApplied = (event: CustomEvent<Record<string, string>>) => {
      const themeData = event.detail;
      const isDark =
        themeData && Object.keys(themeData).length > 0
          ? isDarkTheme(themeData)
          : detectThemeFromCSS();
      setTheme(isDark ? 'dark' : 'light');
    };

    window.addEventListener(
      'themeApplied',
      handleThemeApplied as EventListener
    );

    return () => {
      window.removeEventListener(
        'themeApplied',
        handleThemeApplied as EventListener
      );
    };
  }, [setTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    setTheme: (newTheme: Theme) => setTheme(newTheme),
  };
};
