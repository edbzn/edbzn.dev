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
 *   day:<id>:<YYYY-MM-DD>       integer as string (per-day vote tally, 48h TTL)
 *   dedup:<hash>                "1" with 30d TTL, where hash = sha256(ip + id)
 *   ids                         JSON array of known ids (for GET /votes)
 *
 * Anti-abuse layers (in order on every POST):
 *   1. Origin allowlist enforced server-side (browsers enforce CORS, bots don't).
 *   2. Turnstile token verification (when TURNSTILE_SECRET is configured).
 *   3. Rate-limit binding (`RATE_LIMITER`) keyed on CF-Connecting-IP.
 *   4. ASN blocklist to reject traffic from common cloud / proxy ASNs.
 *   5. Per-idea daily cap to bound write amplification during an attack.
 *   6. Per-(IP, id) dedup with 30d TTL (the only one a legit user ever hits).
 */

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DEFAULT_DAILY_CAP = 500;
const DEFAULT_BLOCKED_ASNS = new Set([
  16509, 14618, 15169, 396982, 8075, 14061, 16276, 24940, 63949, 20473, 36351,
  45102,
]);
const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

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
        return json({ id, count: await getCount(env, id) }, cors);
      }

      const postMatch = url.pathname.match(/^\/vote\/([^/]+)$/);
      if (request.method === 'POST' && postMatch) {
        const id = decodeURIComponent(postMatch[1]);
        if (!ID_RE.test(id)) return json({ error: 'invalid id' }, cors, 400);

        if (!isAllowedOrigin(origin, env)) {
          return json({ error: 'forbidden origin' }, cors, 403);
        }
        if (isBlockedAsn(request, env)) {
          return json({ error: 'forbidden' }, cors, 403);
        }

        const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

        // Turnstile verification. Only enforced when the secret is configured,
        // so local dev without the secret still works.
        if (env.TURNSTILE_SECRET) {
          const token = request.headers.get('X-Turnstile-Token') || '';
          if (!token) {
            return json({ error: 'missing turnstile token' }, cors, 403);
          }
          const ok = await verifyTurnstile(env.TURNSTILE_SECRET, token, ip);
          if (!ok) {
            return json({ error: 'turnstile failed' }, cors, 403);
          }
        }

        if (env.RATE_LIMITER) {
          const { success } = await env.RATE_LIMITER.limit({ key: ip });
          if (!success) return json({ error: 'rate limited' }, cors, 429);
        }

        return json(await castVote(env, id, ip), cors);
      }

      return json({ error: 'not found' }, cors, 404);
    } catch (err) {
      console.error('worker error', err);
      return json({ error: 'internal error' }, cors, 500);
    }
  },
};

async function verifyTurnstile(secret, token, ip) {
  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);
    const r = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
    if (!r.ok) return false;
    const data = await r.json();
    return data && data.success === true;
  } catch (err) {
    console.error('turnstile verify error', err);
    return false;
  }
}

async function castVote(env, id, ip) {
  const cap = parseInt(env.DAILY_CAP, 10) || DEFAULT_DAILY_CAP;
  const today = new Date().toISOString().slice(0, 10);
  const dayKey = `day:${id}:${today}`;
  const todayCount = parseInt((await env.BLOG_IDEAS.get(dayKey)) || '0', 10);
  if (todayCount >= cap) {
    return { id, count: await getCount(env, id), voted: false };
  }

  const hash = await sha256(`${ip}:${id}`);
  const dedupKey = `dedup:${hash}`;
  if (await env.BLOG_IDEAS.get(dedupKey)) {
    return { id, count: await getCount(env, id), voted: false };
  }

  await env.BLOG_IDEAS.put(dedupKey, '1', { expirationTtl: 60 * 60 * 24 * 30 });
  const next = (await getCount(env, id)) + 1;
  await env.BLOG_IDEAS.put(`count:${id}`, String(next));
  await env.BLOG_IDEAS.put(dayKey, String(todayCount + 1), {
    expirationTtl: 60 * 60 * 48,
  });
  await registerId(env, id);
  return { id, count: next, voted: true };
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

function isBlockedAsn(request, env) {
  const asn = request.cf?.asn;
  if (typeof asn !== 'number') return false;
  if (env.BLOCKED_ASNS == null) return DEFAULT_BLOCKED_ASNS.has(asn);
  return toList(env.BLOCKED_ASNS).map(Number).includes(asn);
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
  const ok = isAllowedOrigin(origin, env);
  const fallback = toList(env.ALLOWED_ORIGIN)[0] || '';
  return {
    'Access-Control-Allow-Origin': ok ? origin : fallback,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Turnstile-Token',
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
