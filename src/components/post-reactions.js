import React, { useEffect, useState, useCallback } from 'react';
import * as styles from './post-reactions.module.css';

const API = process.env.GATSBY_REACTIONS_API || '';
const REACTED_KEY = 'edbzn:reactions:reacted';
const EMOJIS = ['❤️', '🦄', '🔥', '👏', '🙌'];

const readReacted = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(REACTED_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeReacted = (data) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REACTED_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
};

const keyFor = (slug, emoji) => `${slug}:${emoji}`;

const PARTICLE_COUNT = 6;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => i);

export const PostReactions = ({ slug }) => {
  const [counts, setCounts] = useState({});
  const [reacted, setReacted] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState({});
  const [animating, setAnimating] = useState({});

  useEffect(() => {
    setReacted(readReacted());

    if (!API || !slug) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    fetch(`${API}/reactions/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (cancelled) return;
        if (data?.reactions) setCounts(data.reactions);
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const react = useCallback(
    async (emoji) => {
      const key = keyFor(slug, emoji);
      if (!API || reacted[key] || pending[key]) return;

      setPending((p) => ({ ...p, [key]: true }));
      setAnimating((a) => ({ ...a, [key]: (a[key] || 0) + 1 }));
      setCounts((c) => ({ ...c, [emoji]: (c[emoji] || 0) + 1 }));
      const nextReacted = { ...reacted, [key]: true };
      setReacted(nextReacted);
      writeReacted(nextReacted);

      try {
        const r = await fetch(`${API}/reactions/${encodeURIComponent(slug)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        setCounts((c) => ({ ...c, [emoji]: data.count }));
      } catch {
        setCounts((c) => ({
          ...c,
          [emoji]: Math.max(0, (c[emoji] || 1) - 1),
        }));
        const rolled = { ...reacted };
        delete rolled[key];
        setReacted(rolled);
        writeReacted(rolled);
      } finally {
        setPending((p) => {
          const n = { ...p };
          delete n[key];
          return n;
        });
      }
    },
    [slug, reacted, pending]
  );

  if (!slug) return null;

  return (
    <div className={styles.reactions}>
      {EMOJIS.map((emoji) => {
        const key = keyFor(slug, emoji);
        const didReact = !!reacted[key];
        const isPending = !!pending[key];
        const count = counts[emoji] || 0;
        const animKey = animating[key] || 0;

        return (
          <button
            key={emoji}
            type="button"
            className={`${styles.reaction} ${didReact ? styles.reacted : ''}`}
            onClick={() => react(emoji)}
            disabled={didReact || isPending || !API}
            aria-label={`React with ${emoji}`}
            aria-pressed={didReact}
          >
            <span className={styles.emojiWrap}>
              <span
                key={animKey}
                className={`${styles.emoji} ${animKey ? styles.emojiPop : ''}`}
              >
                {emoji}
              </span>
              {animKey ? (
                <span
                  key={`p-${animKey}`}
                  className={styles.particles}
                  aria-hidden="true"
                >
                  {PARTICLES.map((i) => (
                    <span
                      key={i}
                      className={styles.particle}
                      style={{ '--i': i, '--n': PARTICLE_COUNT }}
                    />
                  ))}
                </span>
              ) : null}
            </span>
            <span className={styles.count}>{loaded ? count : '·'}</span>
          </button>
        );
      })}
    </div>
  );
};
