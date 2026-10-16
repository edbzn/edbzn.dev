import { useLayoutEffect, useState } from 'react';

// Glyph width of the footer animations' 11px monospace font (0.6em).
const CHAR_W = 6.6;

// Number of grid columns that span the container, so the footer animations
// fill the full content width. Never fewer than `minCols`, the width of the
// drawing itself: on narrow screens the canvas scales down rather than crop it.
export function useFillColumns(containerRef, minCols) {
  const [cols, setCols] = useState(minCols);
  // Measured before paint: the canvas would otherwise show at `minCols` for a
  // frame, then widen, a layout shift when it is already in view.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const fit = (width) =>
      setCols(Math.max(minCols, Math.floor(width / CHAR_W)));
    fit(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      fit(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, minCols]);
  return cols;
}
