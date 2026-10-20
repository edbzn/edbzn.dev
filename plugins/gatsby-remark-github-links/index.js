// @ts-check

import { visit } from 'unist-util-visit';
import { renderCard, renderIcon, linkVariant, shortLabel } from './render.js';

/**
 * Turns links to GitHub repositories, issues, pull requests, commits and
 * profiles into "rich" links: an icon telling what the link points to, and
 * a card with its details (description, state, author, stars...) shown on
 * hover and keyboard focus.
 *
 * The details are fetched at build time and the card is plain HTML nested in
 * the link, shown through CSS (see .gh-link in static/css/main.css): nothing
 * runs in the browser. The link text written in the post is kept as-is,
 * except for bare URLs, which get a short label such as `owner/repo#123`.
 */

const API_URL = 'https://api.github.com';

// Stars and issue states drift; refresh cached data after a day and fall back
// to the stale copy when GitHub is unreachable or rate-limited.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// First path segments that are GitHub pages rather than users or orgs.
const RESERVED_OWNERS = new Set([
  'about',
  'apps',
  'collections',
  'customer-stories',
  'enterprise',
  'events',
  'explore',
  'features',
  'issues',
  'join',
  'login',
  'marketplace',
  'new',
  'notifications',
  'orgs',
  'pricing',
  'pulls',
  'readme',
  'search',
  'security',
  'settings',
  'site',
  'sponsors',
  'topics',
  'trending',
]);

const OWNER = /^[a-z\d](?:[a-z\d-]{0,38})$/i;
const REPO = /^[\w.-]+$/;
const SHA = /^[\da-f]{7,40}$/i;
const NUMBER = /^\d+$/;

/**
 * Parses a GitHub URL into what it points to, or null for anything else
 * (other hosts, GitHub's own pages, gists...).
 *
 * Deep links into a repository (files, discussions, comparisons...) render
 * the repository card, with what the link points to as `context`.
 */
export function parseGitHubUrl(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (!/^(www\.)?github\.com$/.test(url.hostname)) {
    return null;
  }

  let segments;
  try {
    segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return null;
  }

  const [owner, repoSegment, section, ...rest] = segments;
  if (!owner || !OWNER.test(owner) || RESERVED_OWNERS.has(owner)) {
    return null;
  }
  if (!repoSegment) {
    return { kind: 'user', owner };
  }

  const repo = repoSegment.replace(/\.git$/, '');
  if (!REPO.test(repo)) {
    return null;
  }

  if ((section === 'issues' || section === 'pull') && NUMBER.test(rest[0])) {
    // Commits of a pull request: /pull/<n>/commits/<sha>
    if (section === 'pull' && rest[1] === 'commits' && SHA.test(rest[2])) {
      return { kind: 'commit', owner, repo, sha: rest[2] };
    }
    return {
      kind: 'issue',
      owner,
      repo,
      number: Number(rest[0]),
      isPull: section === 'pull',
    };
  }
  if (section === 'commit' && SHA.test(rest[0])) {
    return { kind: 'commit', owner, repo, sha: rest[0] };
  }

  return { kind: 'repo', owner, repo, context: repoContext(section, rest) };
}

/** What a deep link into a repository points to, shown on the repo card. */
function repoContext(section, rest) {
  switch (section) {
    case 'tree':
    case 'blob': {
      const [ref, ...path] = rest;
      if (!ref) {
        return null;
      }
      return {
        icon: section === 'tree' ? 'directory' : 'file',
        label: path.length ? path.join('/') : ref,
        detail: path.length ? ref : null,
      };
    }
    case 'discussions':
      return NUMBER.test(rest[0])
        ? { icon: 'discussion', label: `Discussion #${rest[0]}` }
        : { icon: 'discussion', label: 'Discussions' };
    case 'compare':
      return rest.length
        ? { icon: 'compare', label: rest.join('/') }
        : { icon: 'compare', label: 'Compare changes' };
    case 'releases':
      return rest[0] === 'tag' && rest[1]
        ? { icon: 'tag', label: rest.slice(1).join('/') }
        : { icon: 'tag', label: 'Releases' };
    default:
      return null;
  }
}

function apiPath(target) {
  const repo = `/repos/${target.owner}/${target.repo}`;
  switch (target.kind) {
    case 'user':
      return `/users/${target.owner}`;
    case 'issue':
      // Also returns pull requests, with their merge state.
      return `${repo}/issues/${target.number}`;
    case 'commit':
      return `${repo}/commits/${target.sha}`;
    default:
      return repo;
  }
}

/** Keeps the fields the card shows, so the Gatsby cache stays small. */
function pickFields(kind, data) {
  switch (kind) {
    case 'user':
      return {
        login: data.login,
        name: data.name,
        avatarUrl: data.avatar_url,
        bio: data.bio,
        isOrg: data.type === 'Organization',
        followers: data.followers,
        publicRepos: data.public_repos,
        location: data.location,
      };
    case 'issue':
      return {
        title: data.title,
        state: data.state,
        stateReason: data.state_reason,
        isPull: Boolean(data.pull_request),
        merged: Boolean(data.pull_request?.merged_at),
        draft: Boolean(data.draft),
        author: data.user?.login,
        authorAvatarUrl: data.user?.avatar_url,
        createdAt: data.created_at,
        comments: data.comments,
        labels: (data.labels ?? []).map(({ name, color }) => ({ name, color })),
      };
    case 'commit':
      return {
        sha: data.sha,
        message: data.commit.message.split('\n')[0],
        // `author` is null when the commit email isn't linked to an account.
        author: data.author?.login ?? data.commit.author?.name,
        authorAvatarUrl: data.author?.avatar_url,
        date: data.commit.author?.date,
        additions: data.stats?.additions,
        deletions: data.stats?.deletions,
      };
    default:
      return {
        fullName: data.full_name,
        description: data.description,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        ownerAvatarUrl: data.owner?.avatar_url,
        archived: data.archived,
      };
  }
}

