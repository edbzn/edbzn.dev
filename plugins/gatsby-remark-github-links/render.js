// @ts-check

/**
 * HTML rendering of the GitHub link icons and hover cards. Kept
 * framework-free: the markup is injected as-is by gatsby-plugin-mdx, so it
 * must not rely on any client-side code. Cards are nested in the link, so
 * they only use phrasing content (spans) and hold no links of their own.
 */

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

const countFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '');

/** Titles and commit messages show `code` spans, as on GitHub. */
const formatTitle = (value) =>
  escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>');

// Octicons (16px), https://primer.style/octicons
const ICONS = {
  repo: [
    'M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z',
  ],
  person: [
    'M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z',
  ],
  organization: [
    'M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z',
  ],
  commit: [
    'M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z',
  ],
  'issue-opened': [
    'M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z',
  ],
  'issue-closed': [
    'M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z',
    'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z',
  ],
  skip: [
    'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm9.78-2.22-5.5 5.5a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l5.5-5.5a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z',
  ],
  'pull-request': [
    'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z',
  ],
  merge: [
    'M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z',
  ],
  'pull-request-closed': [
    'M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',
  ],
  'pull-request-draft': [
    'M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 7.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0-4.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z',
  ],
  star: [
    'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z',
  ],
  fork: [
    'M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z',
  ],
  comment: [
    'M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z',
  ],
  people: [
    'M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z',
  ],
  file: [
    'M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z',
  ],
  directory: [
    'M0 2.75C0 1.784.784 1 1.75 1H5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1h6.75c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5c-.55 0-1.07-.26-1.4-.7l-.9-1.2a.25.25 0 0 0-.2-.1Z',
  ],
  discussion: [
    'M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13 2a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.458 1.458 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.22 2.22v-2.19a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25Z',
  ],
  compare: [
    'M9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM6 12v-1.646a.25.25 0 0 1 .427-.177l2.396 2.396a.25.25 0 0 1 0 .354l-2.396 2.396A.25.25 0 0 1 6 15.146V13.5H5A2.5 2.5 0 0 1 2.5 11V5.372a2.25 2.25 0 1 1 1.5 0V11a1 1 0 0 0 1 1ZM4 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0ZM12.75 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',
  ],
  tag: [
    'M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
  ],
};

const icon = (name, className = 'gh-icon') =>
  `<svg class="${className}" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">` +
  ICONS[name].map((d) => `<path d="${d}"/>`).join('') +
  `</svg>`;

// Icon and state label of each link variant. Colors live in the CSS.
const VARIANTS = {
  repo: { icon: 'repo' },
  user: { icon: 'person' },
  org: { icon: 'organization' },
  commit: { icon: 'commit' },
  issue: { icon: 'issue-opened' },
  'issue-open': { icon: 'issue-opened', state: 'Open' },
  'issue-closed': { icon: 'issue-closed', state: 'Closed' },
  'issue-not-planned': { icon: 'skip', state: 'Not planned' },
  pr: { icon: 'pull-request' },
  'pr-open': { icon: 'pull-request', state: 'Open' },
  'pr-draft': { icon: 'pull-request-draft', state: 'Draft' },
  'pr-merged': { icon: 'merge', state: 'Merged' },
  'pr-closed': { icon: 'pull-request-closed', state: 'Closed' },
};

/** The variant a link is styled with; without data, the kind of its URL. */
export function linkVariant(target, data) {
  switch (target.kind) {
    case 'user':
      return data?.isOrg ? 'org' : 'user';
    case 'issue': {
      if (!data) {
        return target.isPull ? 'pr' : 'issue';
      }
      if (data.isPull) {
        if (data.merged) return 'pr-merged';
        if (data.state === 'closed') return 'pr-closed';
        return data.draft ? 'pr-draft' : 'pr-open';
      }
      if (data.state === 'open') return 'issue-open';
      return data.stateReason === 'not_planned'
        ? 'issue-not-planned'
        : 'issue-closed';
    }
    default:
      return target.kind;
  }
}

/** Link text replacing bare URLs. */
export function shortLabel(target) {
  const repo = `${target.owner}/${target.repo}`;
  switch (target.kind) {
    case 'user':
      return `@${target.owner}`;
    case 'issue':
      return `${repo}#${target.number}`;
    case 'commit':
      return `${repo}@${target.sha.slice(0, 7)}`;
    default:
      return target.context ? `${repo}: ${target.context.label}` : repo;
  }
}

export const renderIcon = (variant) =>
  `<span class="gh-link-icon">${icon(VARIANTS[variant].icon)}</span>`;

/** Avatars are served at any size through `s`; 2x for high-DPI screens. */
function avatar(url, size, className = 'gh-card-avatar') {
  if (!url) {
    return '';
  }
  const src = new URL(url);
  src.searchParams.set('s', String(size * 2));
  return `<img class="${className}" src="${escapeHtml(src.toString())}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`;
}

const stat = (iconName, content) =>
  `<span class="gh-card-stat">${icon(iconName)}${content}</span>`;

const count = (value) => escapeHtml(countFormat.format(value ?? 0));

// GitHub linguist colors of common languages; others get a neutral dot.
const LANGUAGE_COLORS = {
  C: '#555555',
  'C#': '#178600',
  'C++': '#f34b7d',
  CSS: '#663399',
  Dart: '#00b4ab',
  Go: '#00add8',
  HTML: '#e34c26',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  Kotlin: '#a97bff',
  MDX: '#fcb32c',
  Nix: '#7e7eff',
  PHP: '#4f5d95',
  Python: '#3572a5',
  Ruby: '#701516',
  Rust: '#dea584',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Svelte: '#ff3e00',
  Swift: '#f05138',
  TypeScript: '#3178c6',
  Vue: '#41b883',
};

