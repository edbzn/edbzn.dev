import { useEffect, useState } from 'react';

// Glyph width of the footer animations' 11px monospace font (0.6em).
const CHAR_W = 6.6;

// Number of grid columns that span the container, so the footer animations
// fill the full content width. Never fewer than `minCols`, the width of the
// drawing itself: on narrow screens the canvas scales down rather than crop it.
export function useFillColumns(containerRef, minCols) {
  const [cols, setCols] = useState(minCols);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setCols(Math.max(minCols, Math.floor(entry.contentRect.width / CHAR_W)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, minCols]);
  return cols;
}
