// @ts-check

/**
 * HTML rendering of syndication API tweet payloads. Kept framework-free: the
 * markup is injected as-is by gatsby-plugin-mdx, so it must not rely on any
 * client-side code.
 */

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Tweet text comes back with &, < and > already escaped.
const decodeEntities = (value) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

const countFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const icon = (path, className) =>
  `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;

const X_LOGO =
  'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const REPLY =
  'M1.75 10c0-4.42 3.58-8 8-8h4.37c4.49 0 8.13 3.64 8.13 8.13 0 2.96-1.61 5.69-4.2 7.12L10 21.67V18h-.25c-4.42 0-8-3.58-8-8z';
const VERIFIED =
  'M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z';
const PLAY = 'M8 5v14l11-7z';

const profileUrl = (user) => `https://x.com/${user.screen_name}`;
const tweetUrl = (tweet) =>
  `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`;

/** Profile images come as 48px `_normal`; `_bigger` is 73px, crisp at 2x. */
const avatarUrl = (user) =>
  user.profile_image_url_https.replace(/_normal(\.\w+)$/, '_bigger$1');

/** pbs.twimg.com serves resized variants through `format` and `name`. */
function mediaUrl(url, name) {
  const parsed = new URL(url);
  const extension = parsed.pathname.match(/\.(\w+)$/)?.[1] ?? 'jpg';
  parsed.pathname = parsed.pathname.replace(/\.\w+$/, '');
  parsed.searchParams.set('format', extension);
  parsed.searchParams.set('name', name);
  return parsed.toString();
}

/**
 * Turns the tweet text into HTML, linking mentions, hashtags and URLs.
 * Entity indices are expressed in code points, hence Array.from.
 */
function renderText(tweet, { links = true } = {}) {
  const chars = Array.from(tweet.text);
  const [start, end] = tweet.display_text_range ?? [0, chars.length];
  const entities = tweet.entities ?? {};

  const spans = [
    ...(entities.hashtags ?? []).map((hashtag) => ({
      indices: hashtag.indices,
      href: `https://x.com/hashtag/${encodeURIComponent(hashtag.text)}`,
      label: `#${hashtag.text}`,
    })),
    ...(entities.symbols ?? []).map((symbol) => ({
      indices: symbol.indices,
      href: `https://x.com/search?q=%24${encodeURIComponent(symbol.text)}`,
      label: `$${symbol.text}`,
    })),
    ...(entities.user_mentions ?? []).map((mention) => ({
      indices: mention.indices,
      href: `https://x.com/${mention.screen_name}`,
      label: `@${mention.screen_name}`,
    })),
    ...(entities.urls ?? []).map((url) => ({
      indices: url.indices,
      href: url.expanded_url,
      label: url.display_url,
    })),
    // Media links are rendered as the media grid instead.
    ...(entities.media ?? []).map((media) => ({
      indices: media.indices,
      href: null,
      label: '',
    })),
  ]
    .filter(({ indices: [from, to] }) => from >= start && to <= end)
    .sort((a, b) => a.indices[0] - b.indices[0]);

  let html = '';
  let cursor = start;
  const plain = (from, to) =>
    escapeHtml(decodeEntities(chars.slice(from, to).join('')));

  for (const { indices, href, label } of spans) {
    const [from, to] = indices;
    if (from < cursor) {
      continue;
    }
    html += plain(cursor, from);
    if (href) {
      html += links
        ? `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
        : `<span class="tweet-entity">${escapeHtml(label)}</span>`;
    }
    cursor = to;
  }
  html += plain(cursor, end);

  return html.trim();
}

function renderAuthor(user, { link = true } = {}) {
  const square = user.profile_image_shape === 'Square';
  const verified = user.is_blue_verified || user.verified;
  const content =
    `<img class="tweet-avatar${square ? ' tweet-avatar--square' : ''}" src="${escapeHtml(avatarUrl(user))}" width="48" height="48" alt="" loading="lazy" decoding="async">` +
    `<span class="tweet-author-text">` +
    `<span class="tweet-author-name">${escapeHtml(user.name)}${verified ? icon(VERIFIED, 'tweet-verified') : ''}</span>` +
    `<span class="tweet-author-handle">@${escapeHtml(user.screen_name)}</span>` +
    `</span>`;

  return link
    ? `<a class="tweet-author" href="${profileUrl(user)}">${content}</a>`
    : `<span class="tweet-author">${content}</span>`;
}

function renderMedia(tweet, { link = true } = {}) {
  const media = (tweet.mediaDetails ?? []).slice(0, 4);
  if (!media.length) {
    return '';
  }

  const single = media.length === 1;
  const items = media.map((item) => {
    const { width, height } = item.original_info ?? {};
    const isVideo = item.type === 'video' || item.type === 'animated_gif';
    const alt = item.ext_alt_text ?? (isVideo ? 'Video' : 'Image');
    const img =
      `<img src="${escapeHtml(mediaUrl(item.media_url_https, 'small'))}"` +
      ` srcset="${escapeHtml(mediaUrl(item.media_url_https, 'small'))} 680w, ${escapeHtml(mediaUrl(item.media_url_https, 'medium'))} 1200w"` +
      ` sizes="(max-width: 698px) 100vw, 698px"` +
      (width && height ? ` width="${width}" height="${height}"` : '') +
      ` alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
    // Videos stay on X: show the poster with a play button linking there.
    const overlay = isVideo ? icon(PLAY, 'tweet-play') : '';
    const style =
      single && width && height
        ? ` style="aspect-ratio: ${width} / ${height}"`
        : '';
    const href = isVideo ? tweetUrl(tweet) : item.expanded_url;

    return link
      ? `<a class="tweet-media-item" href="${escapeHtml(href)}"${style}>${img}${overlay}</a>`
      : `<span class="tweet-media-item"${style}>${img}${overlay}</span>`;
  });

  return `<div class="tweet-media tweet-media--${media.length}">${items.join('')}</div>`;
}

