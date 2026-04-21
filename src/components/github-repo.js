import React, { useState, useEffect } from 'react';
import { rhythm } from '../utils/typography';

export const GitHubRepo = ({ name, description, url, img }) => {
  const [repo, setRepo] = useState(null);

  useEffect(() => {
    if (!name) return;
    fetch(`https://api.github.com/repos/${name}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRepo(data))
      .catch(() => {});
  }, [name]);

  return (
    <a
      href={url || `https://github.com/${name}`}
      className="box"
      style={{
        color: 'var(--text-primary)',
        fontWeight: 400,
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'none',
        height: '100%',
      }}
    >
      {img && (
        <img
          style={{
            height: '34px',
            width: 'auto',
            objectFit: 'contain',
            marginBottom: rhythm(0.3),
            display: 'block',
            flexShrink: 0,
            alignSelf: 'flex-start',
          }}
          alt="Project logo"
          src={img}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: rhythm(0.2),
          fontFamily: '"Public Sans", sans-serif',
        }}
      >
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
        </svg>
        <span>{name}</span>
      </div>
      <p
        style={{
          marginTop: rhythm(0.2),
          marginBottom: 0,
          fontWeight: 300,
          flex: 1,
          fontSize: '0.9rem',
        }}
      >
        {repo?.description || description}
      </p>
      {repo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            marginTop: rhythm(0.3),
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            fontFamily: '"Public Sans", sans-serif',
          }}
        >
          {repo.language && (
            <span
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: languageColor(repo.language),
                  display: 'inline-block',
                }}
              />
              {repo.language}
            </span>
          )}
          <span
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
            </svg>
            {repo.stargazers_count.toLocaleString()}
          </span>
          {repo.forks_count > 0 && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
              </svg>
              {repo.forks_count.toLocaleString()}
            </span>
          )}
          {repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' && (
            <span>{repo.license.spdx_id}</span>
          )}
        </div>
      )}
    </a>
  );
};

function languageColor(language) {
  const colors = {
    Nix: '#7e7eff',
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    Shell: '#89e051',
    C: '#555555',
    'C++': '#f34b7d',
    Java: '#b07219',
    Ruby: '#701516',
    HTML: '#e34c26',
    CSS: '#563d7c',
  };
  return colors[language] || '#8b8b8b';
}

export const GitHubRepoGrid = ({ children }) => (
  <div
    className="github-repo-grid"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: rhythm(0.5),
      margin: '2.25em 0',
    }}
  >
    {children}
  </div>
);
