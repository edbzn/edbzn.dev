// @ts-check

import { visit } from 'unist-util-visit';
import { renderTweet, renderUnavailableTweet } from './render.js';

/**
 * Renders tweets referenced as `oembed: https://x.com/<user>/status/<id>`
 * inline code into static, themeable HTML at build time.
 *
 * Unlike the official embed, nothing runs in the browser: no widgets.js on
 * every page, no iframe, and the card follows the site theme through CSS
 * variables (see .tweet in static/css/main.css).
 */

const TWEET_URL =
  /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/(\w+)\/status(?:es)?\/(\d+)/;

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com/tweet-result';

// Counts and avatars drift over time; refresh cached data after a week and
// fall back to the stale copy when Twitter is unreachable.
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Token expected by the syndication endpoint (same as react-tweet). */
const getToken = (id) =>
  ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, '');

async function fetchTweet(id) {
  const url = new URL(SYNDICATION_URL);
  url.searchParams.set('id', id);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('token', getToken(id));

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!data || data.__typename !== 'Tweet') {
    throw new Error(`tweet is unavailable (${data?.__typename ?? 'empty'})`);
  }
  return data;
}

async function getTweet(id, { cache, reporter }) {
  const key = `static-tweet-${id}`;
  const cached = await cache?.get(key);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await fetchTweet(id);
    await cache?.set(key, { fetchedAt: Date.now(), data });
    return data;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (cached) {
      reporter?.warn(`[static-tweet] ${id}: ${reason}, using cached copy`);
      return cached.data;
    }
    reporter?.warn(`[static-tweet] ${id}: ${reason}, rendering a plain link`);
    return null;
  }
}

/** Returns the tweet URL of an `oembed: <url>` inline code node, if any. */
function matchTweet(node, prefixes) {
  if (node?.type !== 'inlineCode') {
    return null;
  }

  const separator = node.value.indexOf(':');
  if (separator === -1) {
    return null;
  }

  const prefix = node.value.slice(0, separator).trim();
  const url = node.value.slice(separator + 1).trim();
  const match = prefixes.includes(prefix) && url.match(TWEET_URL);

  return match ? { url, screenName: match[1], id: match[2] } : null;
}

export default async function (
  { markdownAST, cache, reporter },
  { prefixes = ['oembed', 'tweet'] } = {}
) {
  if (!markdownAST) {
    return markdownAST;
  }

  /** @type {{ node: any, tweet: { url: string, screenName: string, id: string } }[]} */
  const targets = [];

  visit(markdownAST, (node) => {
    // A tweet alone in its paragraph replaces the whole paragraph, otherwise
    // the <figure> would end up inside a <p> and the browser would re-parent
    // it, breaking hydration.
    if (node.type === 'paragraph' && node.children.length === 1) {
      const tweet = matchTweet(node.children[0], prefixes);
      if (tweet) {
        targets.push({ node, tweet });
        return 'skip';
      }
    }

    const tweet = matchTweet(node, prefixes);
    if (tweet) {
      targets.push({ node, tweet });
    }
  });

  await Promise.all(
    targets.map(async ({ node, tweet }) => {
      const data = await getTweet(tweet.id, { cache, reporter });

      node.type = 'html';
      node.value = data ? renderTweet(data) : renderUnavailableTweet(tweet);
      delete node.children;
    })
  );

  return markdownAST;
}
