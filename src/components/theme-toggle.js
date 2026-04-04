import React, { useState, useEffect } from 'react';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState('abyss');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'abyss';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
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

  // Prevent flash during SSR
  if (!mounted) {
    return <div style={{ width: 32, height: 32 }} />;
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'abyss' : 'light'} mode`}
      title={`Current: ${theme} theme (click to switch)`}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease',
        color: 'var(--text-primary)',
        lineHeight: 0,
        height: '28px',
        width: '28px',
        margin: 0,
        verticalAlign: 'middle',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--border-color)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {theme === 'light' ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block' }}
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
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block' }}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block' }}
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      )}
    </button>
  );
};
