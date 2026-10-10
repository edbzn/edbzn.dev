import React from 'react';

/* 16×16 stroke icons for the /uses categories. They inherit `currentColor`
   so they follow the theme and the per-category tint. */
const paths = {
  editor: <path d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4" />,
  terminal: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="m4.5 6 2 2-2 2M8.5 10.5h3" />
    </>
  ),
  cli: <path d="m2 4 4 4-4 4M8 12.5h6" />,
  frontend: (
    <path d="M8 1.5 1.5 5 8 8.5 14.5 5 8 1.5ZM1.5 8 8 11.5 14.5 8M1.5 11 8 14.5 14.5 11" />
  ),
  backend: (
    <>
      <rect x="2" y="2" width="12" height="5" rx="1" />
      <rect x="2" y="9" width="12" height="5" rx="1" />
      <path d="M5 4.5h.01M5 11.5h.01" />
    </>
  ),
  languages: (
    <path d="M6 2.5c-1.5 0-2 .5-2 2v1.5c0 1-.5 2-1.5 2 1 0 1.5 1 1.5 2v1.5c0 1.5.5 2 2 2M10 2.5c1.5 0 2 .5 2 2v1.5c0 1 .5 2 1.5 2-1 0-1.5 1-1.5 2v1.5c0 1.5-.5 2-2 2" />
  ),
  infrastructure: (
    <path d="M4.5 12.5h7a3 3 0 0 0 .4-5.97A4 4 0 0 0 4.2 7.6a2.5 2.5 0 0 0 .3 4.9Z" />
  ),
  ai: <path d="M8 1.5 9.4 6.6 14.5 8 9.4 9.4 8 14.5 6.6 9.4 1.5 8 6.6 6.6Z" />,
  services: (
    <>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M1.5 8h13M8 1.5c1.8 2 2.7 4.2 2.7 6.5s-.9 4.5-2.7 6.5C6.2 12.5 5.3 10.3 5.3 8S6.2 3.5 8 1.5Z" />
    </>
  ),
  os: (
    <>
      <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" />
      <path d="M5.5 14h5M8 11.5V14" />
    </>
  ),
  media: (
    <>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M6.5 5.5v5l4-2.5-4-2.5Z" />
    </>
  ),
  all: (
    <>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </>
  ),
  chevron: <path d="m4 6 4 4 4-4" />,
  external: <path d="M6.5 3.5h-3v9h9v-3M9.5 2.5h4v4M13.5 2.5 7.5 8.5" />,
};

export const UsesIcon = ({ name, size = 16, className }) => (
  <svg
    viewBox="0 0 16 16"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {paths[name]}
  </svg>
);

/** 1–3 letter badge for a tool: explicit override, else initials. */
export const monogramFor = (item) => {
  if (item.monogram) return item.monogram;
  const words = item.name.split(/[\s+/.-]+/).filter(Boolean);
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const word = words[0];
  return word[0].toUpperCase() + (word[1] || '').toLowerCase();
};

/** Host name shown next to external links, e.g. "vuejs.org". */
export const hostOf = (url) =>
  url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
