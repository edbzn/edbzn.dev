/**
 * Blog ideas upvote API.
 *
 * Routes:
 *   GET  /votes                 → { [id]: count } for all ids seen so far
 *   GET  /votes/:id             → { id, count }
 *   POST /vote/:id              → { id, count, voted: true|false }
 *
 * Storage (KV, binding `BLOG_IDEAS`):
 *   count:<id>                  integer as string
 *   dedup:<hash>                "1" with 30d TTL, where hash = sha256(ip + id)
 *   ids                         JSON array of known ids (for GET /votes)
 *
 * Anti-abuse without auth: we hash the caller IP (from CF-Connecting-IP) with
 * the idea id and stash a dedup key with a 30-day TTL. Not bulletproof — a
 * determined voter can rotate IPs — but enough to stop casual inflation on a
 * personal blog. Wrap with Cloudflare Turnstile if it ever becomes a problem.
 *
 * Concurrency: KV reads-then-writes are not atomic. Racing writes to the same
 * id can drop an increment. For a blog upvote counter that's acceptable. If
 * you ever need exactness, move the counter to a Durable Object.
 */

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (request.method === 'GET' && url.pathname === '/votes') {
        return json(await getAllVotes(env), cors);
      }

      const voteMatch = url.pathname.match(/^\/votes\/([^/]+)$/);
      if (request.method === 'GET' && voteMatch) {
        const id = decodeURIComponent(voteMatch[1]);
        if (!ID_RE.test(id)) return json({ error: 'invalid id' }, cors, 400);
        const count = await getCount(env, id);
        return json({ id, count }, cors);
      }

      const postMatch = url.pathname.match(/^\/vote\/([^/]+)$/);
      if (request.method === 'POST' && postMatch) {
        const id = decodeURIComponent(postMatch[1]);
        if (!ID_RE.test(id)) return json({ error: 'invalid id' }, cors, 400);
        return json(await castVote(env, request, id), cors);
      }

      return json({ error: 'not found' }, cors, 404);
    } catch (err) {
      return json({ error: 'internal error' }, cors, 500);
    }
  },
};

async function castVote(env, request, id) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const hash = await sha256(`${ip}:${id}`);
  const dedupKey = `dedup:${hash}`;

  const already = await env.BLOG_IDEAS.get(dedupKey);
  if (already) {
    return { id, count: await getCount(env, id), voted: false };
  }

  // Mark voter first; if the count write fails we'd rather under-count than
  // let the same caller spam.
  await env.BLOG_IDEAS.put(dedupKey, '1', { expirationTtl: 60 * 60 * 24 * 30 });

  const current = await getCount(env, id);
  const next = current + 1;
  await env.BLOG_IDEAS.put(`count:${id}`, String(next));
  await registerId(env, id);

  return { id, count: next, voted: true };
}

async function getCount(env, id) {
  const raw = await env.BLOG_IDEAS.get(`count:${id}`);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function getAllVotes(env) {
  const idsRaw = await env.BLOG_IDEAS.get('ids');
  const ids = idsRaw ? JSON.parse(idsRaw) : [];
  const entries = await Promise.all(
    ids.map(async (id) => [id, await getCount(env, id)])
  );
  return Object.fromEntries(entries);
}

async function registerId(env, id) {
  const raw = await env.BLOG_IDEAS.get('ids');
  const ids = raw ? JSON.parse(raw) : [];
  if (!ids.includes(id)) {
    ids.push(id);
    await env.BLOG_IDEAS.put('ids', JSON.stringify(ids));
  }
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
  const raw = env.ALLOWED_ORIGIN;
  const allowed = Array.isArray(raw)
    ? raw
    : (raw || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const matches = (pattern) => {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
      return origin.startsWith(pattern.slice(0, -1));
    }
    return pattern === origin;
  };

  const ok = !!origin && allowed.some(matches);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, cors, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...cors,
    },
  });
}
