/**
 * Post reactions API (dev.to-style emoji votes).
 *
 * Routes:
 *   GET  /reactions/:slug       → { slug, reactions: { "❤️": 3, "🦄": 1, … } }
 *   POST /reactions/:slug       → { slug, emoji, count, reacted: true|false }
 *        Body: { "emoji": "❤️" }
 *
 * Storage (KV, binding `REACTIONS`):
 *   r:<slug>:<emoji>            integer as string
 *   dedup:<hash>                "1" with 30d TTL, hash = sha256(ip + slug + emoji)
 *
 * Anti-abuse:
 *   - Origin allowlist
 *   - Per-(IP, slug, emoji) dedup with 30d TTL
 */

const ALLOWED_EMOJIS = ['❤️', '🦄', '🔥', '👏', '🙌'];
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,128}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return json(null, cors, 204);
    }

    try {
      const match = url.pathname.match(/^\/reactions\/([^/]+)$/);
      if (!match) return json({ error: 'not found' }, cors, 404);

      const slug = decodeURIComponent(match[1]);
      if (!SLUG_RE.test(slug))
        return json({ error: 'invalid slug' }, cors, 400);

      if (request.method === 'GET') {
        return json({ slug, reactions: await getReactions(env, slug) }, cors);
      }

      if (request.method === 'POST') {
        if (!isAllowedOrigin(origin, env)) {
          return json({ error: 'forbidden origin' }, cors, 403);
        }

        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'invalid body' }, cors, 400);
        }

        const emoji = body?.emoji;
        if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
          return json({ error: 'invalid emoji' }, cors, 400);
        }

        const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
        return json(await react(env, slug, emoji, ip), cors);
      }

      return json({ error: 'method not allowed' }, cors, 405);
    } catch (err) {
      console.error('worker error', err);
      return json({ error: 'internal error' }, cors, 500);
    }
  },
};

async function react(env, slug, emoji, ip) {
  const hash = await sha256(`${ip}:${slug}:${emoji}`);
  const dedupKey = `dedup:${hash}`;

  if (await env.REACTIONS.get(dedupKey)) {
    const count = await getCount(env, slug, emoji);
    return { slug, emoji, count, reacted: false };
  }

  await env.REACTIONS.put(dedupKey, '1', { expirationTtl: 60 * 60 * 24 * 30 });
  const next = (await getCount(env, slug, emoji)) + 1;
  await env.REACTIONS.put(`r:${slug}:${emoji}`, String(next));
  return { slug, emoji, count: next, reacted: true };
}

async function getReactions(env, slug) {
  const entries = await Promise.all(
    ALLOWED_EMOJIS.map(async (emoji) => [
      emoji,
      await getCount(env, slug, emoji),
    ])
  );
  return Object.fromEntries(entries);
}

async function getCount(env, slug, emoji) {
  const raw = await env.REACTIONS.get(`r:${slug}:${emoji}`);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const allowed = toList(env.ALLOWED_ORIGIN);
  return allowed.some((p) => {
    if (p === '*') return true;
    if (p.endsWith('*')) return origin.startsWith(p.slice(0, -1));
    return p === origin;
  });
}

function toList(raw) {
  if (raw == null) return [];
  return Array.isArray(raw)
    ? raw
    : String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

async function sha256(input) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function corsHeaders(origin, env) {
  const ok = isAllowedOrigin(origin, env);
  const fallback = toList(env.ALLOWED_ORIGIN)[0] || '';
  return {
    'Access-Control-Allow-Origin': ok ? origin : fallback,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, cors, status = 200) {
  return new Response(body == null ? null : JSON.stringify(body), {
    status,
    headers: {
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      'Cache-Control': 'no-store',
      ...cors,
    },
  });
}
