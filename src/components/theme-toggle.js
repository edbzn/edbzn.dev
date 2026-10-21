import React, { useState, useEffect } from 'react';

const DARK_QUERY = '(prefers-color-scheme: dark)';
// Only written when a theme is picked with the toggle. The former 'theme' key
// was written on every visit (always 'abyss'), so it isn't read any more.
const STORAGE_KEY = 'theme-choice';

/** Light or dark, from the system setting. */
const systemTheme = () =>
  window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';

/** The theme picked with the toggle, if any. */
const savedTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Cycles light → dark → abyss. Until a theme is picked here (and saved), the
 * site follows the system setting, also when it changes while the page is
 * open; gatsby-ssr.js applies the same default before the first paint.
 */
export const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      localStorage.removeItem('theme');
    } catch {}
    const initialTheme = savedTheme() || systemTheme();
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    const mediaQuery = window.matchMedia?.(DARK_QUERY);
    const followSystem = () => {
      if (savedTheme()) return;
      const nextTheme = systemTheme();
      setTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    };
    mediaQuery?.addEventListener('change', followSystem);
    return () => mediaQuery?.removeEventListener('change', followSystem);
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    let newTheme;
    if (theme === 'light') {
      newTheme = 'dark';
    } else if (theme === 'dark') {
      newTheme = 'abyss';
    } else {
      newTheme = 'light';
    }

    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Prevent flash during SSR. Same size as the button, so the header doesn't
  // move when it mounts.
  if (!mounted) {
    return <div className="theme-toggle theme-toggle--placeholder" />;
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'abyss' : 'light'} mode`}
      title={`Current: ${theme} theme (click to switch)`}
      className="theme-toggle"
    >
      {theme === 'light' ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : theme === 'dark' ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      )}
    </button>
  );
};
