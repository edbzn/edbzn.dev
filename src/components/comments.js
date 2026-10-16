import React, { useEffect, useRef, useState } from 'react';
import Giscus from '@giscus/react';

// Height of the widget for a discussion with no comments yet (sign-in prompt
// and comment box), the same at every screen width. Reserved up front so the
// content below doesn't move when the widget loads.
const EMPTY_HEIGHT = 282;

// With comments the widget grows past that by an unknown amount. Mounting it
// well before it scrolls into view lets it reach its full height while the
// reader is still far above, where the move is off-screen. The iframe's own
// loading="lazy" starts much later, about 1250px out.
const ROOT_MARGIN = '2000px 0px';

export const Comments = ({ term, theme, lang }) => {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
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

  return (
    <div id="comments" ref={ref} style={{ minHeight: EMPTY_HEIGHT }}>
      {near && (
        <Giscus
          repo="edbzn/edbzn.dev"
          repoId="MDEwOlJlcG9zaXRvcnk5OTQ4MDU0Mw=="
          category="Comments"
          categoryId="DIC_kwDOBe3z384CkeQh"
          mapping="specific"
          term={term}
          strict="0"
          reactionsEnabled="0"
          emitMetadata="0"
          inputPosition="bottom"
          theme={theme}
          loading="eager"
          lang={lang}
        />
      )}
    </div>
  );
};