function language(name) {
  const color = LANGUAGE_COLORS[name] ?? '#8b8b8b';
  return `<span class="gh-card-stat"><span class="gh-card-language" style="background-color: ${color}"></span>${escapeHtml(name)}</span>`;
}

function label({ name, color }) {
  const style = /^[\da-f]{6}$/i.test(color)
    ? ` style="--label-color: #${color}"`
    : '';
  return `<span class="gh-card-label"${style}>${escapeHtml(name)}</span>`;
}

function repoHeader(target, suffix = '') {
  return (
    `<span class="gh-card-header">${icon('repo')}` +
    `<span class="gh-card-repo">${escapeHtml(target.owner)}/<strong>${escapeHtml(target.repo)}</strong></span>` +
    suffix +
    `</span>`
  );
}

function renderRepo(target, repo) {
  const [owner, name] = (
    repo.fullName ?? `${target.owner}/${target.repo}`
  ).split('/');
  const context = target.context;

  return (
    `<span class="gh-card-header">` +
    avatar(repo.ownerAvatarUrl, 20, 'gh-card-avatar gh-card-avatar--square') +
    `<span class="gh-card-repo">${escapeHtml(owner)}/<strong>${escapeHtml(name)}</strong></span>` +
    (repo.archived ? `<span class="gh-card-badge">Archived</span>` : '') +
    `</span>` +
    (context
      ? `<span class="gh-card-context">${icon(context.icon)}<span class="gh-card-context-label">${escapeHtml(context.label)}</span>` +
        (context.detail
          ? `<span class="gh-card-muted">${escapeHtml(context.detail)}</span>`
          : '') +
        `</span>`
      : '') +
    (repo.description
      ? `<span class="gh-card-body">${escapeHtml(repo.description)}</span>`
      : '') +
    `<span class="gh-card-footer">` +
    (repo.language ? language(repo.language) : '') +
    stat('star', count(repo.stars)) +
    stat('fork', count(repo.forks)) +
    `</span>`
  );
}

function renderIssue(target, issue, variant) {
  const { icon: stateIcon, state } = VARIANTS[variant];
  const labels = (issue.labels ?? []).slice(0, 3);

  return (
    repoHeader(target, `<span class="gh-card-muted">#${target.number}</span>`) +
    `<span class="gh-card-title">${formatTitle(issue.title)}</span>` +
    (labels.length
      ? `<span class="gh-card-labels">${labels.map(label).join('')}</span>`
      : '') +
    `<span class="gh-card-footer">` +
    `<span class="gh-card-state">${icon(stateIcon)}${state}</span>` +
    `<span class="gh-card-stat">${avatar(issue.authorAvatarUrl, 16)}${escapeHtml(issue.author ?? 'ghost')}</span>` +
    `<span class="gh-card-stat">${formatDate(issue.createdAt)}</span>` +
    (issue.comments ? stat('comment', count(issue.comments)) : '') +
    `</span>`
  );
}

function renderCommit(target, commit) {
  return (
    repoHeader(
      target,
      `<code class="gh-card-sha">${escapeHtml((commit.sha ?? target.sha).slice(0, 7))}</code>`
    ) +
    `<span class="gh-card-title">${formatTitle(commit.message)}</span>` +
    `<span class="gh-card-footer">` +
    (commit.author
      ? `<span class="gh-card-stat">${avatar(commit.authorAvatarUrl, 16)}${escapeHtml(commit.author)}</span>`
      : '') +
    `<span class="gh-card-stat">${formatDate(commit.date)}</span>` +
    (commit.additions != null
      ? `<span class="gh-card-stat"><span class="gh-card-additions">+${count(commit.additions)}</span><span class="gh-card-deletions">−${count(commit.deletions)}</span></span>`
      : '') +
    `</span>`
  );
}

function renderUser(user) {
  return (
    `<span class="gh-card-header">` +
    avatar(
      user.avatarUrl,
      40,
      `gh-card-avatar gh-card-avatar--large${user.isOrg ? ' gh-card-avatar--square' : ''}`
    ) +
    `<span class="gh-card-identity">` +
    `<strong>${escapeHtml(user.name || user.login)}</strong>` +
    `<span class="gh-card-muted">@${escapeHtml(user.login)}</span>` +
    `</span>` +
    `</span>` +
    (user.bio
      ? `<span class="gh-card-body">${escapeHtml(user.bio)}</span>`
      : '') +
    `<span class="gh-card-footer">` +
    (user.isOrg ? '' : stat('people', `${count(user.followers)} followers`)) +
    stat('repo', `${count(user.publicRepos)} repositories`) +
    (user.location
      ? `<span class="gh-card-stat">${escapeHtml(user.location)}</span>`
      : '') +
    `</span>`
  );
}

export function renderCard(target, data, id) {
  const variant = linkVariant(target, data);
  const content =
    target.kind === 'user'
      ? renderUser(data)
      : target.kind === 'issue'
        ? renderIssue(target, data, variant)
        : target.kind === 'commit'
          ? renderCommit(target, data)
          : renderRepo(target, data);

  return `<span class="gh-card gh-card--${variant}" id="${id}" aria-hidden="true">${content}</span>`;
}
