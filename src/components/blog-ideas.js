import React, { useEffect, useState, useCallback } from 'react';
import * as styles from './blog-ideas.module.css';

const API = process.env.GATSBY_IDEAS_API || '';
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
        const r = await fetch(`${API}/vote/${encodeURIComponent(id)}`, {
          method: 'POST',
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
    [voted, pending]
  );

  return (
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
  );
};

export default BlogIdeas;
