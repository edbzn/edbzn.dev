import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as styles from './blog-ideas.module.css';

const API = process.env.GATSBY_IDEAS_API || '';
const TURNSTILE_SITE_KEY = process.env.GATSBY_TURNSTILE_SITE_KEY || '';
const TURNSTILE_SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const VOTED_KEY = 'edbzn:blog-ideas:voted';

const readVoted = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(VOTED_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeVoted = (voted) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VOTED_KEY, JSON.stringify(voted));
  } catch {
    /* quota / private mode — ignore */
  }
};

let turnstileReady = null;
const loadTurnstile = () => {
  if (typeof window === 'undefined' || !TURNSTILE_SITE_KEY) return null;
  if (turnstileReady) return turnstileReady;

  turnstileReady = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const existing = document.querySelector(
      `script[src^="${TURNSTILE_SCRIPT}"]`
    );
    const onReady = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('turnstile not ready'));
    };
    if (existing) {
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('turnstile failed')),
        {
          once: true,
        }
      );
      return;
    }
    const s = document.createElement('script');
    s.src = TURNSTILE_SCRIPT;
    s.async = true;
    s.defer = true;
    s.addEventListener('load', onReady, { once: true });
    s.addEventListener('error', () => reject(new Error('turnstile failed')), {
      once: true,
    });
    document.head.appendChild(s);
  });
  return turnstileReady;
};

/**
 * List of blog-post ideas that readers can upvote without auth.
 *
 * Props:
 *   ideas — [{ id, title, description? }]
 *           `id` must match /^[a-z0-9][a-z0-9-]{0,63}$/.
 */
export const BlogIdeas = ({ ideas = [] }) => {
  const [counts, setCounts] = useState({});
  const [voted, setVoted] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState({});
  const widgetHostRef = useRef(null);
  const widgetIdRef = useRef(null);
  const tokenPromiseRef = useRef(null);

  useEffect(() => {
    setVoted(readVoted());

    if (!API) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    fetch(`${API}/votes`, { method: 'GET' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (cancelled) return;
        setCounts(data || {});
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Preload the Turnstile script eagerly so the first click doesn't wait on it.
  useEffect(() => {
    loadTurnstile()?.catch(() => {
      /* network issue — voting falls back to no-token path */
    });
  }, []);

  const getTurnstileToken = useCallback(async () => {
    if (!TURNSTILE_SITE_KEY) return '';
    const turnstile = await loadTurnstile();
    if (!turnstile || !widgetHostRef.current) return '';

    // Serialize token fetches — Turnstile rejects concurrent execute() calls
    // on the same widget with a warning and no token.
    if (tokenPromiseRef.current) return tokenPromiseRef.current;

    const p = new Promise((resolve, reject) => {
      const cleanup = () => {
        tokenPromiseRef.current = null;
      };
      const onToken = (token) => {
        cleanup();
        resolve(token);
      };
      const onError = (err) => {
        cleanup();
        reject(err);
      };

      if (widgetIdRef.current == null) {
        widgetIdRef.current = turnstile.render(widgetHostRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: onToken,
          'error-callback': () => onError(new Error('turnstile error')),
          'expired-callback': () => onError(new Error('turnstile expired')),
        });
        // First render auto-executes; nothing else to do.
        return;
      }

      // Subsequent calls: reset any leftover state, then execute.
      try {
        turnstile.reset(widgetIdRef.current);
      } catch {
        /* reset can throw if widget not yet initialized — safe to ignore */
      }
      try {
        turnstile.execute(widgetIdRef.current);
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    });

    tokenPromiseRef.current = p;
    return p;
  }, []);

  const vote = useCallback(
    async (id) => {
      if (!API || voted[id] || pending[id]) return;

      setPending((p) => ({ ...p, [id]: true }));
      // Optimistic update
      setCounts((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
      const nextVoted = { ...voted, [id]: true };
      setVoted(nextVoted);
      writeVoted(nextVoted);

      try {
        let token = '';
        try {
          token = await getTurnstileToken();
        } catch {
          /* fall through — Worker will reject if Turnstile is required */
        }

        const r = await fetch(`${API}/vote/${encodeURIComponent(id)}`, {
          method: 'POST',
          headers: token ? { 'X-Turnstile-Token': token } : undefined,
        });
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        setCounts((c) => ({ ...c, [id]: data.count }));
      } catch {
        // Rollback optimistic update
        setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] || 1) - 1) }));
        const rolled = { ...voted };
        delete rolled[id];
        setVoted(rolled);
        writeVoted(rolled);
      } finally {
        setPending((p) => {
          const n = { ...p };
          delete n[id];
          return n;
        });
      }
    },
    [voted, pending, getTurnstileToken]
  );

  return (
    <>
      <ul className={styles.list}>
        {ideas.map((idea) => {
          const count = counts[idea.id] || 0;
          const didVote = !!voted[idea.id];
          const isPending = !!pending[idea.id];
          return (
            <li key={idea.id} className={styles.item}>
              <button
                type="button"
                className={`${styles.button} ${didVote ? styles.voted : ''}`}
                onClick={() => vote(idea.id)}
                disabled={didVote || isPending || !API}
                aria-label={`Upvote ${idea.title}`}
                aria-pressed={didVote}
              >
                <span className={styles.arrow} aria-hidden="true">
                  ▲
                </span>
                <span className={styles.count}>{loaded ? count : '·'}</span>
              </button>
              <div className={styles.body}>
                <div className={styles.title}>{idea.title}</div>
                {idea.description && (
                  <div className={styles.description}>{idea.description}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {/* Host for the invisible Turnstile widget. It must stay in layout
          (not display:none) so Turnstile can inject its iframe. */}
      <div
        ref={widgetHostRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export default BlogIdeas;