function githubHeaders() {
  /** @type {Record<string, string>} */
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

// Once the rate limit is hit, every other request would fail as well: skip
// them until the limit resets and use the cached copies instead.
let rateLimitedUntil = 0;

async function fetchGitHub(path) {
  if (Date.now() < rateLimitedUntil) {
    throw new Error('rate limit exceeded');
  }

  const res = await fetch(API_URL + path, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(10_000),
  });

  if (
    (res.status === 403 || res.status === 429) &&
    res.headers.get('x-ratelimit-remaining') === '0'
  ) {
    const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
    rateLimitedUntil = reset || Date.now() + 60_000;
    throw new Error('rate limit exceeded, set GITHUB_TOKEN to raise it');
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

async function loadData(target, { cache, reporter }) {
  const path = apiPath(target);
  const key = `github-link-${path}`;
  const cached = await cache?.get(key);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = pickFields(target.kind, await fetchGitHub(path));
    await cache?.set(key, { fetchedAt: Date.now(), data });
    return data;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (cached) {
      reporter?.warn(`[github-links] ${path}: ${reason}, using cached copy`);
      return cached.data;
    }
    reporter?.warn(`[github-links] ${path}: ${reason}, rendering without card`);
    return null;
  }
}

// The same links show up across posts, and every post is compiled twice (page
// and excerpt): share requests within the build.
const pending = new Map();

function getData(target, context) {
  const path = apiPath(target);
  if (!pending.has(path)) {
    const request = loadData(target, context).then((data) => {
      // Let a later compile retry, e.g. after a network blip in develop.
      if (!data) {
        pending.delete(path);
      }
      return data;
    });
    pending.set(path, request);
  }
  return pending.get(path);
}

// Links wrapping images (README badges) or JSX are left alone.
const TEXT_NODES = new Set([
  'text',
  'inlineCode',
  'emphasis',
  'strong',
  'delete',
  'break',
]);

function isTextOnly(node) {
  return node.children.every(
    (child) =>
      TEXT_NODES.has(child.type) && (!child.children || isTextOnly(child))
  );
}

function textContent(node) {
  return 'value' in node
    ? node.value
    : (node.children ?? []).map(textContent).join('');
}

/** Autolinked URLs, and links whose text is just their URL. */
function isBareUrl(node) {
  const text = textContent(node).trim().replace(/\/$/, '');
  const url = node.url.replace(/\/$/, '');
  return text === url || text === url.replace(/^https?:\/\//, '');
}

/**
 * The icon and the first word of the label, in a span that doesn't wrap:
 * lines can break after an inline-block, which would leave the icon alone at
 * the end of a line.
 */
function leadWithIcon(children, variant) {
  const [lead, remainder] = splitFirstWord(children);

  return [
    {
      type: 'ghLinkLead',
      data: { hName: 'span', hProperties: { className: ['gh-link-lead'] } },
      children: [{ type: 'html', value: renderIcon(variant) }, ...lead],
    },
    ...remainder,
  ];
}

/**
 * Splits the first word off phrasing nodes, keeping its formatting:
 * `**Max size** #1` gives `**Max**` and `** size** #1`.
 */
function splitFirstWord(nodes) {
  const [first, ...rest] = nodes;

  if (first.type === 'text') {
    const word = first.value.match(/^\S*/)[0];
    const remainder = first.value.slice(word.length);
    return [
      [{ type: 'text', value: word }],
      [...(remainder ? [{ type: 'text', value: remainder }] : []), ...rest],
    ];
  }
  if (first.children?.length) {
    const [lead, remainder] = splitFirstWord(first.children);
    return [
      [{ ...first, children: lead }],
      [
        ...(remainder.length ? [{ ...first, children: remainder }] : []),
        ...rest,
      ],
    ];
  }
  // Inline code doesn't break anyway.
  return [[first], rest];
}

export default async function ({ markdownAST, cache, reporter }) {
  if (!markdownAST) {
    return markdownAST;
  }

  /** @type {{ node: any, target: any }[]} */
  const targets = [];

  visit(markdownAST, 'link', (node) => {
    const target = parseGitHubUrl(node.url);
    if (target && node.children.length && isTextOnly(node)) {
      targets.push({ node, target });
    }
  });

  await Promise.all(
    targets.map(async ({ node, target }, index) => {
      const data = await getData(target, { cache, reporter });
      const cardId = `gh-card-${index + 1}`;

      if (isBareUrl(node)) {
        node.children = [{ type: 'text', value: shortLabel(target) }];
      }

      const variant = linkVariant(target, data);
      const singleWord = !/\s/.test(textContent(node).trim());
      node.data = {
        ...node.data,
        hProperties: {
          ...node.data?.hProperties,
          className: [
            'gh-link',
            `gh-link--${variant}`,
            ...(singleWord ? ['gh-link--nowrap'] : []),
          ],
          // The card is hidden from the link's name, read as its description.
          ...(data && { ariaDescribedBy: cardId }),
        },
      };
      node.children = [
        ...leadWithIcon(node.children, variant),
        ...(data
          ? [{ type: 'html', value: renderCard(target, data, cardId) }]
          : []),
      ];
    })
  );

  return markdownAST;
}
