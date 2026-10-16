import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';

// The footer animations are code-split: each page only downloads the one it
// shows, and only once the reader scrolls near it.
const scenes = {
  globe: lazy(() =>
    import('./ascii-globe').then((m) => ({ default: m.AsciiGlobe }))
  ),
  'black-hole': lazy(() =>
    import('./ascii-black-hole').then((m) => ({ default: m.AsciiBlackHole }))
  ),
  galaxy: lazy(() =>
    import('./ascii-galaxy').then((m) => ({ default: m.AsciiGalaxy }))
  ),
};

// Every animation is 22 rows of 13px (see ROWS in each component).
const HEIGHT = 22 * 13;

// Start loading a little before the animation scrolls into view, so it is
// usually drawn by the time the reader gets there.
const ROOT_MARGIN = '400px 0px';

export const LazyAscii = ({ scene }) => {
  const Component = scenes[scene];
  const placeholderRef = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keeps the canvas's height reserved so the footer doesn't jump (narrow
  // screens scale the canvas down a little, but it loads off-screen).
  const placeholder = (
    <div ref={placeholderRef} aria-hidden="true" style={{ height: HEIGHT }} />
  );

  if (!near) return placeholder;
  return (
    <Suspense fallback={placeholder}>
      <Component />
    </Suspense>
  );
};
