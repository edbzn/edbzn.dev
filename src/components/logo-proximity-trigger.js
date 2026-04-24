import React, { useEffect } from 'react';

/**
 * Triggers the compass logo's `compass-seek` animation when the pointer
 * approaches the top bar, without degrading runtime performance:
 *
 *   - a single pointermove listener, coalesced to at most one update per
 *     animation frame via requestAnimationFrame;
 *   - the header height is cached (updated via ResizeObserver) so the hot
 *     path does no DOM reads / layout work;
 *   - the `.logo-active` class is toggled only on threshold transitions,
 *     avoiding repeated style writes while the pointer lingers in range.
 */
export function LogoProximityTrigger({ threshold = 160 }) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    // Skip on touch-only devices — hovering a topbar isn't meaningful there.
    if (!window.matchMedia?.('(hover: hover)').matches) {
      return undefined;
    }

    const logo = document.querySelector('.logo-inner');
    const header = document.querySelector('.site-header');
    if (!logo || !header) return undefined;

    let headerBottom = header.getBoundingClientRect().height;
    let inRange = false;
    let scheduled = false;
    let lastY = -1;

    const resizeObserver = new ResizeObserver((entries) => {
      headerBottom = entries[0].contentRect.height;
    });
    resizeObserver.observe(header);

    const update = () => {
      scheduled = false;
      const shouldBeInRange = lastY >= 0 && lastY <= headerBottom + threshold;
      if (shouldBeInRange === inRange) return;
      inRange = shouldBeInRange;
      if (inRange) {
        // Restart the animation by removing then re-adding the class on the
        // next frame (class removal alone doesn't force a reflow reliably).
        logo.classList.remove('logo-active');
        // eslint-disable-next-line no-unused-expressions
        logo.offsetWidth; // force reflow so the re-added class restarts keyframes
        logo.classList.add('logo-active');
      } else {
        logo.classList.remove('logo-active');
      }
    };

    const onPointerMove = (event) => {
      lastY = event.clientY;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      logo.classList.remove('logo-active');
    };
  }, [threshold]);

  return null;
}