/** Quoted tweets render as a compact card linking to the original post. */
function renderQuote(quoted) {
  if (!quoted?.user) {
    return '';
  }

  return (
    `<a class="tweet-quote" href="${tweetUrl(quoted)}">` +
    `<span class="tweet-quote-header">${renderAuthor(quoted.user, { link: false })}</span>` +
    `<span class="tweet-text">${renderText(quoted, { links: false })}</span>` +
    renderMedia(quoted, { link: false }) +
    `</a>`
  );
}

function renderStat(path, count, label, href) {
  if (!count) {
    return '';
  }
  return (
    `<a class="tweet-stat" href="${href}" aria-label="${count} ${label}">` +
    `${icon(path, 'tweet-stat-icon')}<span>${countFormat.format(count)}</span></a>`
  );
}

export function renderTweet(tweet) {
  const url = tweetUrl(tweet);
  const date = new Date(tweet.created_at);
  const replyingTo = tweet.in_reply_to_screen_name
    ? `<p class="tweet-replying">Replying to <a href="https://x.com/${escapeHtml(tweet.in_reply_to_screen_name)}">@${escapeHtml(tweet.in_reply_to_screen_name)}</a></p>`
    : '';

  return (
    `<figure class="box tweet" data-tweet-id="${tweet.id_str}">` +
    `<div class="tweet-header">` +
    renderAuthor(tweet.user) +
    `<a class="tweet-brand" href="${url}" aria-label="View post on X">${icon(X_LOGO, 'tweet-brand-icon')}</a>` +
    `</div>` +
    replyingTo +
    `<p class="tweet-text" lang="${escapeHtml(tweet.lang ?? 'en')}">${renderText(tweet)}</p>` +
    renderMedia(tweet) +
    renderQuote(tweet.quoted_tweet) +
    `<div class="tweet-footer">` +
    `<a class="tweet-date" href="${url}"><time datetime="${date.toISOString()}">${dateFormat.format(date)}</time></a>` +
    `<span class="tweet-stats">` +
    renderStat(
      HEART,
      tweet.favorite_count,
      'likes',
      `https://x.com/intent/like?tweet_id=${tweet.id_str}`
    ) +
    renderStat(REPLY, tweet.conversation_count, 'replies', url) +
    `</span>` +
    `</div>` +
    `</figure>`
  );
}

/** Used when the tweet was deleted, made private or could not be fetched. */
export function renderUnavailableTweet({ url, screenName }) {
  return (
    `<figure class="box tweet tweet--unavailable">` +
    `<p class="tweet-text">A post by @${escapeHtml(screenName)} is unavailable here.</p>` +
    `<div class="tweet-footer"><a class="tweet-date" href="${escapeHtml(url)}">View on X</a></div>` +
    `</figure>`
  );
}
