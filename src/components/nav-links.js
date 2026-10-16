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
 * current post title on article pages), it is rendered after "Blog" as the
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

  return (
    <div
      ref={containerRef}
      className="site-nav-links"
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        background: 'var(--nav-pill-bg)',
        borderRadius: '8px',
        padding: '3px',
        position: 'relative',
      }}
    >
      {indicator && (
        <div
          aria-hidden="true"
          className="nav-indicator"
          style={{
            position: 'absolute',
            top: '3px',
            bottom: '3px',
            left: indicator.left,
            width: indicator.width,
            background: 'var(--nav-active-bg)',
            borderRadius: '6px',
            transition:
              'left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 0,
          }}
        />
      )}
      {links.map(({ to, label }) => {
        const active = isActive(to, pathname);
        const crumb = to === '/blog' && active && breadcrumb;
        return (
          <React.Fragment key={to}>
            <Link
              to={to}
              ref={(el) => {
                linkRefs.current[to] = el;
              }}
              className="site-nav-link"
              aria-current={active && !crumb ? 'page' : undefined}
              onMouseEnter={() => handleMouseEnter(to)}
              style={{
                boxShadow: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                lineHeight: '1.2',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {label}
            </Link>
            {crumb && (
              <>
                <span className="site-nav-crumb-separator" aria-hidden="true">
                  ›
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
          </React.Fragment>
        );
      })}
    </div>
  );
};
