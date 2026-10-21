import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'gatsby';

const links = [
  { to: '/', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/uses', label: 'Uses' },
];

function isActive(to, pathname) {
  if (to === '/') return pathname === '/';
  return pathname.startsWith(to);
}

/**
 * Section links shown in the header pill. When `breadcrumb` is given (the
 * current post title on article pages), it is rendered after the pill as the
 * current sub page: Blog stays highlighted as the active section, the title is
 * plain text marked as the current page and truncated with an ellipsis.
 */
export const NavLinks = ({ pathname, breadcrumb }) => {
  const containerRef = useRef(null);
  const linkRefs = useRef({});
  const [indicator, setIndicator] = useState(null);
  const [hoveredTo, setHoveredTo] = useState(null);

  const measureLink = useCallback((to) => {
    const container = containerRef.current;
    const el = linkRefs.current[to];
    if (!container || !el) return null;

    const containerRect = container.getBoundingClientRect();
    const linkRect = el.getBoundingClientRect();
    return {
      left: linkRect.left - containerRect.left,
      width: linkRect.width,
    };
  }, []);

  const updateIndicator = useCallback(() => {
    const target = hoveredTo || links.find((l) => isActive(l.to, pathname))?.to;
    if (!target) {
      setIndicator(null);
      return;
    }
    const pos = measureLink(target);
    if (pos) setIndicator(pos);
  }, [pathname, hoveredTo, measureLink]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  // Re-measure whenever the pill changes size: window resizes, but also web
  // fonts loading late or the breadcrumb title shrinking, which shift the links.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => updateIndicator());
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateIndicator]);

  const handleMouseEnter = (to) => {
    setHoveredTo(to);
  };

  const handleMouseLeave = () => {
    setHoveredTo(null);
  };

  const crumb = breadcrumb && isActive('/blog', pathname);

  return (
    <>
      <div
        ref={containerRef}
        className="site-nav-links"
        onMouseLeave={handleMouseLeave}
      >
        {indicator && (
          <div
            aria-hidden="true"
            className="site-nav-indicator"
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}
        {links.map(({ to, label }) => {
          const active = isActive(to, pathname);
          return (
            <Link
              key={to}
              to={to}
              ref={(el) => {
                linkRefs.current[to] = el;
              }}
              className="site-nav-link"
              data-active={active || undefined}
              aria-current={active && !crumb ? 'page' : undefined}
              onMouseEnter={() => handleMouseEnter(to)}
            >
              {label}
            </Link>
          );
        })}
      </div>
      {crumb && (
        <>
          <span className="site-nav-crumb-separator" aria-hidden="true">
            /
          </span>
          <span
            className="site-nav-crumb"
            aria-current="page"
            title={breadcrumb}
          >
            {breadcrumb}
          </span>
        </>
      )}
    </>
  );
};
